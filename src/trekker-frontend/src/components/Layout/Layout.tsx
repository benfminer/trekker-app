import { NavLink, Outlet } from "react-router-dom"

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "text-[#f97316]"
    : "text-[#C4A882] transition-colors duration-100 hover:text-white"

// ---------------------------------------------------------------------------
// Site-wide layout shell.
// Header carries the primary public nav. Admin link lives at the bottom
// so it doesn't distract from the main experience.
// ---------------------------------------------------------------------------

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col bg-[#FAF7F2] text-[#2C1810]">
      <header className="bg-[#2C1810] border-b border-[#1a0e08]">
        <nav className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-4 sm:px-6">
          {/* Wordmark */}
          <span
            className="text-base font-bold uppercase tracking-widest text-[#f97316] sm:text-lg"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            TRACE Trekkers
          </span>

          {/* Primary nav — public pages */}
          <ul className="flex items-center gap-3 text-xs font-medium sm:gap-6 sm:text-sm">
            <li>
              <NavLink to="/" end className={navLinkClass}>
                Map
              </NavLink>
            </li>
            <li>
              <NavLink to="/log" className={navLinkClass}>
                Log Activity
              </NavLink>
            </li>
            <li>
              <NavLink to="/leaderboard" className={navLinkClass}>
                Leaderboard
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      {/* Admin link — intentionally de-emphasized at the bottom */}
      <footer className="border-t border-[#E8DDD0] bg-[#FAF7F2] py-3 text-center">
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            isActive
              ? "text-xs text-[#f97316]"
              : "text-xs text-[#B0A090] transition-colors duration-100 hover:text-[#2C1810]"
          }
        >
          Admin
        </NavLink>
      </footer>
    </div>
  )
}
