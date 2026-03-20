import { type FormEvent, useState } from "react"
import { Link } from "react-router-dom"
import { changeAdminPassword } from "../../lib/api"
import { getAdminToken } from "../../lib/auth"

// ---------------------------------------------------------------------------
// ChangePasswordPage — admin self-service password change
// ---------------------------------------------------------------------------

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.")
      return
    }

    const token = getAdminToken()
    if (!token) return

    setLoading(true)
    try {
      await changeAdminPassword(
        { current_password: currentPassword, new_password: newPassword },
        token
      )
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
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
          Password updated
        </h2>
        <p className="mb-8 text-sm text-[#8C7B6B]">Your password has been changed successfully.</p>
        <Link
          to="/admin"
          className="inline-block rounded-md bg-[#f97316] px-8 py-3 font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Back to dashboard
        </Link>
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
          Change Password
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="currentPassword" className="text-sm font-medium text-[#2C1810]">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="newPassword" className="text-sm font-medium text-[#2C1810]">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
            />
            <p className="text-xs text-[#8C7B6B]">At least 8 characters.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-[#2C1810]">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              required
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-md border-l-[3px] border-red-500 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full rounded-md bg-[#f97316] py-3.5 font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontFamily: "'Oswald', sans-serif", fontSize: "16px", minHeight: "52px" }}
          >
            {loading ? "···" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  )
}
