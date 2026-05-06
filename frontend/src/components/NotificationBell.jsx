import { useEffect, useRef, useState } from 'react'

const API_BASE_URL = 'http://localhost:8000'

function formatNotificationTime(value) {
  if (!value) return ''

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

export default function NotificationBell() {
  const token = sessionStorage.getItem('token')
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const wrapperRef = useRef(null)

  const unreadCount = items.filter((item) => !item.is_read).length

  const loadNotifications = async () => {
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Failed to load notifications')
        setItems([])
        return
      }

      setItems(data)
    } catch {
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()

    if (!token) return undefined

    const intervalId = window.setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [token])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification) => {
    if (notification.is_read) {
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/notifications/${notification.id}/read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Failed to mark notification as read')
        return
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === data.id ? { ...item, is_read: true } : item
        )
      )
    } catch {
      setError('Failed to mark notification as read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications/read-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Failed to mark all notifications as read')
        return
      }

      setItems((currentItems) => currentItems.map((item) => ({ ...item, is_read: true })))
    } catch {
      setError('Failed to mark all notifications as read')
    }
  }

  return (
    <div className="notification-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notification-bell-button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 17h5l-1.5-1.5V11a6.5 6.5 0 10-13 0v4.5L4 17h5" />
          <path d="M10 19a2 2 0 004 0" />
        </svg>

        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div className="notification-dropdown-title">Notifications</div>
            <button
              type="button"
              className="notification-mark-all"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          <div className="notification-dropdown-body">
            {loading && <div className="notification-state">Loading notifications...</div>}
            {!loading && error && <div className="notification-state">{error}</div>}
            {!loading && !error && items.length === 0 && (
              <div className="notification-state">No notifications yet.</div>
            )}

            {!loading && !error &&
              items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item-title">{notification.title}</div>
                  <div className="notification-item-message">{notification.message}</div>
                  <div className="notification-item-meta">
                    {formatNotificationTime(notification.created_at)}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
