import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { getStats } from "../../lib/api"
import type { NextMilestone, Stats } from "../../lib/types"

// ---------------------------------------------------------------------------
// Contribution navigation state shape
// ---------------------------------------------------------------------------

export interface ContributionState {
  beforeMiles: number
  afterMiles: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Full circumference used to compute the current position fraction. */
const EARTH_CIRCUMFERENCE_MILES = 24900

/** School-year goal. Used for the percentage-of-goal stat. */
const SCHOOL_YEAR_GOAL_MILES = 20286

const POLL_INTERVAL_MS = 30_000

// ---------------------------------------------------------------------------
// Route coordinates
// A simplified great circle path eastward from San Diego back to San Diego.
// Enough waypoints to look smooth on a 2D Mercator projection.
// ---------------------------------------------------------------------------

// The route follows the circumference of Earth at San Diego's latitude (32.72°N),
// which is exactly 20,286 miles — the school-year goal.
// Coordinates go east continuously past the antimeridian using longitudes > 180,
// which Mapbox GL JS supports natively for GeoJSON sources.
const ROUTE_COORDS: [number, number][] = [
  [-117.16, 32.72], // San Diego, CA — start
  [-100.0,  32.72], // Texas
  [-85.0,   32.72], // Georgia / South Carolina coast
  [-70.0,   32.72], // Mid-Atlantic Ocean
  [-55.0,   32.72], // Western Atlantic
  [-40.0,   32.72], // Central Atlantic
  [-25.0,   32.72], // Eastern Atlantic
  [-10.0,   32.72], // Near Lisbon / Casablanca
  [5.0,     32.72], // Algeria
  [20.0,    32.72], // Libya
  [35.0,    32.72], // Egypt / Israel
  [50.0,    32.72], // Iraq / Iran
  [65.0,    32.72], // Iran / Pakistan
  [80.0,    32.72], // Northern India
  [95.0,    32.72], // Bangladesh / Myanmar
  [110.0,   32.72], // Southern China
  [125.0,   32.72], // South Korea / Japan Sea
  [140.0,   32.72], // Japan
  [155.0,   32.72], // Western Pacific
  [170.0,   32.72], // Central Pacific
  [185.0,   32.72], // Past antimeridian (= -175°)
  [200.0,   32.72], // North Pacific (= -160°)
  [215.0,   32.72], // North Pacific (= -145°)
  [230.0,   32.72], // Near Pacific coast (= -130°)
  [242.84,  32.72], // Back to San Diego (= -117.16°)
]

// ---------------------------------------------------------------------------
// Route utilities
// ---------------------------------------------------------------------------

/** Approximate segment lengths (in "units") used for proportional interpolation. */
function buildSegmentLengths(coords: [number, number][]): number[] {
  const lengths: number[] = []
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i]
    const [lng2, lat2] = coords[i + 1]
    const dlng = lng2 - lng1
    const dlat = lat2 - lat1
    lengths.push(Math.sqrt(dlng * dlng + dlat * dlat))
  }
  return lengths
}

const SEGMENT_LENGTHS = buildSegmentLengths(ROUTE_COORDS)
const TOTAL_PATH_LENGTH = SEGMENT_LENGTHS.reduce((s, l) => s + l, 0)

/**
 * Given a fraction 0–1 of the total route, return the [lng, lat] coordinate
 * at that point along the route coords array.
 */
function interpolatePosition(fraction: number): [number, number] {
  const clamped = Math.max(0, Math.min(1, fraction))
  const target = clamped * TOTAL_PATH_LENGTH

  let accumulated = 0
  for (let i = 0; i < SEGMENT_LENGTHS.length; i++) {
    const segLen = SEGMENT_LENGTHS[i]
    if (accumulated + segLen >= target) {
      const t = segLen === 0 ? 0 : (target - accumulated) / segLen
      const [lng1, lat1] = ROUTE_COORDS[i]
      const [lng2, lat2] = ROUTE_COORDS[i + 1]
      return [lng1 + (lng2 - lng1) * t, lat1 + (lat2 - lat1) * t]
    }
    accumulated += segLen
  }
  return ROUTE_COORDS[ROUTE_COORDS.length - 1]
}

/**
 * Split the full route into traveled and remaining GeoJSON LineString coords
 * at the given fraction.
 */
function splitRoute(fraction: number): {
  traveled: [number, number][]
  remaining: [number, number][]
} {
  const clamped = Math.max(0, Math.min(1, fraction))
  const target = clamped * TOTAL_PATH_LENGTH

  const traveled: [number, number][] = [ROUTE_COORDS[0]]
  const remaining: [number, number][] = []

  let accumulated = 0
  let splitDone = false

  for (let i = 0; i < SEGMENT_LENGTHS.length; i++) {
    const segLen = SEGMENT_LENGTHS[i]
    const nextPoint = ROUTE_COORDS[i + 1]

    if (!splitDone && accumulated + segLen >= target) {
      const t = segLen === 0 ? 0 : (target - accumulated) / segLen
      const [lng1, lat1] = ROUTE_COORDS[i]
      const [lng2, lat2] = ROUTE_COORDS[i + 1]
      const splitPoint: [number, number] = [
        lng1 + (lng2 - lng1) * t,
        lat1 + (lat2 - lat1) * t,
      ]
      traveled.push(splitPoint)
      remaining.push(splitPoint, nextPoint)
      splitDone = true
    } else if (!splitDone) {
      traveled.push(nextPoint)
    } else {
      remaining.push(nextPoint)
    }

    accumulated += segLen
  }

  // Edge cases: all traveled or none traveled
  if (!splitDone) {
    remaining.push(...ROUTE_COORDS.slice(1))
  }

  return { traveled, remaining }
}

/**
 * Given beforeMiles and afterMiles, return the coordinates of just the
 * contributed segment as a GeoJSON LineString coordinate array.
 *
 * Uses the same Euclidean path units as interpolatePosition/splitRoute —
 * no turf required; the route is a fixed coordinate array, not geographic.
 *
 * Enforces a minimum segment length to prevent absurdly tight fitBounds
 * on tiny contributions.
 */
function getContributionCoords(
  beforeMiles: number,
  afterMiles: number
): [number, number][] {
  const clampedBefore = Math.max(0, beforeMiles)
  const clampedAfter = Math.min(EARTH_CIRCUMFERENCE_MILES, Math.max(afterMiles, clampedBefore))

  const fracBefore = clampedBefore / EARTH_CIRCUMFERENCE_MILES
  const fracAfter = clampedAfter / EARTH_CIRCUMFERENCE_MILES

  const startPoint = interpolatePosition(fracBefore)
  const endPoint = interpolatePosition(fracAfter)

  // Walk the route coords between the two fractions
  const targetBefore = fracBefore * TOTAL_PATH_LENGTH
  const targetAfter = fracAfter * TOTAL_PATH_LENGTH

  const coords: [number, number][] = [startPoint]
  let accumulated = 0

  for (let i = 0; i < SEGMENT_LENGTHS.length; i++) {
    const segLen = SEGMENT_LENGTHS[i]
    const segStart = accumulated
    const segEnd = accumulated + segLen

    // Include full waypoints that fall strictly between the two fractions
    if (segEnd > targetBefore && segStart < targetAfter) {
      const nextPoint = ROUTE_COORDS[i + 1]
      if (segEnd <= targetAfter) {
        coords.push(nextPoint)
      }
    }

    accumulated += segLen
    if (accumulated >= targetAfter) break
  }

  coords.push(endPoint)
  return coords
}

/**
 * Compute a bounding box [[minLng, minLat], [maxLng, maxLat]] from a
 * coordinate array, with generous padding built in at the fitBounds call site.
 */
function coordsBounds(
  coords: [number, number][]
): [[number, number], [number, number]] {
  let minLng = Infinity, maxLng = -Infinity
  let minLat = Infinity, maxLat = -Infinity
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  return [[minLng, minLat], [maxLng, maxLat]]
}

// ---------------------------------------------------------------------------
// Milestone celebration helpers
// ---------------------------------------------------------------------------

const SESSION_KEY = "seen_milestone_ids"

function getSeenIds(): Set<number> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as number[])
  } catch {
    return new Set()
  }
}

function markIdSeen(id: number): void {
  try {
    const seen = getSeenIds()
    seen.add(id)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...seen]))
  } catch {
    // sessionStorage unavailable — silently skip
  }
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatMiles(n: number): string {
  return Math.round(n).toLocaleString("en-US")
}

function formatMilestoneType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Three animated skeleton blocks used while stats are loading. */
function StatsSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .shimmer-block {
          background: linear-gradient(90deg, #1a1a1a 25%, #262626 50%, #1a1a1a 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s linear infinite;
          border-radius: 4px;
        }
      `}</style>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-1 flex-col gap-2 px-4 py-5">
          <div className="shimmer-block h-9 w-[120px]" />
          <div className="shimmer-block h-3.5 w-[80px]" />
        </div>
      ))}
    </>
  )
}

interface StatsDisplayProps {
  stats: Stats
  onRetry: () => void
  fetchError: boolean
}

function StatsDisplay({ stats, onRetry, fetchError }: StatsDisplayProps) {
  const pct = Math.floor((stats.total_miles / SCHOOL_YEAR_GOAL_MILES) * 100)
  const pctClamped = Math.min(pct, 100)
  const next = stats.next_milestone

  if (fetchError) {
    return (
      <div className="flex flex-1 items-center gap-3 px-4 py-4">
        <span className="text-sm text-[#9ca3af]">Could not load progress</span>
        <button
          type="button"
          onClick={onRetry}
          className="text-sm text-[#f97316] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Miles logged */}
      <div className="flex flex-1 flex-col gap-1 px-4 py-5">
        <span
          className="text-[32px] leading-none text-white sm:text-[36px]"
          style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }}
        >
          {formatMiles(stats.total_miles)}
        </span>
        <span className="text-[12px] text-[#9ca3af] sm:text-[13px]">
          miles logged
        </span>
      </div>

      {/* Percent of goal */}
      <div className="flex flex-1 flex-col gap-1 px-4 py-5">
        <span
          className="text-[32px] leading-none text-white sm:text-[36px]"
          style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }}
        >
          {pctClamped}%
        </span>
        <span className="text-[12px] text-[#9ca3af] sm:text-[13px]">
          of our goal
        </span>
        {/* Progress bar */}
        <div
          className="mt-1.5 h-1 w-full overflow-hidden rounded-full"
          style={{ background: "#1f1f1f" }}
          role="progressbar"
          aria-valuenow={pctClamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress toward goal"
        >
          <div
            className="h-full rounded-full bg-[#f97316]"
            style={{ width: `${pctClamped}%` }}
          />
        </div>
      </div>

      {/* Next milestone */}
      <div className="flex flex-1 flex-col gap-1 px-4 py-5">
        {next ? (
          <>
            <span
              className="text-[18px] leading-tight text-white sm:text-[20px]"
              style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }}
            >
              {next.name}
            </span>
            <span className="text-[12px] text-[#f97316] sm:text-[13px]">
              {formatMiles(next.miles_remaining)} miles away
            </span>
            <span className="text-[11px] text-[#6b7280]">
              {formatMilestoneType(next.milestone_type)}
            </span>
          </>
        ) : (
          <span
            className="text-[20px] leading-tight text-white"
            style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }}
          >
            Goal reached!
          </span>
        )}
      </div>
    </>
  )
}

interface MilestoneCelebrationProps {
  milestone: NextMilestone
  onDismiss: () => void
}

function MilestoneCelebration({ milestone, onDismiss }: MilestoneCelebrationProps) {
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <>
      <style>{`
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cardPopIn {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .celebration-backdrop, .celebration-card {
            animation-duration: 0ms !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="celebration-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "rgba(0,0,0,0.85)",
          animation: "backdropFadeIn 200ms ease-in forwards",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-heading"
      >
        {/* Card */}
        <div
          className="celebration-card w-full max-w-[400px] rounded-lg border border-[#2a2a2a] bg-[#111111] px-8 py-10 text-center"
          style={{
            animation:
              "cardPopIn 280ms cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {/* Label */}
          <p
            className="mb-4 text-[12px] uppercase tracking-[0.1em] text-[#f97316]"
            style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }}
          >
            Milestone
          </p>

          {/* Heading */}
          <h2
            id="celebration-heading"
            className="mb-3 text-[28px] leading-tight text-white sm:text-[32px]"
            style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }}
          >
            The Suns just reached{" "}
            <span className="text-[#f97316]">{milestone.name}</span>!
          </h2>

          {/* Sub-text */}
          <p className="mb-8 text-[16px] text-[#9ca3af]">
            {formatMilestoneType(milestone.milestone_type)} milestone —
            reached at {formatMiles(milestone.mile_marker)} miles.
          </p>

          {/* CTA */}
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-md bg-[#f97316] py-3.5 text-[16px] font-bold uppercase tracking-wider text-white transition-opacity duration-100 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
            style={{ fontFamily: "'Oswald', sans-serif", minHeight: "52px" }}
          >
            Keep trekking
          </button>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Rotating inspirational quotes
// ---------------------------------------------------------------------------

const QUOTES = [
  {
    text: "If you want to go fast, go alone. If you want to go far, go together.",
    attribution: "African Proverb",
  },
  {
    text: "None of us is as smart as all of us.",
    attribution: "Ken Blanchard",
  },
  {
    text: "Individually, we are one drop. Together, we are an ocean.",
    attribution: "Ryunosuke Satoro",
  },
  {
    text: "The strength of the team is each individual member. The strength of each member is the team.",
    attribution: "Phil Jackson",
  },
  {
    text: "Alone we can do so little; together we can do so much.",
    attribution: "Helen Keller",
  },
] as const

function RotatingQuote() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length)
        setVisible(true)
      }, 500)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const quote = QUOTES[index]

  return (
    <div
      className="border-b border-[#1f1f1f] px-4 py-4 text-center"
      aria-live="polite"
      aria-atomic="true"
    >
      <p
        className="mx-auto max-w-lg text-[13px] italic leading-relaxed text-[#9ca3af] transition-opacity duration-500"
        style={{ opacity: visible ? 1 : 0 }}
      >
        &ldquo;{quote.text}&rdquo;
        <span className="ml-2 not-italic text-[#4b5563]">
          — {quote.attribution}
        </span>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contribution overlay card
// ---------------------------------------------------------------------------

interface ContributionOverlayProps {
  beforeMiles: number
  afterMiles: number
  onDismiss: () => void
}

function ContributionOverlay({
  beforeMiles,
  afterMiles,
  onDismiss,
}: ContributionOverlayProps) {
  const contributed = afterMiles - beforeMiles
  const milesText = contributed < 1
    ? `${(contributed * 5280).toFixed(0)} feet` // edge case: sub-mile
    : contributed === Math.floor(contributed)
      ? `${Math.round(contributed).toLocaleString()} miles`
      : `${contributed.toFixed(1)} miles`

  return (
    <>
      <style>{`
        @keyframes contributionSlideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .contribution-card { animation-duration: 0ms !important; }
        }
      `}</style>

      <div
        className="contribution-card pointer-events-auto absolute bottom-6 left-1/2 z-20 w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 rounded-lg border border-[#2a2a2a] bg-[#111111] px-6 py-5 shadow-2xl"
        style={{
          animation: "contributionSlideUp 260ms cubic-bezier(0.22,1,0.36,1) forwards",
        }}
        role="status"
        aria-live="polite"
        data-testid="contribution-overlay"
      >
        {/* Label */}
        <p
          className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[#f97316]"
          style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }}
        >
          Your contribution
        </p>

        {/* Main message */}
        <p
          className="mb-1 text-[22px] leading-tight text-white sm:text-[26px]"
          style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }}
        >
          You just moved the group{" "}
          <span className="text-[#f97316]">{milesText}</span>!
        </p>

        {/* Before / after markers */}
        <p className="mt-2 text-[13px] text-[#6b7280]">
          {formatMiles(beforeMiles)} mi{" "}
          <span className="mx-1 text-[#f97316]">&#8594;</span>{" "}
          {formatMiles(Math.round(afterMiles))} mi into the journey
        </p>

        {/* Dismiss */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss contribution highlight"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[#4b5563] transition-colors duration-100 hover:bg-[#1f1f1f] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="1" y1="1" x2="11" y2="11" />
            <line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Missing token fallback
// ---------------------------------------------------------------------------

function TokenMissingFallback() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#0a0a0a] p-8 text-center">
      <div
        className="text-[40px] font-bold uppercase tracking-wide text-white"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        Map Unavailable
      </div>
      <p className="max-w-sm text-[15px] text-[#9ca3af]">
        A Mapbox API token is required to display the map. Add{" "}
        <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[13px] text-[#f97316]">
          VITE_MAPBOX_TOKEN
        </code>{" "}
        to your <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[13px] text-[#f97316]">.env</code> file and restart the dev server.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MapPage
// ---------------------------------------------------------------------------

export default function MapPage() {
  // Read at render time so tests can stub import.meta.env before rendering.
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
  const location = useLocation()

  if (!token) {
    return <TokenMissingFallback />
  }

  // Pull contribution state from React Router navigation state (set by LogPage
  // after a successful submission). Validate the shape before trusting it.
  const rawState = location.state as Record<string, unknown> | null
  const contribution: ContributionState | null =
    rawState !== null &&
    typeof rawState.beforeMiles === "number" &&
    typeof rawState.afterMiles === "number" &&
    rawState.afterMiles > rawState.beforeMiles
      ? { beforeMiles: rawState.beforeMiles, afterMiles: rawState.afterMiles }
      : null

  return <MapPageInner token={token} contribution={contribution} />
}

interface MapPageInnerProps {
  token: string
  contribution: ContributionState | null
}

function MapPageInner({ token, contribution }: MapPageInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const markerElRef = useRef<HTMLDivElement | null>(null)

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Contribution highlight — tracks whether the overlay is visible.
  // Dismissed by the user; also cleared on unmount (navigate away).
  const [contributionVisible, setContributionVisible] = useState(
    contribution !== null
  )

  // Milestone celebration queue
  const [celebrationQueue, setCelebrationQueue] = useState<NextMilestone[]>([])
  const prevStatsRef = useRef<Stats | null>(null)

  // ---------------------------------------------------------------------------
  // Data fetching + polling
  // ---------------------------------------------------------------------------

  async function fetchStats() {
    try {
      const data = await getStats()
      setStats(data)
      setFetchError(false)
      setLoading(false)

      // Check if the next milestone changed — if so, the previous one was just
      // crossed. Show a celebration if we haven't seen it this session.
      const prev = prevStatsRef.current
      if (
        prev?.next_milestone &&
        data.next_milestone?.id !== prev.next_milestone.id
      ) {
        const crossed = prev.next_milestone
        const seen = getSeenIds()
        if (!seen.has(crossed.id)) {
          setCelebrationQueue((q) => [...q, crossed])
        }
      }
      prevStatsRef.current = data
    } catch {
      setFetchError(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    const interval = setInterval(fetchStats, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Map initialisation
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!mapContainerRef.current) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-117.16, 32.72],
      zoom: 2,
      bearing: 0,
      pitch: 0,
      attributionControl: false,
    })

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    )
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right")

    // Resize whenever the container dimensions change (handles layout shifts)
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(mapContainerRef.current)

    map.on("load", () => {
      // Ensure canvas fills the container after layout has settled
      map.resize()

      // Traveled route layer
      map.addSource("route-traveled", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [ROUTE_COORDS[0]] },
        },
      })
      // Glow layer under the traveled route for visibility on satellite
      map.addLayer({
        id: "route-traveled-glow",
        type: "line",
        source: "route-traveled",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#f97316",
          "line-width": 10,
          "line-opacity": 0.25,
          "line-blur": 6,
        },
      })
      map.addLayer({
        id: "route-traveled",
        type: "line",
        source: "route-traveled",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#fb923c",
          "line-width": 4,
          "line-opacity": 1,
        },
      })

      // Remaining route layer
      map.addSource("route-remaining", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: ROUTE_COORDS,
          },
        },
      })
      map.addLayer(
        {
          id: "route-remaining",
          type: "line",
          source: "route-remaining",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#ffffff",
            "line-width": 2,
            "line-opacity": 0.5,
            "line-dasharray": [3, 4],
          },
        },
        "route-traveled-glow" // insert below the glow + traveled layers
      )

      // Contribution segment layer — highlighted in white with an orange glow.
      // Initially empty; populated in the contribution effect below when
      // navigation state carries beforeMiles/afterMiles.
      map.addSource("contribution-segment", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        },
      })
      // Glow ring — wider, soft orange
      map.addLayer({
        id: "contribution-segment-glow",
        type: "line",
        source: "contribution-segment",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#FF6B00",
          "line-width": 18,
          "line-opacity": 0.3,
          "line-blur": 8,
        },
      })
      // Core line — bright white on top of the orange traveled line
      map.addLayer({
        id: "contribution-segment",
        type: "line",
        source: "contribution-segment",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 6,
          "line-opacity": 1,
        },
      })

      setMapReady(true)
    })

    mapRef.current = map

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  // token is stable for the lifetime of the component (guard above ensures it's truthy)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Update map layers when stats change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !stats) return

    const fraction = stats.total_miles / EARTH_CIRCUMFERENCE_MILES
    const { traveled, remaining } = splitRoute(fraction)
    const currentPos = interpolatePosition(fraction)

    // Update route sources
    const traveledSource = map.getSource("route-traveled") as
      | mapboxgl.GeoJSONSource
      | undefined
    if (traveledSource) {
      traveledSource.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: traveled },
      })
    }

    const remainingSource = map.getSource("route-remaining") as
      | mapboxgl.GeoJSONSource
      | undefined
    if (remainingSource) {
      remainingSource.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: remaining },
      })
    }

    // Current position marker
    if (!markerRef.current) {
      // Create the custom pulsing marker element
      const el = document.createElement("div")
      el.className = "trekker-marker"
      el.style.cssText = `
        position: relative;
        width: 20px;
        height: 20px;
        cursor: pointer;
      `
      el.innerHTML = `
        <style>
          @keyframes markerPulse {
            0%   { transform: scale(1);   opacity: 0.6; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .marker-ring { animation: none !important; opacity: 0 !important; }
          }
        </style>
        <div class="marker-ring" style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #f97316;
          animation: markerPulse 2s ease-out infinite;
        "></div>
        <div style="
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: #f97316;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
        "></div>
      `
      markerElRef.current = el

      const popup = new mapboxgl.Popup({
        offset: 16,
        closeButton: false,
        className: "trekker-popup",
      }).setHTML(
        `<div style="
          background: #111111;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          padding: 8px 12px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #d1d5db;
          white-space: nowrap;
        ">
          <strong style="color: #f97316; font-family: 'Oswald', sans-serif; font-weight: 700;">
            ${formatMiles(stats.total_miles)} miles
          </strong>
           into the journey
        </div>`
      )

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(currentPos)
        .setPopup(popup)
        .addTo(map)

      markerRef.current = marker
    } else {
      markerRef.current.setLngLat(currentPos)
    }

    // Fly to current position on first data load — but only when there is no
    // contribution state (the contribution effect handles camera in that case).
    if (
      (!prevStatsRef.current || prevStatsRef.current.total_miles === 0) &&
      contribution === null
    ) {
      map.flyTo({
        center: currentPos,
        zoom: 4,
        duration: 1200,
        essential: true,
      })
    }
  }, [stats, mapReady, contribution])

  // ---------------------------------------------------------------------------
  // Contribution segment highlight + fitBounds
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !contribution) return

    const { beforeMiles, afterMiles } = contribution
    const coords = getContributionCoords(beforeMiles, afterMiles)

    // Populate the contribution segment source
    const segmentSource = map.getSource("contribution-segment") as
      | mapboxgl.GeoJSONSource
      | undefined
    if (segmentSource) {
      segmentSource.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      })
    }

    // Animate camera to the bounding box of the segment
    const [[minLng, minLat], [maxLng, maxLat]] = coordsBounds(coords)
    map.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      {
        padding: { top: 120, bottom: 200, left: 80, right: 80 },
        duration: 1400,
        essential: true,
      }
    )
  }, [mapReady, contribution])

  // Clear the contribution segment and fly back to current position when dismissed
  useEffect(() => {
    if (contributionVisible) return
    const map = mapRef.current
    if (!map) return

    // Clear the highlight using an empty FeatureCollection (valid GeoJSON)
    const segmentSource = map.getSource("contribution-segment") as
      | mapboxgl.GeoJSONSource
      | undefined
    if (segmentSource) {
      segmentSource.setData({ type: "FeatureCollection", features: [] })
    }

    // Fly back to the current collective position
    if (stats) {
      const fraction = stats.current_position / EARTH_CIRCUMFERENCE_MILES
      const [lng, lat] = interpolatePosition(fraction)
      map.flyTo({ center: [lng, lat], zoom: 4, duration: 1200 })
    }
  }, [contributionVisible, stats])

  // ---------------------------------------------------------------------------
  // Milestone celebration queue management
  // ---------------------------------------------------------------------------

  function dismissCelebration() {
    setCelebrationQueue((q) => {
      if (q.length === 0) return q
      const [current, ...rest] = q
      markIdSeen(current.id)
      return rest
    })
  }

  const currentCelebration = celebrationQueue[0] ?? null

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const showSkeleton = loading && !fetchError

  return (
    <>
      {/* Keyframe definitions */}
      <style>{`
        .mapboxgl-popup-content {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .mapboxgl-popup-tip {
          display: none !important;
        }
      `}</style>

      <div
        className="flex flex-1 flex-col"
        style={{ background: "#0a0a0a" }}
        data-testid="map-page"
      >
        {/* ----------------------------------------------------------------- */}
        {/* Map container                                                      */}
        {/* ----------------------------------------------------------------- */}
        <div
          className="relative w-full"
          style={{ minHeight: "55vh", height: "clamp(55vh, 60vh, 65vh)" }}
        >
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            aria-label="Live circumnavigation route map"
            role="img"
          />

          {/* Contribution overlay — anchored inside the map container */}
          {contribution !== null && contributionVisible && (
            <ContributionOverlay
              beforeMiles={contribution.beforeMiles}
              afterMiles={contribution.afterMiles}
              onDismiss={() => setContributionVisible(false)}
            />
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Stats panel                                                        */}
        {/* ----------------------------------------------------------------- */}
        <div
          className="border-b border-[#1f1f1f]"
          data-testid="stats-panel"
        >
          <div className="mx-auto flex max-w-screen-xl flex-col divide-y divide-[#1f1f1f] sm:flex-row sm:divide-x sm:divide-y-0">
            {showSkeleton ? (
              <StatsSkeleton />
            ) : (
              <StatsDisplay
                stats={stats ?? { total_miles: 0, current_position: 0, next_milestone: null }}
                onRetry={fetchStats}
                fetchError={fetchError && stats === null}
              />
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Rotating quote                                                     */}
        {/* ----------------------------------------------------------------- */}
        <RotatingQuote />

        {/* ----------------------------------------------------------------- */}
        {/* Log Activity CTA — full-width below stats on mobile                */}
        {/* ----------------------------------------------------------------- */}
        <div className="mt-auto sm:hidden">
          <Link
            to="/log"
            className="block w-full bg-[#f97316] py-4 text-center text-[16px] font-bold uppercase tracking-wider text-white transition-opacity duration-100 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
            style={{ fontFamily: "'Oswald', sans-serif", minHeight: "52px" }}
          >
            Log Activity
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Milestone celebration overlay                                        */}
      {/* ------------------------------------------------------------------- */}
      {currentCelebration && (
        <MilestoneCelebration
          key={currentCelebration.id}
          milestone={currentCelebration}
          onDismiss={dismissCelebration}
        />
      )}
    </>
  )
}
