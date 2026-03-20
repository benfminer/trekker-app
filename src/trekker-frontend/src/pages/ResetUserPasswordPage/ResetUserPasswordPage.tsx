import { type FormEvent, useState } from "react"
import { Link } from "react-router-dom"
import { resetAdminUserPassword } from "../../lib/api"
import { getAdminToken } from "../../lib/auth"

// ---------------------------------------------------------------------------
// ResetUserPasswordPage — /admin/reset-user-password
//
// Lets an authenticated admin set a new password for any admin account by
// username. No email required — designed for the two-admin use case where one
// admin resets the other's password directly.
// ---------------------------------------------------------------------------

export default function ResetUserPasswordPage() {
  const [username, setUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resetUsername, setResetUsername] = useState("")

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const token = getAdminToken() ?? ""
      await resetAdminUserPassword({ username, new_password: newPassword }, token)
      setResetUsername(username)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-white/10 bg-white/5 p-8 text-center">
          <p className="mb-2 text-lg font-bold text-white">Password reset</p>
          <p className="mb-6 text-sm text-white/50">
            <span className="font-medium text-white/80">{resetUsername}</span> can now sign in with their new password.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setUsername("")
                setNewPassword("")
                setConfirm("")
                setSuccess(false)
                setResetUsername("")
              }}
              className="w-full rounded-md bg-[#f97316] px-4 py-3 text-sm font-bold uppercase tracking-wider text-black transition-opacity duration-100 hover:opacity-90"
            >
              Reset another
            </button>
            <Link
              to="/admin"
              className="block text-center text-sm text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Link
            to="/admin"
            className="text-sm text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-8">
          <h1
            className="mb-2 text-xl font-bold uppercase tracking-wide text-white"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Reset password
          </h1>
          <p className="mb-6 text-sm text-white/40">
            Set a new password for another admin account.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="username"
                  className="text-xs font-medium uppercase tracking-wider text-white/50"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors duration-100 focus:border-[#f97316] disabled:opacity-50"
                  placeholder="their username"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-password"
                  className="text-xs font-medium uppercase tracking-wider text-white/50"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors duration-100 focus:border-[#f97316] disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="confirm-password"
                  className="text-xs font-medium uppercase tracking-wider text-white/50"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={loading}
                  className="rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors duration-100 focus:border-[#f97316] disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              {error !== null && (
                <p
                  role="alert"
                  className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  username.trim() === "" ||
                  newPassword === "" ||
                  confirm === ""
                }
                className="mt-1 rounded-md bg-[#f97316] px-4 py-3 text-sm font-bold uppercase tracking-wider text-black transition-opacity duration-100 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
