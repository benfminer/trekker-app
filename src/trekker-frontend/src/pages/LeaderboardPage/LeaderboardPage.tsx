import { useEffect, useRef, useState } from "react"
import { getLeaderboard } from "../../lib/api"
import type { LeaderboardEntry, LeaderboardResponse } from "../../lib/types"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 30_000

const RANK_MEDALS = ["🥇", "🥈", "🥉", ""]

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatMiles(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function formatDate(iso: string | null): string {
  if (!iso) return "No activity yet"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// AnimatedCounter — counts up from 0 to target over ~800ms
// ---------------------------------------------------------------------------

interface AnimatedCounterProps {
  target: number
  className?: string
}

function AnimatedCounter({ target, className }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const DURATION = 800

  useEffect(() => {
    const start = performance.now()
    startRef.current = start

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / DURATION, 1)
      // Ease out cubic
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

  return (
    <span className={className}>
      {formatMiles(display)}
    </span>
  )
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  value: number
  max: number
  rank: number
}

function ProgressBar({ value, max, rank }: ProgressBarProps) {
  const pct = max === 0 ? 0 : Math.min((value / max) * 100, 100)

  const barColor =
    rank === 1
      ? "#f97316"
      : rank === 2
      ? "#fb923c"
      : rank === 3
      ? "#fdba74"
      : "#374151"

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full"
      style={{ background: "#1f2937" }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: barColor }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// SiteCard
// ---------------------------------------------------------------------------

interface SiteCardProps {
  entry: LeaderboardEntry
  maxMiles: number
  index: number
}

function SiteCard({ entry, maxMiles, index }: SiteCardProps) {
  const isFirst = entry.rank === 1
  const medal = RANK_MEDALS[Math.min(index, 3)]

  return (
    <div
      className="relative flex flex-col gap-4 rounded-xl border p-6 transition-all duration-300"
      style={{
        background: isFirst ? "rgba(249,115,22,0.06)" : "#111827",
        borderColor: isFirst ? "rgba(249,115,22,0.4)" : "#1f2937",
        animation: `cardFadeUp 400ms ease-out ${index * 80}ms both`,
      }}
    >
      {/* Rank badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {medal && (
            <span className="text-2xl leading-none" aria-hidden="true">
              {medal}
            </span>
          )}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.1em] text-[#6b7280]"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Rank {entry.rank}
            </p>
            <h2
              className="text-[18px] font-bold uppercase leading-tight text-white sm:text-[26px]"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {entry.display_name}
            </h2>
          </div>
        </div>

        {/* Miles count */}
        <div className="text-right">
          <AnimatedCounter
            target={entry.total_miles}
            className={[
              "block text-[22px] font-bold leading-none sm:text-[34px]",
              isFirst ? "text-[#f97316]" : "text-white",
            ].join(" ")}
          />
          <span
            className="text-[11px] text-[#6b7280]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            miles
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar value={entry.total_miles} max={maxMiles} rank={entry.rank} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function LeaderboardSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .lb-shimmer {
          background: linear-gradient(90deg, #111827 25%, #1f2937 50%, #111827 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s linear infinite;
          border-radius: 8px;
        }
      `}</style>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-xl border border-[#1f2937] bg-[#111827] p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="lb-shimmer h-3 w-16" />
              <div className="lb-shimmer h-6 w-32" />
            </div>
            <div className="lb-shimmer h-9 w-24" />
          </div>
          <div className="lb-shimmer h-1.5 w-full" />
        </div>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// LeaderboardPage
// ---------------------------------------------------------------------------

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  async function fetchData() {
    try {
      const result = await getLeaderboard()
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

  const maxMiles = data
    ? Math.max(...data.leaderboard.map((e) => e.total_miles), 1)
    : 1

  return (
    <>
      <style>{`
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes headerFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0ms !important;
            animation-delay: 0ms !important;
          }
        }
      `}</style>

      <div
        className="flex flex-1 flex-col"
        style={{ background: "#0a0f1a" }}
        data-testid="leaderboard-page"
      >
        {/* Header */}
        <div
          className="border-b border-[#1f2937] px-4 py-10 text-center sm:px-6"
          style={{ animation: "headerFadeIn 300ms ease-out forwards" }}
        >
          <p
            className="mb-1 text-[11px] uppercase tracking-[0.15em] text-[#f97316]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Campus Rankings
          </p>
          <h1
            className="text-[36px] font-bold uppercase leading-tight text-white sm:text-[48px]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Leaderboard
          </h1>
          <p className="mt-2 text-[14px] text-[#6b7280]">
            Which campus will carry us farthest?
          </p>
        </div>

        {/* Content */}
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
          {loading ? (
            <div className="flex flex-col gap-4">
              <LeaderboardSkeleton />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-[15px] text-[#9ca3af]">
                Could not load leaderboard data.
              </p>
              <button
                type="button"
                onClick={fetchData}
                className="rounded-md bg-[#f97316] px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-opacity duration-100 hover:opacity-90"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <div className="flex flex-col gap-4">
              {data.leaderboard.map((entry, i) => (
                <SiteCard
                  key={entry.site}
                  entry={entry}
                  maxMiles={maxMiles}
                  index={i}
                />
              ))}
            </div>
          ) : null}

          {/* Footer stats */}
          {data && !loading && (
            <div
              className="mt-8 flex items-center justify-between border-t border-[#1f2937] pt-6"
              style={{ animation: "headerFadeIn 400ms ease-out 300ms both" }}
            >
              <div>
                <p
                  className="text-[24px] font-bold leading-none text-white"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {formatMiles(data.total_site_miles)}
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-[#6b7280]">
                  combined campus miles
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#4b5563]">Last updated</p>
                <p className="text-[12px] text-[#6b7280]">
                  {formatDate(data.updated_at)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
