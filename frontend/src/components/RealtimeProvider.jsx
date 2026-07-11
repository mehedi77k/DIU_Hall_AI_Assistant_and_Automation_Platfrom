import { useEffect } from 'react'
import { REALTIME_WS_URL } from '../services/config'
import { emitRealtimeEvent } from '../services/realtime'

function getStoredToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token') || ''
}

export default function RealtimeProvider({ children }) {
  const token = getStoredToken()

  useEffect(() => {
    if (!token) {
      return undefined
    }

    let socket = null
    let reconnectTimer = null
    let heartbeatTimer = null
    let reconnectAttempt = 0
    let stopped = false

    const clearTimers = () => {
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
        reconnectTimer = null
      }

      if (heartbeatTimer) {
        window.clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
    }

    const scheduleReconnect = () => {
      if (stopped || reconnectTimer) return

      const delay = Math.min(1000 * 2 ** reconnectAttempt, 15000)
      reconnectAttempt += 1

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null
        connect()
      }, delay)
    }

    const connect = () => {
      if (stopped) return

      socket = new WebSocket(REALTIME_WS_URL)

      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({ type: 'auth', token }))
      })

      socket.addEventListener('message', (event) => {
        let message = null

        try {
          message = JSON.parse(event.data)
        } catch {
          return
        }

        if (message.type === 'connection.ready') {
          reconnectAttempt = 0

          if (heartbeatTimer) {
            window.clearInterval(heartbeatTimer)
          }

          heartbeatTimer = window.setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'ping' }))
            }
          }, 20000)
        }

        emitRealtimeEvent(message)
      })

      socket.addEventListener('close', () => {
        if (heartbeatTimer) {
          window.clearInterval(heartbeatTimer)
          heartbeatTimer = null
        }

        scheduleReconnect()
      })

      socket.addEventListener('error', () => {
        socket?.close()
      })
    }

    connect()

    return () => {
      stopped = true
      clearTimers()

      if (socket && socket.readyState <= WebSocket.OPEN) {
        socket.close(1000, 'Page closed')
      }
    }
  }, [token])

  return children
}
