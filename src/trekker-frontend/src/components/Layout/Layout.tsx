import { NavLink, Outlet } from "react-router-dom"

// ---------------------------------------------------------------------------
// Site-wide layout shell.
// Header carries the primary nav. Main grows to fill remaining viewport height.
// Phase 2 will replace the nav skeleton with full styled navigation.
// ---------------------------------------------------------------------------

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col bg-[#FAF7F2] text-[#2C1810]">
      <header className="bg-[#2C1810] border-b border-[#1a0e08]">
        <nav className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-4 sm:px-6">
          {/* Wordmark */}
          <span
            className="text-lg font-bold uppercase tracking-widest text-[#f97316]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            TRACE Trekkers
          </span>

          {/* Nav links */}
          <ul className="flex items-center gap-6 text-sm font-medium">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? "text-[#f97316]"
                    : "text-[#C4A882] transition-colors duration-100 hover:text-white"
                }
              >
                Map
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/log"
                className={({ isActive }) =>
                  isActive
                    ? "text-[#f97316]"
                    : "text-[#C4A882] transition-colors duration-100 hover:text-white"
                }
              >
                Log Activity
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive
                    ? "text-[#f97316]"
                    : "text-[#C4A882] transition-colors duration-100 hover:text-white"
                }
              >
                Admin
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
