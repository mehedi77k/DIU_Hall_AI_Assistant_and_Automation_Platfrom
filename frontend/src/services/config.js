const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/$/, '')
  : `${window.location.protocol}//${window.location.hostname}:8000`

export const REALTIME_WS_URL = API_BASE_URL.replace(/^http/, 'ws') + '/api/v1/ws'
