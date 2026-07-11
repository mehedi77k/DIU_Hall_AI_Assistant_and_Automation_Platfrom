export const REALTIME_EVENT_NAME = 'diu:realtime'

export function emitRealtimeEvent(message) {
  window.dispatchEvent(
    new CustomEvent(REALTIME_EVENT_NAME, {
      detail: message,
    }),
  )
}
