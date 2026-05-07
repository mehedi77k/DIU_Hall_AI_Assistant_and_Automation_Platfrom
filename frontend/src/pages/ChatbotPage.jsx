import { useEffect, useState } from 'react'

const API_BASE_URL = 'http://localhost:8000'
const DEFAULT_CHAT_TITLE = 'New chat'

const SUGGESTED_PROMPTS = [
  'Can visitors enter my room?',
  'What is the night out rule?',
  'Can I use a heater in the hostel?',
  'How do I make a dining complaint?',
  'What happens if someone smokes in the hall?',
  'What is rule 12?',
]

const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token')

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
})

const createDraftChat = () => ({
  id: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title: DEFAULT_CHAT_TITLE,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  messagesLoaded: true,
})

const buildChatTitle = (text) => {
  const trimmed = text.trim()
  if (!trimmed) return DEFAULT_CHAT_TITLE
  return trimmed.length > 46 ? `${trimmed.slice(0, 46)}...` : trimmed
}

const toTime = (dateValue) => {
  const parsed = Date.parse(dateValue)
  return Number.isNaN(parsed) ? Date.now() : parsed
}

const normalizeSession = (session) => ({
  id: session.id,
  title: session.title || DEFAULT_CHAT_TITLE,
  createdAt: toTime(session.created_at),
  updatedAt: toTime(session.updated_at),
  messages: [],
  messagesLoaded: false,
})

const normalizeMessage = (message) => ({
  id: `server-msg-${message.id}`,
  role: message.role,
  text: message.text,
  matched_rules: message.matched_rules || [],
})

const isServerChatId = (id) => typeof id === 'number'

const isEmptyDraftChat = (chat) =>
  !isServerChatId(chat.id) && chat.messages.length === 0

function getErrorMessage(data, fallback) {
  if (!data) return fallback

  if (typeof data.detail === 'string') {
    return data.detail
  }

  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item.msg).join(', ')
  }

  return fallback
}

export default function ChatbotPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  const loadMessages = async (sessionId) => {
    if (!isServerChatId(sessionId)) return

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/messages`,
        {
          method: 'GET',
          headers: authHeaders(),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setError(getErrorMessage(data, 'Failed to load chat messages'))
        return
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === sessionId
            ? {
                ...chat,
                messages: data.map(normalizeMessage),
                messagesLoaded: true,
              }
            : chat,
        ),
      )
    } catch (err) {
      setError('Backend server is not responding. Please check backend container.')
    }
  }

  const loadSessions = async () => {
    setInitialLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions`, {
        method: 'GET',
        headers: authHeaders(),
      })

      const data = await response.json()
      const draft = createDraftChat()

      if (!response.ok) {
        setError(getErrorMessage(data, 'Failed to load chat history'))
        setChats([draft])
        setActiveChatId(draft.id)
        return
      }

      const normalizedSessions = Array.isArray(data)
        ? data.map(normalizeSession)
        : []

      // Always show a fresh empty chat when opening the chatbot page.
      // Existing saved chats stay in the sidebar as recent chats.
      setChats([draft, ...normalizedSessions])
      setActiveChatId(draft.id)
    } catch (err) {
      setError('Backend server is not responding. Please check backend container.')

      const draft = createDraftChat()
      setChats([draft])
      setActiveChatId(draft.id)
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNewChat = () => {
    const existingEmptyDraft = chats.find(isEmptyDraftChat)

    if (existingEmptyDraft) {
      setActiveChatId(existingEmptyDraft.id)
      setInput('')
      setLoading(false)
      setError('')
      return
    }

    const newChat = createDraftChat()

    setChats((prev) => [newChat, ...prev])
    setActiveChatId(newChat.id)
    setInput('')
    setLoading(false)
    setError('')
  }

  const handleEditChat = (chat) => {
    setEditingChatId(chat.id)
    setEditingTitle(chat.title)
  }

  const handleCancelEdit = () => {
    setEditingChatId(null)
    setEditingTitle('')
  }

  const handleSaveEdit = async () => {
    const trimmed = editingTitle.trim()

    if (!trimmed || editingChatId === null) {
      handleCancelEdit()
      return
    }

    if (!isServerChatId(editingChatId)) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === editingChatId ? { ...chat, title: trimmed } : chat,
        ),
      )
      handleCancelEdit()
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/sessions/${editingChatId}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ title: trimmed }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setError(getErrorMessage(data, 'Failed to rename chat'))
        return
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === editingChatId
            ? {
                ...chat,
                title: data.title,
                updatedAt: toTime(data.updated_at),
              }
            : chat,
        ),
      )

      handleCancelEdit()
    } catch (err) {
      setError('Backend server is not responding. Please check backend container.')
    }
  }

  const removeChatFromState = (id) => {
    setChats((prev) => {
      const next = prev.filter((chat) => chat.id !== id)

      if (next.length === 0) {
        const fresh = createDraftChat()
        setActiveChatId(fresh.id)
        return [fresh]
      }

      if (id === activeChatId) {
        const emptyDraft = next.find(isEmptyDraftChat)
        const nextActiveChat = emptyDraft || next[0]

        setActiveChatId(nextActiveChat.id)

        if (isServerChatId(nextActiveChat.id) && !nextActiveChat.messagesLoaded) {
          loadMessages(nextActiveChat.id)
        }
      }

      return next
    })
  }

  const handleDeleteChat = async (id) => {
    if (!isServerChatId(id)) {
      removeChatFromState(id)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(getErrorMessage(data, 'Failed to delete chat'))
        return
      }

      removeChatFromState(id)
    } catch (err) {
      setError('Backend server is not responding. Please check backend container.')
    }
  }

  const handleOpenChat = async (id) => {
    setActiveChatId(id)
    setInput('')
    setError('')

    const chat = chats.find((item) => item.id === id)

    if (isServerChatId(id) && chat && !chat.messagesLoaded) {
      await loadMessages(id)
    }
  }

  const activeChat = chats.find((chat) => chat.id === activeChatId)
  const messages = activeChat?.messages ?? []
  const hasUserMessages = messages.some((message) => message.role === 'user')

  const filteredChats = chats
    .filter((chat) => {
      // Do not show the current empty draft chat in recent history.
      if (isEmptyDraftChat(chat)) return false

      const query = searchTerm.trim().toLowerCase()
      if (!query) return true

      return (
        chat.title.toLowerCase().includes(query) ||
        chat.messages.some((message) => message.text.toLowerCase().includes(query))
      )
    })
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6)

  const handleSend = async (overrideText) => {
    const messageText = (overrideText ?? input).trim()

    if (!messageText || loading || !activeChatId) return

    const currentChatId = activeChatId
    const currentInput = messageText
    const currentSessionId = isServerChatId(currentChatId) ? currentChatId : null

    const userMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role: 'user',
      text: currentInput,
    }

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== currentChatId) return chat

        const nextTitle =
          chat.title === DEFAULT_CHAT_TITLE ? buildChatTitle(currentInput) : chat.title

        return {
          ...chat,
          title: nextTitle,
          updatedAt: Date.now(),
          messagesLoaded: true,
          messages: [...chat.messages, userMessage],
        }
      }),
    )

    setInput('')
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          session_id: currentSessionId,
          message: currentInput,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Chatbot request failed. Please try again.'))
      }

      const botMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: 'assistant',
        text: data.answer || 'No response received.',
        matched_rules: data.matched_rules || [],
      }

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== currentChatId) return chat

          return {
            ...chat,
            id: data.session_id || chat.id,
            updatedAt: Date.now(),
            messagesLoaded: true,
            messages: [...chat.messages, botMessage],
          }
        }),
      )

      if (!currentSessionId && data.session_id) {
        setActiveChatId(data.session_id)
      }
    } catch (err) {
      const errorMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: 'assistant',
        text: err.message || 'Chatbot request failed. Please try again.',
        matched_rules: [],
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                updatedAt: Date.now(),
                messages: [...chat.messages, errorMessage],
              }
            : chat,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>Hall Rules Assistant</h1>
        <p className="page-lead">
          Ask questions about the hall rules and code of conduct.
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="chat-layout-grid">
        <aside className="chat-sidebar">
          <button className="chat-new-button" onClick={handleNewChat}>
            + New chat
          </button>

          <div className="chat-search">
            <input
              type="text"
              placeholder="Search chats"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="chat-recents">
            <div className="chat-recents-title">Recents</div>

            <div className="chat-recents-list">
              {initialLoading ? (
                <div className="chat-recents-empty">Loading chats...</div>
              ) : filteredChats.length === 0 ? (
                <div className="chat-recents-empty">No recent chats</div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-recent-item ${
                      chat.id === activeChatId ? 'active' : ''
                    }`}
                    onClick={() => handleOpenChat(chat.id)}
                  >
                    {editingChatId === chat.id ? (
                      <div className="chat-recent-edit">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                        />

                        <div className="chat-recent-actions">
                          <button
                            type="button"
                            className="chat-recent-button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleSaveEdit()
                            }}
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            className="chat-recent-button delete"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleCancelEdit()
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="chat-recent-title">{chat.title}</div>

                        <div className="chat-recent-actions">
                          <button
                            type="button"
                            className="chat-recent-button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleEditChat(chat)
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="chat-recent-button delete"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDeleteChat(chat.id)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="chat-main">
          <div className="chat-shell">
            <div className="chat-messages">
              {!hasUserMessages && !initialLoading && (
                <div className="chat-empty-state">
                  <div className="chat-empty-title">Where should we begin?</div>

                  <div className="chat-empty-subtitle">
                    Ask about visitors, night-outs, appliances, complaints, fines, or any
                    rule number.
                  </div>

                  <div className="chat-suggested">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="chat-suggested-chip"
                        onClick={() => handleSend(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={message.id || index}>
                  {message.role === 'assistant' ? (
                    <div className="chat-response">
                      <div className="chat-response-icon" aria-hidden="true">
                        AI
                      </div>

                      <div className="chat-response-body">
                        <div className="chat-response-text">{message.text}</div>

                        {message.matched_rules?.length > 0 && (
                          <div className="chat-response-sources">
                            <div className="chat-response-sources-title">Sources</div>

                            <ul>
                              {message.matched_rules.map((rule) => (
                                <li key={rule.id}>
                                  Rule {rule.rule_number} | {rule.section} | Page{' '}
                                  {rule.page}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="chat-bubble user">
                      <div style={{ whiteSpace: 'pre-line' }}>{message.text}</div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="chat-response">
                  <div className="chat-response-icon" aria-hidden="true">
                    AI
                  </div>

                  <div className="chat-response-body">
                    <div className="chat-response-text">Searching hall rules...</div>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-row">
              <input
                type="text"
                placeholder="Type your question..."
                value={input}
                disabled={initialLoading}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSend()
                  }
                }}
              />

              <button onClick={() => handleSend()} disabled={loading || initialLoading}>
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}