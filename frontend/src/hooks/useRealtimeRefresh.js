import { useEffect, useRef } from 'react'
import { REALTIME_EVENT_NAME } from '../services/realtime'

export default function useRealtimeRefresh(eventTypes, handler) {
  const handlerRef = useRef(handler)
  const normalizedTypes = Array.isArray(eventTypes) ? eventTypes : [eventTypes]
  const eventKey = normalizedTypes.join('|')

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const acceptedTypes = new Set(eventKey.split('|').filter(Boolean))

    const listener = (event) => {
      const message = event.detail

      if (!message?.type) {
        return
      }

      // Refresh once after the socket connects/reconnects so changes that
      // happened during a short disconnection are not missed.
      if (message.type !== 'connection.ready' && !acceptedTypes.has(message.type)) {
        return
      }

      handlerRef.current?.(message)
    }

    window.addEventListener(REALTIME_EVENT_NAME, listener)
    return () => window.removeEventListener(REALTIME_EVENT_NAME, listener)
  }, [eventKey])
}
