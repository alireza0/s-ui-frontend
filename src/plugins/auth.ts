// Whether the panel believes it has a session.
//
// This used to be read straight off document.cookie. The session cookie is now
// HttpOnly -- it has to be, or any XSS in the panel hands the session over -- so
// script cannot see it any more and the router needs its own record.
//
// It is a hint, not an authority. The server decides on every request, and a
// flag that outlives its session simply means the first API call comes back
// "Invalid login" and clears it. The server-side guard also redirects an
// unauthenticated page load, so a stale flag cannot expose anything.
const KEY = 's-ui-auth'

export function setAuthenticated(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // Private mode, or storage disabled. The session still works; only the
    // client-side redirect does not.
  }
}

export function clearAuthenticated(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to do: there is no flag to clear.
  }
}

export function isAuthenticated(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
