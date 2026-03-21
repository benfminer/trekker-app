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
      <div className="mx-auto w-full max-w-[480px] px-5 py-10 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f97316]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <h2
          className="mb-2 text-[24px] font-bold uppercase text-[#2C1810]"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Password reset
        </h2>
        <p className="mb-8 text-sm text-[#8C7B6B]">
          <span className="font-medium text-[#2C1810]">{resetUsername}</span> can now sign in with their new password.
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
            className="w-full rounded-md bg-[#f97316] py-3.5 font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            style={{ fontFamily: "'Oswald', sans-serif", fontSize: "16px", minHeight: "52px" }}
          >
            Reset another
          </button>
          <Link
            to="/admin"
            className="block w-full rounded-md border border-[#E8DDD0] py-3 text-center text-sm font-medium text-[#2C1810] transition-colors hover:bg-[#F5EFE6]"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 py-10">
      <div className="mb-8">
        <Link
          to="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#8C7B6B] hover:text-[#2C1810]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboard
        </Link>
        <h1
          className="text-[28px] font-bold uppercase leading-tight tracking-wide text-[#2C1810]"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Reset Password
        </h1>
        <p className="mt-1 text-sm text-[#8C7B6B]">Set a new password for another admin account.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-semibold text-[#2C1810]">
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
              placeholder="their username"
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] placeholder-[#8C7B6B] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-sm font-semibold text-[#2C1810]">
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
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
            />
            <p className="text-xs text-[#8C7B6B]">At least 8 characters.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-sm font-semibold text-[#2C1810]">
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
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
            />
          </div>

          {error !== null && (
            <div role="alert" className="rounded-md border-l-[3px] border-red-500 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || username.trim() === "" || newPassword === "" || confirm === ""}
            className="w-full rounded-md bg-[#f97316] py-3.5 font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontFamily: "'Oswald', sans-serif", fontSize: "16px", minHeight: "52px" }}
          >
            {loading ? "···" : "Reset password"}
          </button>
        </div>
      </form>
    </div>
  )
}
