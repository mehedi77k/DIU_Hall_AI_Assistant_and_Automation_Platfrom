import { useEffect, useState } from 'react'

const CHAT_STORAGE_KEY = 'chatbotChats'
const ACTIVE_CHAT_KEY = 'chatbotActiveChat'
const DEFAULT_CHAT_TITLE = 'New chat'
const SUGGESTED_PROMPTS = [
  'Can visitors enter my room?',
  'What is the night out rule?',
  'Can I use a heater in the hostel?',
  'How do I make a dining complaint?',
  'What happens if someone smokes in the hall?',
  'What is rule 12?',
]

const createChat = () => ({
  id: `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title: DEFAULT_CHAT_TITLE,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
})

const buildChatTitle = (text) => {
  const trimmed = text.trim()
  if (!trimmed) return DEFAULT_CHAT_TITLE
  return trimmed.length > 46 ? `${trimmed.slice(0, 46)}...` : trimmed
}

export default function ChatbotPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY)
    const storedActive = localStorage.getItem(ACTIVE_CHAT_KEY)

    if (!stored) {
      const initialChat = createChat()
      setChats([initialChat])
      setActiveChatId(initialChat.id)
      return
    }

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.every((chat) => Array.isArray(chat.messages))) {
        setChats(parsed)
        const activeExists = parsed.some((chat) => chat.id === storedActive)
        setActiveChatId(activeExists ? storedActive : parsed[0]?.id || null)
      } else {
        const initialChat = createChat()
        setChats([initialChat])
        setActiveChatId(initialChat.id)
      }
    } catch (error) {
      console.error('Failed to parse chats', error)
      const initialChat = createChat()
      setChats([initialChat])
      setActiveChatId(initialChat.id)
    }
  }, [])

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats))
    }
  }, [chats])

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId)
    }
  }, [activeChatId])

  const handleNewChat = () => {
    const newChat = createChat()
    setChats((prev) => [newChat, ...prev])
    setActiveChatId(newChat.id)
    setInput('')
    setLoading(false)
  }

  const handleEditChat = (chat) => {
    setEditingChatId(chat.id)
    setEditingTitle(chat.title)
  }

  const handleCancelEdit = () => {
    setEditingChatId(null)
    setEditingTitle('')
  }

  const handleSaveEdit = () => {
    const trimmed = editingTitle.trim()
    if (!trimmed) {
      handleCancelEdit()
      return
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === editingChatId ? { ...chat, title: trimmed } : chat,
      ),
    )
    handleCancelEdit()
  }

  const handleDeleteChat = (id) => {
    setChats((prev) => {
      const next = prev.filter((chat) => chat.id !== id)
      if (next.length === 0) {
        const fresh = createChat()
        setActiveChatId(fresh.id)
        return [fresh]
      }

      if (id === activeChatId) {
        setActiveChatId(next[0].id)
      }

      return next
    })
  }

  const handleOpenChat = (id) => {
    setActiveChatId(id)
    setInput('')
  }

  const activeChat = chats.find((chat) => chat.id === activeChatId)
  const messages = activeChat?.messages ?? []
  const hasUserMessages = messages.some((message) => message.role === 'user')

  const filteredChats = chats
    .filter((chat) => {
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

    const currentInput = messageText
    const userMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role: 'user',
      text: currentInput,
    }

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat

        const nextTitle =
          chat.title === DEFAULT_CHAT_TITLE ? buildChatTitle(currentInput) : chat.title

        return {
          ...chat,
          title: nextTitle,
          updatedAt: Date.now(),
          messages: [...chat.messages, userMessage],
        }
      }),
    )
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      })

      const data = await response.json()

      const botMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: 'assistant',
        text: data.answer || 'No response received.',
        matched_rules: data.matched_rules || [],
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                updatedAt: Date.now(),
                messages: [...chat.messages, botMessage],
              }
            : chat,
        ),
      )
    } catch (error) {
      const errorMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: 'assistant',
        text: 'Chatbot request failed. Please try again.',
        matched_rules: [],
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
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
              {filteredChats.length === 0 ? (
                <div className="chat-recents-empty">No recent chats</div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-recent-item ${chat.id === activeChatId ? 'active' : ''}`}
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
              {!hasUserMessages && (
                <div className="chat-empty-state">
                  <div className="chat-empty-title">Where should we begin?</div>
                  <div className="chat-empty-subtitle">
                    Ask about visitors, night-outs, appliances, complaints, fines, or any rule number.
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
                      <div className="chat-response-icon" aria-hidden="true">AI</div>
                      <div className="chat-response-body">
                        <div className="chat-response-text">{message.text}</div>

                        {message.matched_rules?.length > 0 && (
                          <div className="chat-response-sources">
                            <div className="chat-response-sources-title">Sources</div>
                            <ul>
                              {message.matched_rules.map((rule) => (
                                <li key={rule.id}>
                                  Rule {rule.rule_number} | {rule.section} | Page {rule.page}
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
                  <div className="chat-response-icon" aria-hidden="true">AI</div>
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
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSend()
                  }
                }}
              />
              <button onClick={handleSend} disabled={loading}>
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



