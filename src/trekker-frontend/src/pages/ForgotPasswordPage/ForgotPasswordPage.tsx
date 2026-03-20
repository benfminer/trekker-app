import { type FormEvent, useState } from "react"
import { Link } from "react-router-dom"
import { requestPasswordReset } from "../../lib/api"

// ---------------------------------------------------------------------------
// ForgotPasswordPage — public; always shows success to prevent enumeration
// ---------------------------------------------------------------------------

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    try {
      await requestPasswordReset({ username: username.trim() })
    } catch {
      // Intentionally swallow errors — always show success to prevent enumeration
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div
        className="flex min-h-svh flex-col items-center justify-center bg-[#2C1810] px-4"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-full max-w-[400px] rounded-xl border border-[#4a2c1a] bg-[#1a0e08] p-10 text-center">
          <div className="mb-5 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f97316]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
          </div>
          <h1
            className="mb-3 text-[24px] font-bold uppercase text-white"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Check your inbox
          </h1>
          <p className="mb-6 text-[14px] leading-relaxed text-[#9ca3af]">
            If that username has an email on file, a reset link is on its way.
            The link expires in 1 hour.
          </p>
          <Link
            to="/admin/login"
            className="text-sm text-[#f97316] underline-offset-2 hover:underline"
          >
            Back to login
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
          Reset password
        </h1>
        <p className="mb-6 text-[13px] text-[#9ca3af]">
          Enter your username and we&apos;ll send a reset link to the email on file.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm text-[#d1d5db]">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
                required
                className="w-full rounded-md border border-[#374151] bg-[#111827] px-4 py-3 text-base text-white placeholder-[#6b7280] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full rounded-md bg-[#f97316] py-3.5 font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              style={{ fontFamily: "'Oswald', sans-serif", fontSize: "15px", minHeight: "50px" }}
            >
              {loading ? "···" : "Send reset link"}
            </button>

            <Link
              to="/admin/login"
              className="block text-center text-sm text-[#6b7280] underline-offset-2 hover:text-[#9ca3af] hover:underline"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
