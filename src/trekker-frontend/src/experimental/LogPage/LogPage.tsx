import { type FormEvent, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { createSubmission } from "../../lib/api"
import type { CreateSubmissionResponse, InputType, Submission } from "../../lib/types"

// ---------------------------------------------------------------------------
// Experimental LogPage — Field Dispatch Form
//
// Creative direction: This is a field journal entry, not a web form.
// The heading is enormous Oswald that nearly bleeds off the top edge.
// The form fields are raw — borderless lines, no boxes — like filling out
// an actual logbook page. The submit action is a full-width urgent-feeling
// orange bar. The step-to-mile conversion shows as an inline callout.
// Success state is typographically bold — a dispatch confirmation.
//
// Layout: Two-column on desktop — left side is the massive contextual
// heading / form; right side is a decorative coordinate strip.
// Single column on mobile, heading scales down gracefully.
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
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "12px",
        color: "#c2410c",
        marginTop: "4px",
        animation: "expFormFadeIn 120ms ease-in forwards",
        letterSpacing: "0.02em",
      }}
    >
      {message}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Success state — dispatch confirmation
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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0",
        animation: "expFormFadeIn 300ms ease-in forwards",
      }}
    >
      {/* Eyebrow */}
      <p
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 400,
          fontSize: "11px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#f97316",
          marginBottom: "12px",
        }}
      >
        Dispatch Confirmed
      </p>

      {/* Big confirmation heading */}
      <h2
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(36px, 6vw, 64px)",
          lineHeight: 0.95,
          letterSpacing: "-0.01em",
          textTransform: "uppercase",
          color: "#E8DDD0",
          marginBottom: "16px",
        }}
      >
        +{miles}{" "}
        <span style={{ color: "#f97316" }}>miles</span>
        <br />
        added.
      </h2>

      {wasSteps && (
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            color: "#6B5E52",
            marginBottom: "8px",
          }}
        >
          {submission.input_value.toLocaleString()} steps converted at 2,500 steps/mile
        </p>
      )}

      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          color: "#8C7B6B",
          marginBottom: "40px",
          lineHeight: 1.5,
        }}
      >
        The TRACE Suns are on the move.
        <br />
        Every step counts.
      </p>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Link
          to="/"
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#0D0B09",
            background: "#f97316",
            borderRadius: "2px",
            padding: "16px 24px",
            textDecoration: "none",
            textAlign: "center",
            display: "block",
            minHeight: "52px",
            lineHeight: "20px",
            transition: "opacity 100ms linear",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1"
          }}
        >
          See Where We Are
        </Link>

        <button
          type="button"
          onClick={onLogMore}
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 400,
            fontSize: "12px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#6B5E52",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 0",
            transition: "color 80ms linear",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#E8DDD0"
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#6B5E52"
          }}
        >
          Log More Activity
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form state types
// ---------------------------------------------------------------------------

interface FormErrors {
  name: string | null
  date: string | null
  value: string | null
}

const EMPTY_ERRORS: FormErrors = { name: null, date: null, value: null }

// ---------------------------------------------------------------------------
// Decorative right-side coordinate strip (desktop only)
// ---------------------------------------------------------------------------

function CoordinateStrip() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "space-between",
        height: "100%",
        minHeight: "400px",
        paddingTop: "16px",
        paddingBottom: "16px",
        borderLeft: "1px solid #1E1A16",
        paddingLeft: "32px",
      }}
    >
      {/* Vertical text — rotated */}
      <div
        style={{
          writing_mode: "vertical-rl",
          // TypeScript-safe fallback for writingMode
          transform: "rotate(180deg)",
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 400,
          fontSize: "10px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#2A2118",
          whiteSpace: "nowrap",
        } as React.CSSProperties}
      >
        TRACE SUNS · CIRCUMNAVIGATION · 20,286 MI
      </div>

      {/* Mid: Coordinate stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
        {[
          "32.72°N",
          "117.16°W",
          "SAN DIEGO",
          "CA · USA",
        ].map((line, i) => (
          <span
            key={i}
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: i < 2 ? 700 : 300,
              fontSize: i < 2 ? "13px" : "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: i < 2 ? "#3D3530" : "#2A2118",
            }}
          >
            {line}
          </span>
        ))}
      </div>

      {/* Bottom: tick marks — purely decorative */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          alignItems: "flex-end",
        }}
      >
        {[60, 40, 80, 30, 55, 45, 70].map((w, i) => (
          <div
            key={i}
            style={{
              height: "1px",
              width: `${w}%`,
              maxWidth: "48px",
              background: "#1E1A16",
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Input line — borderless single-line field styled as logbook entry
// ---------------------------------------------------------------------------

interface LineInputProps {
  id: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  autoComplete?: string
  disabled?: boolean
  hasError?: boolean
  max?: string
  min?: string
  step?: string
  inputMode?: "text" | "decimal" | "numeric" | "search" | "email" | "tel" | "url"
  label: string
  hint?: string
}

function LineInput({
  id,
  type,
  value,
  onChange,
  placeholder,
  maxLength,
  autoComplete,
  disabled,
  hasError,
  max,
  min,
  step,
  inputMode,
  label,
  hint,
}: LineInputProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0",
        borderBottom: `1px solid ${hasError ? "#c2410c" : "#2A2118"}`,
        paddingBottom: "10px",
        transition: "border-color 120ms linear",
      }}
    >
      <label
        htmlFor={id}
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 400,
          fontSize: "9px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#3D3530",
          marginBottom: "6px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <span>{label}</span>
        {hint && (
          <span style={{ color: "#2A2118", letterSpacing: "0.14em", fontSize: "9px" }}>
            {hint}
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        disabled={disabled}
        max={max}
        min={min}
        step={step}
        inputMode={inputMode}
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 400,
          fontSize: "22px",
          letterSpacing: "0.02em",
          color: "#E8DDD0",
          background: "transparent",
          border: "none",
          outline: "none",
          padding: "0",
          width: "100%",
          opacity: disabled ? 0.5 : 1,
          // Placeholder color via inline style not directly supported;
          // handled in the style block below
        }}
        className="exp-line-input"
      />
    </div>
  )
}

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

  // Focus ring tracking — which field is focused
  const [focusedField, _setFocusedField] = useState<string | null>(null)

  const submitButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (hasAttempted) setErrors(validate())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, date, inputValue, hasAttempted])

  useEffect(() => {
    if (submitButtonRef.current) {
      const width = submitButtonRef.current.offsetWidth
      submitButtonRef.current.style.minWidth = `${width}px`
    }
  }, [])

  function validate(): FormErrors {
    const errs: FormErrors = { name: null, date: null, value: null }
    if (!name.trim()) errs.name = "Name required."
    if (!date) errs.date = "Date required."
    else if (date > today) errs.date = "Can't be in the future."
    const parsed = parseFloat(inputValue)
    if (!inputValue || isNaN(parsed) || parsed <= 0) errs.value = "Enter a number > 0."
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
      const message = err instanceof Error ? err.message : "Something went wrong."
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

  const valueLabel = inputType === "miles" ? "Miles" : "Steps"
  const valuePlaceholder = inputType === "miles" ? "0.0" : "0"
  const submitLabel = loading ? "Logging..." : inputType === "miles" ? "Log Miles" : "Log Steps"

  // Suppress the unused-focusedField warning: we use it for future border highlights
  void focusedField

  return (
    <>
      <style>{`
        @keyframes expFormFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes expFormSlideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        /* Placeholder color for line inputs */
        .exp-line-input::placeholder {
          color: #2A2118;
          opacity: 1;
        }
        /* Remove date/number input chrome */
        .exp-line-input::-webkit-inner-spin-button,
        .exp-line-input::-webkit-outer-spin-button,
        .exp-line-input::-webkit-calendar-picker-indicator {
          opacity: 0;
          pointer-events: none;
        }
        .exp-line-input[type="date"]::-webkit-input-placeholder {
          color: #2A2118;
        }
        /* Type toggle button */
        .exp-type-btn {
          font-family: 'Oswald', sans-serif;
          font-weight: 400;
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 10px 0;
          transition: color 80ms linear;
          border-bottom: 2px solid transparent;
          transition: color 80ms linear, border-color 80ms linear;
          flex: 1;
          text-align: center;
        }
        .exp-type-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .exp-type-btn.active {
          color: #f97316;
          border-bottom-color: #f97316;
        }
        .exp-type-btn:not(.active) {
          color: #3D3530;
        }
        .exp-type-btn:not(.active):hover { color: #8C7B6B; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0ms !important; animation-delay: 0ms !important; }
        }
      `}</style>

      <div
        data-testid="exp-log-page"
        style={{
          flex: 1,
          background: "#0D0B09",
          display: "flex",
          alignItems: "stretch",
          minHeight: "calc(100svh - 56px)",
        }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Main form column                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            flex: 1,
            maxWidth: "560px",
            padding: "clamp(32px, 5vw, 64px) clamp(24px, 5vw, 56px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Page heading — massive, structural */}
          <div
            style={{
              marginBottom: "48px",
              animation: "expFormSlideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
            }}
          >
            <p
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 400,
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#3D3530",
                marginBottom: "10px",
              }}
            >
              Field Journal · Activity Log
            </p>
            <h1
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(44px, 7vw, 72px)",
                lineHeight: 0.92,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: "#E8DDD0",
                margin: 0,
              }}
            >
              Log<br />
              <span style={{ color: "#f97316" }}>Your</span><br />
              Miles.
            </h1>
          </div>

          {/* ----- Success state or Form ----- */}
          {successData !== null ? (
            <div key="success">
              <SuccessState submission={successData} onLogMore={handleLogMore} />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "32px",
                animation: "expFormFadeIn 250ms ease-in forwards",
              }}
            >
              {/* Name field */}
              <div>
                <LineInput
                  id="name"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Ms. Rivera's class"
                  maxLength={100}
                  autoComplete="name"
                  disabled={loading}
                  hasError={!!errors.name}
                  label="Name or Class"
                />
                <FieldError message={errors.name} />
              </div>

              {/* Date field */}
              <div>
                <LineInput
                  id="date"
                  type="date"
                  value={date}
                  onChange={setDate}
                  max={today}
                  disabled={loading}
                  hasError={!!errors.date}
                  label="Date"
                  hint="YYYY-MM-DD"
                />
                <FieldError message={errors.date} />
              </div>

              {/* Activity type toggle */}
              <div>
                <div
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontWeight: 400,
                    fontSize: "9px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "#3D3530",
                    marginBottom: "8px",
                  }}
                >
                  Activity Type
                </div>
                <div
                  role="group"
                  aria-label="Activity type"
                  style={{
                    display: "flex",
                    borderBottom: "1px solid #1E1A16",
                    gap: "0",
                  }}
                >
                  {(["miles", "steps"] as InputType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={inputType === type}
                      onClick={() => setInputType(type)}
                      disabled={loading}
                      className={`exp-type-btn${inputType === type ? " active" : ""}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value field */}
              <div>
                <LineInput
                  id="inputValue"
                  type="number"
                  value={inputValue}
                  onChange={setInputValue}
                  placeholder={valuePlaceholder}
                  min="0.01"
                  step="any"
                  inputMode="decimal"
                  disabled={loading}
                  hasError={!!errors.value}
                  label={valueLabel}
                  hint={
                    inputType === "steps" && stepsConvertedMiles
                      ? `≈ ${stepsConvertedMiles} mi`
                      : inputType === "steps"
                      ? "2,500 steps = 1 mile"
                      : undefined
                  }
                />
                <FieldError message={errors.value} />
              </div>

              {/* API error banner */}
              {apiError !== null && (
                <div
                  role="alert"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                    borderLeft: "2px solid #c2410c",
                    paddingLeft: "14px",
                    paddingTop: "4px",
                    paddingBottom: "4px",
                    animation: "expFormSlideUp 200ms ease-out forwards",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "13px",
                      color: "#c2410c",
                      flex: 1,
                    }}
                  >
                    {apiError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setApiError(null)}
                    aria-label="Dismiss error"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#c2410c",
                      padding: "2px",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="1" y1="1" x2="11" y2="11" />
                      <line x1="11" y1="1" x2="1" y2="11" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Submit — full-width bar */}
              <button
                ref={submitButtonRef}
                type="submit"
                disabled={loading}
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: loading ? "#6B5E52" : "#0D0B09",
                  background: loading ? "#2A2118" : "#f97316",
                  border: "none",
                  borderRadius: "2px",
                  padding: "18px 24px",
                  cursor: loading ? "not-allowed" : "pointer",
                  width: "100%",
                  minHeight: "56px",
                  transition: "background 150ms linear, color 150ms linear, opacity 80ms linear",
                  marginTop: "8px",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1"
                }}
              >
                {submitLabel}
              </button>
            </form>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right decorative strip — hidden on mobile                         */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            width: "80px",
            display: "flex",
            alignItems: "stretch",
            padding: "clamp(32px, 5vw, 64px) 0 clamp(32px, 5vw, 64px) 0",
          }}
          className="exp-coord-strip"
        >
          <CoordinateStrip />
        </div>
      </div>

      {/* Hide coord strip on small screens */}
      <style>{`
        @media (max-width: 640px) {
          .exp-coord-strip { display: none !important; }
        }
      `}</style>
    </>
  )
}
