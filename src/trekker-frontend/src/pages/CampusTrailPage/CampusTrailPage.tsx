import { useEffect, useRef, useState } from "react"
import { getCampusTrail } from "../../lib/api"
import type { CampusTrailEntry, CampusTrailResponse } from "../../lib/types"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 30_000
const COUNTER_DURATION_MS = 900

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatMiles(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// ---------------------------------------------------------------------------
// AnimatedCounter — counts up from 0 to target with ease-out cubic
// ---------------------------------------------------------------------------

interface AnimatedCounterProps {
  target: number
  className?: string
}

function AnimatedCounter({ target, className }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / COUNTER_DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(eased * target)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target])

  return <span className={className}>{formatMiles(display)}</span>
}

// ---------------------------------------------------------------------------
// CampusCard
// ---------------------------------------------------------------------------

interface CampusCardProps {
  entry: CampusTrailEntry
  index: number
}

function CampusCard({ entry, index }: CampusCardProps) {
  const animationDelay = `${index * 100}ms`

  return (
    <article
      className="flex flex-col gap-5 rounded-2xl border border-[#333] p-6 sm:p-8"
      style={{
        background: "#2a2a2a",
        animation: `campusCardFadeUp 450ms ease-out ${animationDelay} both`,
      }}
    >
      {/* Campus name */}
      <h2
        className="text-[22px] font-bold uppercase leading-none tracking-wide text-white sm:text-[28px]"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        {entry.site}
      </h2>

      {/* Milestone — hero text */}
      <p
        className="text-[18px] font-bold leading-snug text-[#FF6B00] sm:text-[22px]"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        {entry.milestone}
      </p>

      {/* Miles logged */}
      <div className="flex items-baseline gap-2">
        <AnimatedCounter
          target={entry.miles}
          className="text-[32px] font-bold leading-none text-white sm:text-[40px]"
        />
        <span
          className="text-[13px] uppercase tracking-[0.08em] text-[#666]"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          miles logged
        </span>
      </div>

    </article>
  )
}

// ---------------------------------------------------------------------------
// Skeleton loader — four placeholder cards
// ---------------------------------------------------------------------------

function CampusTrailSkeleton() {
  return (
    <>
      <style>{`
        @keyframes ctShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ct-shimmer {
          background: linear-gradient(90deg, #2a2a2a 25%, #383838 50%, #2a2a2a 75%);
          background-size: 200% 100%;
          animation: ctShimmer 1.5s linear infinite;
          border-radius: 6px;
        }
      `}</style>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-5 rounded-2xl border border-[#333] bg-[#2a2a2a] p-6 sm:p-8"
        >
          <div className="ct-shimmer h-7 w-36" />
          <div className="ct-shimmer h-5 w-full max-w-xs" />
          <div className="ct-shimmer h-10 w-28" />
          <div className="ct-shimmer h-1.5 w-full" />
        </div>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// CampusTrailPage
// ---------------------------------------------------------------------------

export default function CampusTrailPage() {
  const [data, setData] = useState<CampusTrailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  async function fetchData() {
    try {
      const result = await getCampusTrail()
      setData(result)
      setFetchError(false)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <style>{`
        @keyframes campusCardFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ctHeaderFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0ms !important;
            animation-delay: 0ms !important;
            transition-duration: 0ms !important;
            transition-delay: 0ms !important;
          }
        }
      `}</style>

      <div
        className="flex flex-1 flex-col"
        style={{ background: "#1a1a1a" }}
        data-testid="campus-trail-page"
      >
        {/* Page header */}
        <div
          className="border-b border-[#2a2a2a] px-4 py-10 text-center sm:px-6"
          style={{ animation: "ctHeaderFadeIn 300ms ease-out forwards" }}
        >
          <h1
            className="text-[38px] font-bold uppercase leading-tight text-white sm:text-[52px]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Campus Trail
          </h1>
          <p className="mt-2 text-[14px] text-[#666]">
            Every mile moves us forward.
          </p>
        </div>

        {/* Cards grid */}
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <CampusTrailSkeleton />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-[15px] text-[#666]">
                Could not load campus trail data.
              </p>
              <button
                type="button"
                onClick={fetchData}
                className="rounded-md bg-[#FF6B00] px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-opacity duration-100 hover:opacity-90"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.campus_trail.map((entry, i) => (
                <CampusCard key={entry.site} entry={entry} index={i} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
