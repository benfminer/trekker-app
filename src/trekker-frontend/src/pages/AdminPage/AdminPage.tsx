import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { adminLogout } from "../../lib/api"
import { clearAdminToken, getAdminToken } from "../../lib/auth"

// ---------------------------------------------------------------------------
// AdminPage — /admin
//
// Protected by <AdminRoute>. Renders the admin dashboard shell with a working
// logout action. The submission table will be built in the next phase.
//
// Logout flow:
//   1. Call DELETE /admin/sessions to invalidate the server-side session.
//   2. Clear the token from localStorage regardless of API outcome —
//      if the server is unreachable, we still want the user logged out locally.
//   3. Redirect to /admin/login.
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    const token = getAdminToken()

    if (token) {
      try {
        await adminLogout(token)
      } catch {
        // Swallow — token may already be expired. Clear locally regardless.
      }
    }

    clearAdminToken()
    navigate("/admin/login", { replace: true })
  }, [navigate])

  return (
    <div className="flex flex-1 flex-col">
      {/* Admin sub-header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between">
          <h1
            className="text-lg font-bold uppercase tracking-wide text-white"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Submissions
          </h1>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-md border border-white/15 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white/60 transition-colors duration-100 hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 disabled:opacity-40"
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>

      {/* Dashboard body — submission table coming in Phase 2 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-white/30 uppercase tracking-widest">
          Submission management
        </p>
        <p className="text-white/20 text-sm max-w-xs">
          The submission table — review, edit, delete, and flag entries — is coming in the next build.
        </p>
      </div>
    </div>
  )
}
