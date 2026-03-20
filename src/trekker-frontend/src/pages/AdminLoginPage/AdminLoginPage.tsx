import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { adminLogin } from "../../lib/api"
import { setAdminToken } from "../../lib/auth"

// ---------------------------------------------------------------------------
// AdminLoginPage — /admin/login
//
// Username + password form. On success, stores the Bearer token and redirects
// to /admin. On failure, shows the error from the API (deliberately generic —
// the server never reveals whether the username exists).
//
// No layout wrapper — this page intentionally sits outside the main nav shell
// so the admin login surface is visually distinct from the public app.
// ---------------------------------------------------------------------------

export default function AdminLoginPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { token } = await adminLogin({ username, password })
      setAdminToken(token)
      navigate("/admin", { replace: true })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <span
            className="text-2xl font-bold uppercase tracking-widest text-[#f97316]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            TRACE Trekkers
          </span>
          <p className="mt-1 text-sm text-white/40">Admin</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-8">
          <h1
            className="mb-6 text-xl font-bold uppercase tracking-wide text-white"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Sign in
          </h1>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-5">
              {/* Username */}
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
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors duration-100 focus:border-[#f97316] disabled:opacity-50"
                  placeholder="your username"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-wider text-white/50"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors duration-100 focus:border-[#f97316] disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              {/* Error */}
              {error !== null && (
                <p
                  role="alert"
                  className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || username.trim() === "" || password === ""}
                className="mt-1 rounded-md bg-[#f97316] px-4 py-3 text-sm font-bold uppercase tracking-wider text-black transition-opacity duration-100 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <Link
                to="/admin/forgot-password"
                className="block text-center text-xs text-white/30 underline-offset-2 hover:text-white/60 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
