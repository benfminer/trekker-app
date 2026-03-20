import { type FormEvent, useState } from "react"
import { Link } from "react-router-dom"
import { createAdminUser } from "../../lib/api"
import { getAdminToken } from "../../lib/auth"

// ---------------------------------------------------------------------------
// NewAdminUserPage — create a new admin account
// ---------------------------------------------------------------------------

export default function NewAdminUserPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    const token = getAdminToken()
    if (!token) return

    setLoading(true)
    try {
      await createAdminUser(
        { username: username.trim(), password, email: email.trim() || undefined },
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
          Account created
        </h2>
        <p className="mb-2 text-sm text-[#2C1810]">
          <strong>{username}</strong> can now log in.
        </p>
        <p className="mb-8 text-sm text-[#8C7B6B]">
          Share the username and password securely — the password won&apos;t be shown again.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setUsername("")
              setPassword("")
              setEmail("")
              setSuccess(false)
              setError(null)
            }}
            className="w-full rounded-md bg-[#f97316] py-3 font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Create another account
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
          New Admin Account
        </h1>
        <p className="mt-1 text-sm text-[#8C7B6B]">
          Create a login for another admin.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium text-[#2C1810]">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="off"
              required
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="newUserPassword" className="text-sm font-medium text-[#2C1810]">
              Password
            </label>
            <input
              id="newUserPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              required
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] outline-none transition-colors focus:border-[#f97316] disabled:opacity-70"
            />
            <p className="text-xs text-[#8C7B6B]">At least 8 characters.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="newUserEmail" className="text-sm font-medium text-[#2C1810]">
              Email{" "}
              <span className="font-normal text-[#8C7B6B]">(optional — required for password reset)</span>
            </label>
            <input
              id="newUserEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
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
            disabled={loading || !username.trim() || !password}
            className="w-full rounded-md bg-[#f97316] py-3.5 font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontFamily: "'Oswald', sans-serif", fontSize: "16px", minHeight: "52px" }}
          >
            {loading ? "···" : "Create account"}
          </button>
        </div>
      </form>
    </div>
  )
}
