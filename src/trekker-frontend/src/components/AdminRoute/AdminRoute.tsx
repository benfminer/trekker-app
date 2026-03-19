import { Navigate, Outlet } from "react-router-dom"
import { isAdminAuthenticated } from "../../lib/auth"

// ---------------------------------------------------------------------------
// AdminRoute — protected route wrapper.
//
// Checks for a stored token in localStorage. If none is found, redirects to
// /admin/login. If found, renders the nested routes via <Outlet />.
//
// This is a client-side guard only. Every admin API call enforces the token
// server-side — an invalid or expired token will result in a 401, which the
// admin page handles by redirecting back to login and clearing the token.
// ---------------------------------------------------------------------------

export function AdminRoute() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
