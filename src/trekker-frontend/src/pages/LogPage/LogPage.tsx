import { type FormEvent, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { createSubmission } from "../../lib/api"
import type { CreateSubmissionResponse, InputType, Submission } from "../../lib/types"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS_PER_MILE = 2500

function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

function formatMiles(miles: number): string {
  return miles % 1 === 0 ? String(miles) : miles.toFixed(1).replace(/\.?0+$/, "")
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FieldErrorProps {
  message: string | null
}

function FieldError({ message }: FieldErrorProps) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="mt-1.5 text-[13px] text-red-600"
      style={{ animation: "fadeIn 150ms ease-in forwards" }}
    >
      {message}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------

interface SuccessStateProps {
  submission: Submission
  onLogMore: () => void
}

function SuccessState({ submission, onLogMore }: SuccessStateProps) {
  const miles = formatMiles(submission.converted_miles)
  const wasSteps = submission.input_type === "steps"

  return (
    <div
      className="flex flex-col items-center gap-6 py-10 text-center"
      style={{ animation: "fadeIn 200ms ease-in forwards" }}
    >
      {/* Check circle */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f97316]"
        style={{ animation: "popIn 280ms cubic-bezier(0.34,1.56,0.64,1) 150ms both" }}
        aria-hidden="true"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2">
        <p
          className="text-2xl font-bold uppercase tracking-wide text-[#2C1810]"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          You just added{" "}
          <span className="text-[#f97316]">{miles} miles</span>
          {wasSteps
            ? ` (${submission.input_value.toLocaleString()} steps)`
            : null}{" "}
          to the journey.
        </p>
        <p className="text-base text-[#8C7B6B]">
          The TRACE Suns are on the move.
        </p>
      </div>

      {/* Secondary CTA */}
      <Link
        to="/"
        className="mt-2 block w-full rounded-md bg-[#f97316] py-3.5 text-center font-bold uppercase tracking-wider text-white transition-opacity duration-100 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
        style={{ fontFamily: "'Oswald', sans-serif", fontSize: "16px", minHeight: "52px", lineHeight: "52px", paddingTop: 0, paddingBottom: 0 }}
      >
        See where we are
      </Link>

      {/* Reset link */}
      <button
        type="button"
        onClick={onLogMore}
        className="text-sm text-[#f97316] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
      >
        Log more activity
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormErrors {
  name: string | null
  date: string | null
  value: string | null
}

const EMPTY_ERRORS: FormErrors = { name: null, date: null, value: null }

// ---------------------------------------------------------------------------
// LogPage
// ---------------------------------------------------------------------------

export default function LogPage() {
  const today = todayISO()

  const [name, setName] = useState("")
  const [date, setDate] = useState(today)
  const [inputType, setInputType] = useState<InputType>("miles")
  const [inputValue, setInputValue] = useState("")
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS)
  const [hasAttempted, setHasAttempted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<Submission | null>(null)

  // Re-validate in real time after first submit attempt
  useEffect(() => {
    if (hasAttempted) {
      setErrors(validate())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, date, inputValue, hasAttempted])

  const submitButtonRef = useRef<HTMLButtonElement>(null)

  // Capture natural button width on first render so it doesn't shift during loading
  useEffect(() => {
    if (submitButtonRef.current) {
      const width = submitButtonRef.current.offsetWidth
      submitButtonRef.current.style.minWidth = `${width}px`
    }
  }, [])

  function validate(): FormErrors {
    const errs: FormErrors = { name: null, date: null, value: null }

    if (!name.trim()) {
      errs.name = "Please enter a name or class name."
    }

    if (!date) {
      errs.date = "Please enter a valid date."
    } else if (date > today) {
      errs.date = "Date can't be in the future."
    }

    const parsed = parseFloat(inputValue)
    if (!inputValue || isNaN(parsed) || parsed <= 0) {
      errs.value = "Enter a number greater than 0."
    }

    return errs
  }

  function hasErrors(errs: FormErrors): boolean {
    return errs.name !== null || errs.date !== null || errs.value !== null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setApiError(null)
    setHasAttempted(true)

    const errs = validate()
    setErrors(errs)
    if (hasErrors(errs)) return

    setLoading(true)

    try {
      const result: CreateSubmissionResponse = await createSubmission({
        submission: {
          name: name.trim(),
          activity_date: date,
          input_type: inputType,
          input_value: parseFloat(inputValue),
        },
      })
      setSuccessData(result.submission)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Try again."
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  function handleLogMore() {
    setName("")
    setDate(todayISO())
    setInputType("miles")
    setInputValue("")
    setErrors(EMPTY_ERRORS)
    setHasAttempted(false)
    setApiError(null)
    setSuccessData(null)
  }

  const stepsConvertedMiles =
    inputType === "steps" && inputValue && parseFloat(inputValue) > 0
      ? (parseFloat(inputValue) / STEPS_PER_MILE).toFixed(1)
      : null

  const valueLabel = inputType === "miles" ? "How many miles?" : "How many steps?"
  const submitLabel =
    inputType === "miles" ? "Log your miles" : "Log your steps"

  return (
    <>
      {/* Inline keyframe animations — scoped to this page */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0ms !important;
            animation-delay: 0ms !important;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[480px] px-5 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <h1
            className="text-[28px] font-bold uppercase leading-tight tracking-wide text-[#2C1810]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Log Your Activity
          </h1>
          <p className="mt-1 text-sm text-[#8C7B6B]">Every mile counts.</p>
        </div>

        {/* Success state */}
        {successData !== null ? (
          <div
            key="success"
            style={{ animation: "fadeIn 200ms ease-in forwards" }}
          >
            <SuccessState submission={successData} onLogMore={handleLogMore} />
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ animation: "fadeIn 150ms ease-in forwards" }}
          >
            <div className="flex flex-col gap-6">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-[#2C1810]"
                >
                  Your name or class name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Ms. Rivera's class"
                  autoComplete="name"
                  disabled={loading}
                  className={[
                    "w-full rounded-md border bg-white px-4 py-3 text-base text-[#2C1810] placeholder-[#8C7B6B]",
                    "outline-none transition-colors duration-100",
                    "focus:border-[#f97316]",
                    "disabled:opacity-70",
                    errors.name ? "border-red-400" : "border-[#E8DDD0]",
                  ].join(" ")}
                />
                <FieldError message={errors.name} />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="date"
                  className="text-sm font-medium text-[#2C1810]"
                >
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  max={today}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={loading}
                  className={[
                    "w-full rounded-md border bg-white px-4 py-3 text-base text-[#2C1810]",
                    "outline-none transition-colors duration-100",
                    "focus:border-[#f97316]",
                    "disabled:opacity-70",
                    errors.date ? "border-red-400" : "border-[#E8DDD0]",
                  ].join(" ")}
                />
                <FieldError message={errors.date} />
              </div>

              {/* Miles / Steps toggle */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#2C1810]">
                  Activity type
                </span>
                <div
                  role="group"
                  aria-label="Activity type"
                  className="flex rounded-md border border-[#E8DDD0] overflow-hidden bg-[#F5EFE6]"
                >
                  {(["miles", "steps"] as InputType[]).map((type) => {
                    const isActive = inputType === type
                    return (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setInputType(type)}
                        disabled={loading}
                        className={[
                          "flex-1 py-3 text-sm font-bold uppercase tracking-wider",
                          "transition-colors duration-100",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#f97316]",
                          "disabled:cursor-not-allowed disabled:opacity-70",
                          isActive
                            ? "bg-[#f97316] text-white"
                            : "bg-transparent text-[#8C7B6B] hover:text-[#2C1810]",
                        ].join(" ")}
                        style={{ fontFamily: "'Oswald', sans-serif", minHeight: "48px" }}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Value input */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="inputValue"
                  className="text-sm font-medium text-[#2C1810]"
                >
                  {valueLabel}
                </label>
                <input
                  id="inputValue"
                  type="number"
                  min="0.01"
                  step="any"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  disabled={loading}
                  className={[
                    "w-full rounded-md border bg-white px-4 py-3 text-base text-[#2C1810] placeholder-[#8C7B6B]",
                    "outline-none transition-colors duration-100",
                    "focus:border-[#f97316]",
                    "disabled:opacity-70",
                    errors.value ? "border-red-400" : "border-[#E8DDD0]",
                  ].join(" ")}
                />

                {/* Steps conversion hint */}
                <div
                  aria-live="polite"
                  className={[
                    "overflow-hidden transition-opacity duration-150",
                    inputType === "steps" ? "opacity-100" : "opacity-0 pointer-events-none h-0",
                  ].join(" ")}
                >
                  {stepsConvertedMiles !== null ? (
                    <p className="text-xs text-[#8C7B6B]">
                      {"\u2248"} {stepsConvertedMiles} miles &nbsp;&middot;&nbsp; 2,500 steps = 1 mile
                    </p>
                  ) : (
                    <p className="text-xs text-[#8C7B6B]">2,500 steps = 1 mile</p>
                  )}
                </div>

                <FieldError message={errors.value} />
              </div>

              {/* API error banner */}
              {apiError !== null && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-md border-l-[3px] border-red-500 bg-red-50 px-4 py-3"
                  style={{ animation: "slideDown 200ms ease-out forwards" }}
                >
                  <p className="flex-1 text-sm text-red-700">{apiError}</p>
                  <button
                    type="button"
                    onClick={() => setApiError(null)}
                    aria-label="Dismiss error"
                    className="shrink-0 text-red-500 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="1" y1="1" x2="13" y2="13" />
                      <line x1="13" y1="1" x2="1" y2="13" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                ref={submitButtonRef}
                type="submit"
                disabled={loading}
                className={[
                  "w-full rounded-md bg-[#f97316] py-3.5 font-bold uppercase tracking-wider text-white",
                  "transition-opacity duration-100 hover:opacity-90",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                ].join(" ")}
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: "16px",
                  minHeight: "52px",
                }}
              >
                {loading ? "\u00b7\u00b7\u00b7" : submitLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
