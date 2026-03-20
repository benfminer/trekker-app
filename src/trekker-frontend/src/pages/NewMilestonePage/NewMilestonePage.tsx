import { type FormEvent, useState } from "react"
import { Link } from "react-router-dom"
import { createAdminMilestone } from "../../lib/api"
import { getAdminToken } from "../../lib/auth"
import type { MilestoneType } from "../../lib/types"

// ---------------------------------------------------------------------------
// NewMilestonePage — /admin/new-milestone
//
// Lets an authenticated admin add a new city, country, or place of interest
// to the circumnavigation route. If the group has already passed the chosen
// mile marker the milestone is triggered immediately.
// ---------------------------------------------------------------------------

const MILESTONE_TYPES: { value: MilestoneType; label: string }[] = [
  { value: "city",      label: "City" },
  { value: "country",   label: "Country" },
  { value: "continent", label: "Continent" },
  { value: "ocean",     label: "Ocean / Sea" },
]

interface SuccessState {
  name: string
  triggered: boolean
}

export default function NewMilestonePage() {
  const [name, setName]               = useState("")
  const [type, setType]               = useState<MilestoneType>("city")
  const [mileMarker, setMileMarker]   = useState("")
  const [description, setDescription] = useState("")
  const [funFact, setFunFact]         = useState("")
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState<SuccessState | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const marker = parseFloat(mileMarker)
    if (isNaN(marker) || marker < 0) {
      setError("Mile marker must be a positive number.")
      return
    }

    setLoading(true)
    try {
      const token = getAdminToken() ?? ""
      const { milestone } = await createAdminMilestone(
        {
          name,
          milestone_type: type,
          mile_marker: marker,
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(funFact.trim()     ? { fun_fact: funFact.trim() }         : {}),
        },
        token
      )
      setSuccess({ name: milestone.name, triggered: milestone.triggered })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setName("")
    setType("city")
    setMileMarker("")
    setDescription("")
    setFunFact("")
    setError(null)
    setSuccess(null)
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-[480px] px-5 py-10">
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f97316]" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold uppercase tracking-wide text-[#2C1810]" style={{ fontFamily: "'Oswald', sans-serif" }}>
              <span className="text-[#f97316]">{success.name}</span> added to the route.
            </p>
            <p className="text-base text-[#8C7B6B]">
              {success.triggered
                ? "The group has already reached this milestone — it triggered immediately."
                : "The celebration will fire when the group reaches this mile marker."}
            </p>
          </div>
          <button
            onClick={resetForm}
            className="mt-2 w-full rounded-md bg-[#f97316] py-3.5 font-bold uppercase tracking-wider text-white transition-opacity duration-100 hover:opacity-90"
            style={{ fontFamily: "'Oswald', sans-serif", fontSize: "16px", minHeight: "52px" }}
          >
            Add another
          </button>
          <Link
            to="/admin"
            className="text-sm text-[#f97316] underline-offset-2 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-5 py-10">
      {/* Page heading */}
      <div className="mb-8">
        <h1
          className="text-[28px] font-bold uppercase leading-tight tracking-wide text-[#2C1810]"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Add Milestone
        </h1>
        <p className="mt-1 text-sm text-[#8C7B6B]">Add a city or place of interest to the route.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-6">

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="milestone-name" className="text-sm font-medium text-[#2C1810]">
              Name
            </label>
            <input
              id="milestone-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder="e.g. Tokyo, Atlantic Ocean"
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] placeholder-[#8C7B6B] outline-none transition-colors duration-100 focus:border-[#f97316] disabled:opacity-70"
            />
            <p className="text-xs text-[#8C7B6B]">The name shown on the celebration card and the map.</p>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="milestone-type" className="text-sm font-medium text-[#2C1810]">
              Type
            </label>
            <select
              id="milestone-type"
              value={type}
              onChange={(e) => setType(e.target.value as MilestoneType)}
              disabled={loading}
              className="w-full appearance-none rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] outline-none transition-colors duration-100 focus:border-[#f97316] disabled:opacity-70"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238C7B6B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                paddingRight: "40px",
              }}
            >
              {MILESTONE_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="text-xs text-[#8C7B6B]">Controls the celebration style — continent crossings get bigger treatment than cities.</p>
          </div>

          {/* Mile marker */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mile-marker" className="text-sm font-medium text-[#2C1810]">
              Mile marker
            </label>
            <input
              id="mile-marker"
              type="number"
              min="0"
              step="0.1"
              required
              value={mileMarker}
              onChange={(e) => setMileMarker(e.target.value)}
              disabled={loading}
              placeholder="e.g. 7500"
              inputMode="decimal"
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] placeholder-[#8C7B6B] outline-none transition-colors duration-100 focus:border-[#f97316] disabled:opacity-70"
            />
            <p className="text-xs text-[#8C7B6B]">Cumulative miles from San Diego at which this place is reached. If the group has already passed this number, the milestone triggers immediately.</p>
          </div>

          {/* Description (optional) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="milestone-description" className="text-sm font-medium text-[#2C1810]">
              Description{" "}
              <span className="font-normal text-[#8C7B6B]">(optional)</span>
            </label>
            <textarea
              id="milestone-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder='e.g. "You crossed into Morocco!"'
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] placeholder-[#8C7B6B] outline-none transition-colors duration-100 focus:border-[#f97316] disabled:opacity-70"
            />
            <p className="text-xs text-[#8C7B6B]">A short sentence shown on the celebration card when this milestone is reached.</p>
          </div>

          {/* Fun fact (optional) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="milestone-fun-fact" className="text-sm font-medium text-[#2C1810]">
              Fun fact{" "}
              <span className="font-normal text-[#8C7B6B]">(optional)</span>
            </label>
            <textarea
              id="milestone-fun-fact"
              rows={2}
              value={funFact}
              onChange={(e) => setFunFact(e.target.value)}
              disabled={loading}
              placeholder='e.g. "Tokyo is the most populous city in the world."'
              className="w-full rounded-md border border-[#E8DDD0] bg-white px-4 py-3 text-base text-[#2C1810] placeholder-[#8C7B6B] outline-none transition-colors duration-100 focus:border-[#f97316] disabled:opacity-70"
            />
            <p className="text-xs text-[#8C7B6B]">An interesting fact about this place, displayed alongside the description.</p>
          </div>

          {/* Error */}
          {error !== null && (
            <div role="alert" className="rounded-md border-l-[3px] border-red-500 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || name.trim() === "" || mileMarker === ""}
            className="w-full rounded-md bg-[#f97316] py-3.5 font-bold uppercase tracking-wider text-white transition-opacity duration-100 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316] disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontFamily: "'Oswald', sans-serif", fontSize: "16px", minHeight: "52px" }}
          >
            {loading ? "Adding…" : "Add milestone"}
          </button>

          <Link
            to="/admin"
            className="block text-center text-sm text-[#8C7B6B] underline-offset-2 hover:text-[#2C1810] hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      </form>
    </div>
  )
}
