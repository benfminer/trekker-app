import { useEffect, useRef, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

// ---------------------------------------------------------------------------
// Experimental Layout — Mission Control Shell
//
// Creative direction: The nav is a mission-control status bar. The wordmark
// is oversized and structural — it anchors the left edge. Navigation is
// minimal and displaced to the right as coordinates/system labels.
// A thin scanning line animates across the top on route changes.
// The shell is dark-first (near-black with subtle warm tint).
// ---------------------------------------------------------------------------

const ROUTE_COORDS_LABEL: Record<string, string> = {
  "/": "32.72°N · LIVE MAP",
  "/log": "32.72°N · LOG ENTRY",
  "/admin": "32.72°N · ADMIN",
}

export default function Layout() {
  const location = useLocation()
  const [scanning, setScanning] = useState(false)
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Trigger scan line on every route change
  useEffect(() => {
    setScanning(true)
    if (scanTimer.current) clearTimeout(scanTimer.current)
    scanTimer.current = setTimeout(() => setScanning(false), 900)
    return () => {
      if (scanTimer.current) clearTimeout(scanTimer.current)
    }
  }, [location.pathname])

  const coordLabel =
    ROUTE_COORDS_LABEL[location.pathname] ?? "32.72°N · TRACE TREKKERS"

  return (
    <div
      className="flex min-h-svh flex-col"
      style={{ background: "#0D0B09", color: "#E8DDD0" }}
    >
      <style>{`
        /* Scan line animation triggered on route change */
        @keyframes scanLine {
          0%   { transform: translateX(-100%); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0.4; }
        }

        /* Subtle grain texture overlay — CSS-only, no image needed */
        @keyframes grainShift {
          0%   { background-position: 0% 0%; }
          20%  { background-position: 50% 0%; }
          40%  { background-position: 100% 50%; }
          60%  { background-position: 50% 100%; }
          80%  { background-position: 0% 50%; }
          100% { background-position: 0% 0%; }
        }

        /* Wordmark letter-spacing breathe */
        @keyframes wordmarkBreathe {
          0%, 100% { letter-spacing: 0.12em; }
          50%       { letter-spacing: 0.16em; }
        }

        .exp-nav-link {
          position: relative;
          font-family: 'Oswald', sans-serif;
          font-weight: 400;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8C7B6B;
          transition: color 80ms linear;
          padding-bottom: 2px;
        }

        .exp-nav-link::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 0;
          height: 1px;
          background: #f97316;
          transition: width 150ms ease-out;
        }

        .exp-nav-link:hover { color: #E8DDD0; }
        .exp-nav-link:hover::after { width: 100%; }
        .exp-nav-link.active {
          color: #f97316;
        }
        .exp-nav-link.active::after { width: 100%; }

        /* Grain overlay */
        .grain-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 200px 200px;
          animation: grainShift 8s steps(1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .scan-line, .grain-overlay { animation: none !important; }
          .exp-wordmark { animation: none !important; }
        }
      `}</style>

      {/* Film grain overlay — adds tactile depth without any images */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #1E1A16",
          position: "relative",
          overflow: "hidden",
          background: "#0D0B09",
        }}
      >
        {/* Scan line that sweeps on route change */}
        {scanning && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "60px",
              background:
                "linear-gradient(90deg, transparent, rgba(249,115,22,0.18), transparent)",
              animation: "scanLine 700ms ease-out forwards",
              pointerEvents: "none",
            }}
          />
        )}

        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 24px",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            height: "56px",
          }}
        >
          {/* Left: Wordmark */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <NavLink
              to="/"
              style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: "8px" }}
            >
              <span
                className="exp-wordmark"
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 700,
                  fontSize: "20px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#f97316",
                  lineHeight: 1,
                }}
              >
                TRACE
              </span>
              <span
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 300,
                  fontSize: "20px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#E8DDD0",
                  lineHeight: 1,
                }}
              >
                TREKKERS
              </span>
            </NavLink>
          </div>

          {/* Center: Coordinate label — current section identifier */}
          <div
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 400,
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#3D3530",
              whiteSpace: "nowrap",
            }}
            aria-hidden="true"
          >
            {coordLabel}
          </div>

          {/* Right: Navigation — right-aligned */}
          <nav
            aria-label="Main navigation"
            style={{ display: "flex", justifyContent: "flex-end", gap: "28px" }}
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `exp-nav-link${isActive ? " active" : ""}`
              }
            >
              Map
            </NavLink>
            <NavLink
              to="/log"
              className={({ isActive }) =>
                `exp-nav-link${isActive ? " active" : ""}`
              }
            >
              Log Activity
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `exp-nav-link${isActive ? " active" : ""}`
              }
            >
              Admin
            </NavLink>
          </nav>
        </div>

        {/* Bottom rule with orange pulse at active section */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, #f97316 30%, #f97316 70%, transparent 100%)",
            opacity: 0.15,
          }}
        />
      </header>

      {/* Main content area */}
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
