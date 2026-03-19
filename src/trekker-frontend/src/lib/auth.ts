// ---------------------------------------------------------------------------
// Auth token utilities
//
// The admin token is a raw Bearer token returned once by POST /admin/sessions.
// We store it in localStorage so it survives page refreshes.
//
// Never store anything more sensitive here. The token is opaque to the client —
// the server validates it on every request.
// ---------------------------------------------------------------------------

const TOKEN_KEY = "trekker_admin_token"

/**
 * Retrieve the stored admin token, or null if not present.
 */
export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Persist the admin token after a successful login.
 */
export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Remove the admin token on logout or when a 401 is received.
 */
export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Returns true if a token is present in localStorage.
 * Does not validate the token against the server — use this only for
 * client-side route guarding. The server will reject an expired or invalid
 * token on the first authenticated request.
 */
export function isAdminAuthenticated(): boolean {
  return getAdminToken() !== null
}
