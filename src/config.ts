// Centralized API base URL for client
// Priority: VITE_API_URL → VITE_CLIENT_URL → dev fallback (http://localhost:5050) → window.location.origin
// Ensures no trailing slash and appends `/api` segment.
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '')

const apiOrigin =
  (import.meta.env.API_URL as string | undefined)?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:5050' : window.location.origin)

export const API_BASE_URL = `${stripTrailingSlash(apiOrigin)}/api`
