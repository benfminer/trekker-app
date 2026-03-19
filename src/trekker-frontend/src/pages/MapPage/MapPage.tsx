// MapPage — placeholder for Phase 2.
// Will render the Mapbox GL JS globe with the circumnavigation route and
// current position marker.

export default function MapPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1
        className="text-5xl font-bold uppercase tracking-wide text-[#f97316] sm:text-7xl"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        The Trekkers Map
      </h1>
      <p className="text-white/50">
        Live route map — coming in Phase 2.
      </p>
    </div>
  )
}
