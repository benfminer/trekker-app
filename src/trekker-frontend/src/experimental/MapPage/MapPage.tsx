import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { getStats } from "../../lib/api"
import type { NextMilestone, Stats } from "../../lib/types"

// ---------------------------------------------------------------------------
// Experimental MapPage — Mission Control
//
// Creative direction: The map is the full viewport — no panel below it.
// Stats float as a mission-control HUD in the top-left: massive Oswald
// numerals, minimal labels, generous spacing. The bottom-right holds the
// next-milestone panel — styled as a field dispatch.
// A progress bar burns along the very bottom edge of the viewport in orange.
// The map style shifts from satellite to a custom dark terrain feel (via
// Mapbox Navigation Night) to reinforce the expedition-at-night aesthetic.
// The position marker is a crosshair, not a dot — precise, military.
// The milestone celebration is full-screen takeover with kinetic typography.
// ---------------------------------------------------------------------------

const EARTH_CIRCUMFERENCE_MILES = 24900
const SCHOOL_YEAR_GOAL_MILES = 20286
const POLL_INTERVAL_MS = 30_000

// Route coordinates — same as production. Extending longitude past antimeridian
// is native Mapbox GL JS behaviour for GeoJSON sources.
const ROUTE_COORDS: [number, number][] = [
  [-117.16, 32.72],
  [-100.0,  32.72],
  [-85.0,   32.72],
  [-70.0,   32.72],
  [-55.0,   32.72],
  [-40.0,   32.72],
  [-25.0,   32.72],
  [-10.0,   32.72],
  [5.0,     32.72],
  [20.0,    32.72],
  [35.0,    32.72],
  [50.0,    32.72],
  [65.0,    32.72],
  [80.0,    32.72],
  [95.0,    32.72],
  [110.0,   32.72],
  [125.0,   32.72],
  [140.0,   32.72],
  [155.0,   32.72],
  [170.0,   32.72],
  [185.0,   32.72],
  [200.0,   32.72],
  [215.0,   32.72],
  [230.0,   32.72],
  [242.84,  32.72],
]

// ---------------------------------------------------------------------------
// Route utilities (identical logic to production — no API coupling)
// ---------------------------------------------------------------------------

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
  if (!splitDone) remaining.push(...ROUTE_COORDS.slice(1))
  return { traveled, remaining }
}

// ---------------------------------------------------------------------------
// Milestone session tracking
// ---------------------------------------------------------------------------

const SESSION_KEY = "exp_seen_milestone_ids"

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
// HUD Stat Block — top-left floating panel
// ---------------------------------------------------------------------------

interface HudStatProps {
  value: string
  label: string
  accent?: boolean
  sublabel?: string
}

function HudStat({ value, label, accent = false, sublabel }: HudStatProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <div
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(36px, 5vw, 56px)",
          lineHeight: 0.95,
          color: accent ? "#f97316" : "#FFFFFF",
          letterSpacing: "-0.01em",
          // Prevent FOUC while Oswald loads
          fontDisplay: "swap",
        } as React.CSSProperties}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 400,
          fontSize: "10px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#6B5E52",
        }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            color: "#f97316",
            marginTop: "2px",
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton HUD
// ---------------------------------------------------------------------------

function HudSkeleton() {
  return (
    <>
      <style>{`
        @keyframes expShimmer {
          0%   { opacity: 0.3; }
          50%  { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
        .exp-shimmer {
          animation: expShimmer 1.8s ease-in-out infinite;
          background: #1E1A16;
          border-radius: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .exp-shimmer { animation: none; opacity: 0.4; }
        }
      `}</style>
      {[80, 60, 100].map((w, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div className="exp-shimmer" style={{ height: "48px", width: `${w}px` }} />
          <div className="exp-shimmer" style={{ height: "8px", width: "50px" }} />
        </div>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Progress bar — burns along bottom edge of the full viewport
// ---------------------------------------------------------------------------

interface ProgressBurnProps {
  pct: number // 0–100
}

function ProgressBurn({ pct }: ProgressBurnProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct}% of goal reached`}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "rgba(255,255,255,0.05)",
        zIndex: 10,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, #c2410c 0%, #f97316 60%, #fb923c 100%)",
          boxShadow: "0 0 12px 2px rgba(249,115,22,0.6)",
          transition: "width 1200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Milestone dispatch panel — bottom right
// ---------------------------------------------------------------------------

interface MilestoneDispatchProps {
  next: NextMilestone
}

function MilestoneDispatch({ next }: MilestoneDispatchProps) {
  return (
    <div
      style={{
        background: "rgba(13, 11, 9, 0.88)",
        border: "1px solid #2A2118",
        borderRadius: "2px",
        padding: "14px 18px",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        maxWidth: "200px",
      }}
    >
      {/* Label row */}
      <div
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 400,
          fontSize: "9px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#3D3530",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {/* Blinking dot */}
        <span
          style={{
            display: "inline-block",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "#f97316",
            animation: "expBlink 2s ease-in-out infinite",
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        Next Checkpoint
      </div>

      {/* Milestone name */}
      <div
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          lineHeight: 1.1,
          color: "#FFFFFF",
          marginBottom: "6px",
        }}
      >
        {next.name}
      </div>

      {/* Miles remaining */}
      <div
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 400,
          fontSize: "13px",
          color: "#f97316",
        }}
      >
        {formatMiles(next.miles_remaining)} mi away
      </div>

      {/* Type tag */}
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "9px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#3D3530",
          marginTop: "8px",
          borderTop: "1px solid #1E1A16",
          paddingTop: "8px",
        }}
      >
        {formatMilestoneType(next.milestone_type)}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Milestone Celebration — full-screen kinetic typographic takeover
// ---------------------------------------------------------------------------

interface CelebrationProps {
  milestone: NextMilestone
  onDismiss: () => void
}

function MilestoneCelebration({ milestone, onDismiss }: CelebrationProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 9000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <>
      <style>{`
        @keyframes celebFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes celebSlideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes celebType {
          from { transform: translateY(20px) scaleY(0.8); opacity: 0; }
          to   { transform: translateY(0) scaleY(1);      opacity: 1; }
        }
        @keyframes celebPulse {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.35; }
        }
        @media (prefers-reduced-motion: reduce) {
          .celeb-bg, .celeb-content, .celeb-name, .celeb-sub, .celeb-btn {
            animation: none !important;
          }
        }
      `}</style>

      {/* Full-screen backdrop */}
      <div
        className="celeb-bg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exp-celebration-heading"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(13, 11, 9, 0.96)",
          animation: "celebFadeIn 250ms ease-in forwards",
          padding: "24px",
          textAlign: "center",
        }}
      >
        {/* Large repeated background text — decorative */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            animation: "celebPulse 3s ease-in-out infinite",
          }}
        >
          <span
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(80px, 20vw, 220px)",
              lineHeight: 1,
              color: "#f97316",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            {milestone.name}
          </span>
        </div>

        {/* Foreground content */}
        <div
          className="celeb-content"
          style={{
            position: "relative",
            zIndex: 1,
            animation: "celebSlideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both",
          }}
        >
          {/* Eyebrow */}
          <p
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 400,
              fontSize: "12px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#f97316",
              marginBottom: "16px",
            }}
          >
            {formatMilestoneType(milestone.milestone_type)} Reached
          </p>

          {/* Main heading */}
          <h2
            id="exp-celebration-heading"
            className="celeb-name"
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(40px, 8vw, 80px)",
              lineHeight: 0.95,
              color: "#FFFFFF",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              marginBottom: "20px",
              animation: "celebType 500ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both",
            }}
          >
            The Suns reached<br />
            <span style={{ color: "#f97316" }}>{milestone.name}</span>
          </h2>

          {/* Mile marker */}
          <p
            className="celeb-sub"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "15px",
              color: "#8C7B6B",
              marginBottom: "40px",
              animation: "celebType 500ms cubic-bezier(0.22, 1, 0.36, 1) 350ms both",
            }}
          >
            {formatMiles(milestone.mile_marker)} miles into the journey
          </p>

          {/* CTA */}
          <button
            type="button"
            onClick={onDismiss}
            className="celeb-btn"
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#0D0B09",
              background: "#f97316",
              border: "none",
              borderRadius: "2px",
              padding: "16px 40px",
              cursor: "pointer",
              minHeight: "52px",
              animation: "celebType 500ms cubic-bezier(0.22, 1, 0.36, 1) 500ms both",
              transition: "opacity 100ms linear",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1"
            }}
          >
            Keep Trekking
          </button>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Token missing fallback
// ---------------------------------------------------------------------------

function TokenMissingFallback() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        background: "#0D0B09",
        padding: "32px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: "36px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#FFFFFF",
        }}
      >
        Map Unavailable
      </div>
      <p style={{ maxWidth: "360px", fontSize: "14px", color: "#6B5E52", lineHeight: 1.6 }}>
        Add{" "}
        <code
          style={{
            background: "#1A1612",
            color: "#f97316",
            padding: "1px 6px",
            borderRadius: "2px",
            fontSize: "12px",
          }}
        >
          VITE_MAPBOX_TOKEN
        </code>{" "}
        to your <code style={{ background: "#1A1612", color: "#f97316", padding: "1px 6px", borderRadius: "2px", fontSize: "12px" }}>.env</code> file and restart.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MapPage — exported entry point
// ---------------------------------------------------------------------------

export default function MapPage() {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
  if (!token) return <TokenMissingFallback />
  return <MapPageInner token={token} />
}

// ---------------------------------------------------------------------------
// MapPageInner — full implementation
// ---------------------------------------------------------------------------

function MapPageInner({ token }: { token: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [celebrationQueue, setCelebrationQueue] = useState<NextMilestone[]>([])
  const prevStatsRef = useRef<Stats | null>(null)

  // Whether the HUD is visible — fades in after first data load
  const [hudVisible, setHudVisible] = useState(false)

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  async function fetchStats() {
    try {
      const data = await getStats()
      setStats(data)
      setFetchError(false)
      setLoading(false)
      setHudVisible(true)

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
      // Navigation Night gives a dark terrain feel — cooler visual base than
      // satellite for the expedition-at-night aesthetic.
      style: "mapbox://styles/mapbox/navigation-night-v1",
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

    map.on("load", () => {
      // --- Traveled route layers ---
      map.addSource("route-traveled", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [ROUTE_COORDS[0]] },
        },
      })

      // Outer glow — wide, low opacity
      map.addLayer({
        id: "route-traveled-glow-outer",
        type: "line",
        source: "route-traveled",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#f97316",
          "line-width": 20,
          "line-opacity": 0.08,
          "line-blur": 12,
        },
      })

      // Inner glow — tighter
      map.addLayer({
        id: "route-traveled-glow",
        type: "line",
        source: "route-traveled",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#f97316",
          "line-width": 8,
          "line-opacity": 0.2,
          "line-blur": 4,
        },
      })

      // Core traveled line — solid, bright
      map.addLayer({
        id: "route-traveled",
        type: "line",
        source: "route-traveled",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#f97316",
          "line-width": 2.5,
          "line-opacity": 1,
        },
      })

      // --- Remaining route ---
      map.addSource("route-remaining", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: ROUTE_COORDS },
        },
      })

      map.addLayer(
        {
          id: "route-remaining",
          type: "line",
          source: "route-remaining",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#4A3F35",
            "line-width": 1.5,
            "line-opacity": 0.8,
            "line-dasharray": [2, 5],
          },
        },
        "route-traveled-glow-outer"
      )

      // --- Latitude ring — 32.72°N highlighted as a subtle dotted line ---
      // This is the circle of latitude the Suns are walking along. A subtle
      // visual anchor that says: this is YOUR latitude.
      const latLineCoords: [number, number][] = []
      for (let lng = -180; lng <= 180; lng += 5) {
        latLineCoords.push([lng, 32.72])
      }
      map.addSource("latitude-ring", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: latLineCoords },
        },
      })
      map.addLayer(
        {
          id: "latitude-ring",
          type: "line",
          source: "latitude-ring",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#2A4A3A",
            "line-width": 1,
            "line-opacity": 0.5,
            "line-dasharray": [1, 8],
          },
        },
        "route-remaining"
      )

      setMapReady(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Update map when stats arrive
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !stats) return

    const fraction = stats.total_miles / EARTH_CIRCUMFERENCE_MILES
    const { traveled, remaining } = splitRoute(fraction)
    const currentPos = interpolatePosition(fraction)

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

    // Crosshair marker — precision, not a blob
    if (!markerRef.current) {
      const el = document.createElement("div")
      el.innerHTML = `
        <style>
          @keyframes expCrosshairPulse {
            0%   { transform: scale(1);   opacity: 0.5; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          @keyframes expBlink {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.4; }
          }
          @media (prefers-reduced-motion: reduce) {
            .exp-marker-ring { animation: none !important; opacity: 0; }
          }
        </style>
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          cursor: pointer;
        ">
          <!-- Pulse ring -->
          <div class="exp-marker-ring" style="
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 1px solid #f97316;
            animation: expCrosshairPulse 2.4s ease-out infinite;
          "></div>
          <!-- Crosshair outer ring -->
          <div style="
            position: absolute;
            inset: 4px;
            border-radius: 50%;
            border: 1.5px solid rgba(249,115,22,0.6);
          "></div>
          <!-- Center dot -->
          <div style="
            position: absolute;
            inset: 10px;
            border-radius: 50%;
            background: #f97316;
            animation: expBlink 3s ease-in-out infinite;
          "></div>
          <!-- Horizontal tick left -->
          <div style="
            position: absolute;
            top: 50%; left: 0;
            width: 5px; height: 1px;
            background: rgba(249,115,22,0.7);
            transform: translateY(-50%);
          "></div>
          <!-- Horizontal tick right -->
          <div style="
            position: absolute;
            top: 50%; right: 0;
            width: 5px; height: 1px;
            background: rgba(249,115,22,0.7);
            transform: translateY(-50%);
          "></div>
          <!-- Vertical tick top -->
          <div style="
            position: absolute;
            left: 50%; top: 0;
            width: 1px; height: 5px;
            background: rgba(249,115,22,0.7);
            transform: translateX(-50%);
          "></div>
          <!-- Vertical tick bottom -->
          <div style="
            position: absolute;
            left: 50%; bottom: 0;
            width: 1px; height: 5px;
            background: rgba(249,115,22,0.7);
            transform: translateX(-50%);
          "></div>
        </div>
      `

      const popup = new mapboxgl.Popup({
        offset: 16,
        closeButton: false,
      }).setHTML(`
        <div style="
          background: #0D0B09;
          border: 1px solid #2A2118;
          border-radius: 2px;
          padding: 10px 14px;
          font-family: 'Inter', sans-serif;
          white-space: nowrap;
        ">
          <span style="
            font-family: 'Oswald', sans-serif;
            font-weight: 700;
            font-size: 18px;
            color: #f97316;
          ">${formatMiles(stats.total_miles)}</span>
          <span style="
            font-family: 'Oswald', sans-serif;
            font-weight: 400;
            font-size: 11px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #6B5E52;
            margin-left: 6px;
          ">miles</span>
        </div>
      `)

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(currentPos)
        .setPopup(popup)
        .addTo(map)

      markerRef.current = marker
    } else {
      markerRef.current.setLngLat(currentPos)
    }

    // First data load — fly to position
    if (!prevStatsRef.current || prevStatsRef.current.total_miles === 0) {
      map.flyTo({
        center: currentPos,
        zoom: 3,
        duration: 1800,
        essential: true,
      })
    }
  }, [stats, mapReady])

  // ---------------------------------------------------------------------------
  // Celebration queue
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
  // Derived display values
  // ---------------------------------------------------------------------------

  const pct = stats
    ? Math.min(Math.floor((stats.total_miles / SCHOOL_YEAR_GOAL_MILES) * 100), 100)
    : 0
  const milesDisplay = stats ? formatMiles(stats.total_miles) : "—"
  const pctDisplay = stats ? `${pct}%` : "—"

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <style>{`
        /* Override Mapbox popup chrome */
        .mapboxgl-popup-content {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .mapboxgl-popup-tip {
          display: none !important;
        }
        /* Mapbox attribution — make it blend with dark theme */
        .mapboxgl-ctrl-attrib {
          background: rgba(13,11,9,0.7) !important;
          color: #3D3530 !important;
          border-radius: 2px !important;
        }
        .mapboxgl-ctrl-attrib a {
          color: #6B5E52 !important;
        }
        /* Blink keyframe used by dispatch panel */
        @keyframes expBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        /* HUD fade-in */
        @keyframes expHudFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .exp-hud { animation: none !important; }
        }
      `}</style>

      <div
        data-testid="exp-map-page"
        style={{
          flex: 1,
          position: "relative",
          background: "#0D0B09",
          // Full viewport height minus the 56px header
          height: "calc(100svh - 56px)",
          overflow: "hidden",
        }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Map — fills the entire container                                  */}
        {/* ---------------------------------------------------------------- */}
        <div
          ref={mapContainerRef}
          style={{ position: "absolute", inset: 0 }}
          aria-label="Live circumnavigation route map"
          role="img"
        />

        {/* ---------------------------------------------------------------- */}
        {/* Top-left HUD — mission control stats                              */}
        {/* ---------------------------------------------------------------- */}
        <div
          className="exp-hud"
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            opacity: hudVisible ? 1 : 0,
            animation: hudVisible ? "expHudFadeIn 600ms ease-out forwards" : "none",
          }}
        >
          {/* Glass panel */}
          <div
            style={{
              background: "rgba(13, 11, 9, 0.82)",
              border: "1px solid #1E1A16",
              borderRadius: "2px",
              padding: "20px 22px",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              minWidth: "160px",
            }}
          >
            {/* Top label — mission designation */}
            <div
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 400,
                fontSize: "9px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#3D3530",
                borderBottom: "1px solid #1E1A16",
                paddingBottom: "10px",
                marginBottom: "2px",
              }}
            >
              Operation Circumnavigation
            </div>

            {/* Stats */}
            {loading && !fetchError ? (
              <HudSkeleton />
            ) : fetchError && !stats ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#6B5E52" }}>
                  Could not load progress
                </span>
                <button
                  type="button"
                  onClick={fetchStats}
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#f97316",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    textAlign: "left",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <HudStat
                  value={milesDisplay}
                  label="Miles Logged"
                  accent={false}
                />
                <HudStat
                  value={pctDisplay}
                  label="Of Goal"
                  accent={true}
                />
              </>
            )}
          </div>

          {/* Log activity CTA */}
          <Link
            to="/log"
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: "12px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0D0B09",
              background: "#f97316",
              borderRadius: "2px",
              padding: "12px 18px",
              textDecoration: "none",
              textAlign: "center",
              transition: "opacity 100ms linear",
              display: "block",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "1"
            }}
          >
            Log Activity
          </Link>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Bottom-right — Next milestone dispatch panel                      */}
        {/* ---------------------------------------------------------------- */}
        {stats?.next_milestone && (
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              right: "24px",
              zIndex: 10,
            }}
          >
            <MilestoneDispatch next={stats.next_milestone} />
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Bottom-center — progress burn bar                                 */}
        {/* ---------------------------------------------------------------- */}
        <ProgressBurn pct={pct} />

        {/* ---------------------------------------------------------------- */}
        {/* Bottom-left — coordinate readout                                  */}
        {/* ---------------------------------------------------------------- */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "20px",
            left: "24px",
            zIndex: 10,
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 400,
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#2A2118",
          }}
        >
          32.72°N · SAN DIEGO → WORLD → SAN DIEGO
        </div>
      </div>

      {/* Milestone celebration overlay */}
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
