import { type FormEvent, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { resetPassword } from "../../lib/api"

// ---------------------------------------------------------------------------
// ResetPasswordPage — consumes token from URL query param ?token=...
// ---------------------------------------------------------------------------

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // No token in URL — show a clear error immediately
  if (!token) {
    return (
      <div
        className="flex min-h-svh flex-col items-center justify-center bg-[#2C1810] px-4"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-full max-w-[400px] rounded-xl border border-[#4a2c1a] bg-[#1a0e08] p-10 text-center">
          <h1
            className="mb-3 text-[22px] font-bold uppercase text-white"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Invalid link
          </h1>
          <p className="mb-6 text-[14px] text-[#9ca3af]">
            This reset link is missing a token. Please request a new one.
          </p>
          <Link
            to="/admin/forgot-password"
            className="text-sm text-[#f97316] underline-offset-2 hover:underline"
          >
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      await resetPassword({ token, new_password: newPassword })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. The link may have expired.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className="flex min-h-svh flex-col items-center justify-center bg-[#2C1810] px-4"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-full max-w-[400px] rounded-xl border border-[#4a2c1a] bg-[#1a0e08] p-10 text-center">
          <div className="mb-5 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f97316]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h1
            className="mb-3 text-[24px] font-bold uppercase text-white"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Password updated
          </h1>
          <p className="mb-6 text-[14px] text-[#9ca3af]">
            You can now log in with your new password.
          </p>
          <Link
            to="/admin/login"
            className="inline-block rounded-md bg-[#f97316] px-8 py-3 font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center bg-[#2C1810] px-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-[400px] rounded-xl border border-[#4a2c1a] bg-[#1a0e08] p-10">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span
            className="text-[22px] font-bold uppercase tracking-widest text-[#f97316]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            TRACE Trekkers
          </span>
        </div>

        <h1
          className="mb-1 text-[22px] font-bold uppercase text-white"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Set new password
        </h1>
        <p className="mb-6 text-[13px] text-[#9ca3af]">
          Choose a strong password. This link expires after one use.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="newPassword" className="text-sm text-[#d1d5db]">
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
                className="w-full rounded-md border border-[#374151] bg-[#111827] px-4 py-3 text-base text-white placeholder-[#6b7280] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
              />
              <p className="text-xs text-[#6b7280]">At least 8 characters.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm text-[#d1d5db]">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                required
                className="w-full rounded-md border border-[#374151] bg-[#111827] px-4 py-3 text-base text-white placeholder-[#6b7280] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-md border-l-[3px] border-red-500 bg-red-950 px-4 py-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full rounded-md bg-[#f97316] py-3.5 font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              style={{ fontFamily: "'Oswald', sans-serif", fontSize: "15px", minHeight: "50px" }}
            >
              {loading ? "···" : "Set new password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
