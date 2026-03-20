import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  adminLogout,
  deleteAdminSubmission,
  flagAdminSubmission,
  getAdminSubmissions,
  updateAdminSubmission,
} from "../../lib/api"
import { clearAdminToken, getAdminToken } from "../../lib/auth"
import type { InputType, Submission, SubmissionsMeta } from "../../lib/types"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PER_PAGE = 50

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US")
}

function formatMiles(n: number): string {
  return n.toFixed(1)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterMode = "all" | "live" | "imported"

interface EditDraft {
  name: string
  activity_date: string
  input_type: InputType
  input_value: string
}

interface RowState {
  mode: "view" | "editing" | "deleting"
  saving: boolean
  editError: string | null
  deleting: boolean
  flagging: boolean
  flash: boolean
  draft: EditDraft | null
}

function defaultRowState(): RowState {
  return {
    mode: "view",
    saving: false,
    editError: null,
    deleting: false,
    flagging: false,
    flash: false,
    draft: null,
  }
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function FlagIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M4 4h16v10H4z" />
        <line
          x1="4"
          y1="4"
          x2="4"
          y2="21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h16v10H4z" />
      <line x1="4" y1="4" x2="4" y2="21" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// SkeletonRows — 10 placeholder rows shown during initial load
// ---------------------------------------------------------------------------

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => (
        <tr key={i} className="border-b border-[#1f1f1f]">
          {[22, 10, 8, 10, 10, 8, 8, 14].map((w, j) => (
            <td key={j} className="px-4 py-3" style={{ width: `${w}%` }}>
              <div
                className="h-3 rounded"
                style={{
                  width: "70%",
                  background: "#1a1a1a",
                  animation: "skeleton-shimmer 1.5s linear infinite",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// SourceBadge
// ---------------------------------------------------------------------------

function SourceBadge({ imported }: { imported: boolean }) {
  if (imported) {
    return (
      <span
        className="inline-block rounded-full px-2 py-0.5 text-[11px]"
        style={{ background: "#1a2e1a", color: "#4ade80" }}
      >
        Import
      </span>
    )
  }
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[11px]"
      style={{ background: "#1f2937", color: "#9ca3af" }}
    >
      Web
    </span>
  )
}

// ---------------------------------------------------------------------------
// ViewCells — shared read-only cells used in both view and edit modes
// ---------------------------------------------------------------------------

function ViewCells({ submission }: { submission: Submission }) {
  return (
    <>
      {/* Name */}
      <td className="px-4 py-3" style={{ width: "22%" }} title={submission.name}>
        <span
          className="block max-w-[200px] truncate text-[14px]"
          style={{ color: "#e5e7eb" }}
        >
          {submission.name}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-3" style={{ width: "10%" }} title={submission.activity_date}>
        <span className="text-[14px]" style={{ color: "#9ca3af" }}>
          {formatDate(submission.activity_date)}
        </span>
      </td>

      {/* Type */}
      <td className="hidden px-4 py-3 sm:table-cell" style={{ width: "8%" }}>
        <span className="text-[14px]" style={{ color: "#9ca3af" }}>
          {submission.input_type === "miles" ? "Mi" : "Stps"}
        </span>
      </td>

      {/* Input value */}
      <td className="hidden px-4 py-3 lg:table-cell" style={{ width: "10%" }}>
        <span className="text-[14px]" style={{ color: "#9ca3af" }}>
          {submission.input_type === "steps"
            ? formatNumber(submission.input_value)
            : submission.input_value.toFixed(1)}
        </span>
      </td>

      {/* Converted miles */}
      <td className="px-4 py-3" style={{ width: "10%" }}>
        <span className="text-[14px] font-medium" style={{ color: "#ffffff" }}>
          {formatMiles(submission.converted_miles)}
        </span>
      </td>
    </>
  )
}

// ---------------------------------------------------------------------------
// SubmissionRow
// ---------------------------------------------------------------------------

interface SubmissionRowProps {
  submission: Submission
  rowState: RowState
  onEdit: () => void
  onCancelEdit: () => void
  onDraftChange: (draft: EditDraft) => void
  onSave: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
  onFlagToggle: () => void
}

function SubmissionRow({
  submission,
  rowState,
  onEdit,
  onCancelEdit,
  onDraftChange,
  onSave,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onFlagToggle,
}: SubmissionRowProps) {
  const { mode, saving, editError, deleting, flagging, flash, draft } = rowState

  const rowBg = submission.flagged
    ? "rgba(251,191,36,0.04)"
    : flash
      ? "rgba(249,115,22,0.10)"
      : undefined

  const rowStyle = rowBg ? { background: rowBg } : undefined

  if (mode === "editing" && draft !== null) {
    return (
      <>
        {/* Original row — dimmed for context */}
        <tr
          className="border-b border-[#1f1f1f] opacity-40"
          style={rowStyle}
          aria-hidden="true"
        >
          <ViewCells submission={submission} />
          <td />
          <td />
          <td />
        </tr>

        {/* Edit row */}
        <tr>
          <td colSpan={8} className="p-0">
            <div
              className="px-4 py-3"
              style={{
                background: "#1a1a1a",
                borderTop: "2px solid #f97316",
                borderBottom: "1px solid #1f1f1f",
              }}
            >
              <p
                className="mb-3 text-[13px] font-medium uppercase tracking-wide"
                style={{ fontFamily: "'Oswald', sans-serif", color: "#f97316" }}
              >
                Editing: {submission.name} — {formatDate(submission.activity_date)}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {/* Name */}
                <input
                  type="text"
                  aria-label="Name"
                  value={draft.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onDraftChange({ ...draft, name: e.target.value })
                  }
                  disabled={saving}
                  className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
                  style={{
                    width: "35%",
                    minWidth: "140px",
                    background: "#111111",
                    border: "1px solid #2a2a2a",
                    color: "#e5e7eb",
                  }}
                />

                {/* Date */}
                <input
                  type="date"
                  aria-label="Activity date"
                  value={draft.activity_date}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onDraftChange({ ...draft, activity_date: e.target.value })
                  }
                  disabled={saving}
                  className="rounded px-3 py-1.5 text-sm disabled:opacity-50"
                  style={{
                    width: "15%",
                    minWidth: "130px",
                    background: "#111111",
                    border: "1px solid #2a2a2a",
                    color: "#e5e7eb",
                  }}
                />

                {/* Input type */}
                <select
                  aria-label="Input type"
                  value={draft.input_type}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    onDraftChange({
                      ...draft,
                      input_type: e.target.value as InputType,
                    })
                  }
                  disabled={saving}
                  className="rounded px-3 py-1.5 text-sm disabled:opacity-50"
                  style={{
                    width: "15%",
                    minWidth: "100px",
                    background: "#111111",
                    border: "1px solid #2a2a2a",
                    color: "#e5e7eb",
                  }}
                >
                  <option value="miles">Miles</option>
                  <option value="steps">Steps</option>
                </select>

                {/* Input value */}
                <input
                  type="number"
                  aria-label="Input value"
                  value={draft.input_value}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onDraftChange({ ...draft, input_value: e.target.value })
                  }
                  min={0}
                  step="any"
                  disabled={saving}
                  className="rounded px-3 py-1.5 text-sm disabled:opacity-50"
                  style={{
                    width: "15%",
                    minWidth: "100px",
                    background: "#111111",
                    border: "1px solid #2a2a2a",
                    color: "#e5e7eb",
                  }}
                />

                {/* Save */}
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="rounded px-4 py-1.5 text-[13px] font-bold uppercase tracking-wide disabled:opacity-70"
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    background: "#f97316",
                    color: "#ffffff",
                    height: "34px",
                  }}
                >
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="animate-spin"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Saving
                    </span>
                  ) : (
                    "Save"
                  )}
                </button>

                {/* Cancel */}
                <button
                  onClick={onCancelEdit}
                  disabled={saving}
                  className="text-[13px] disabled:opacity-50"
                  style={{ color: "#6b7280" }}
                >
                  Cancel
                </button>
              </div>

              {/* Inline edit error */}
              {editError !== null && (
                <p
                  className="mt-2 text-[13px]"
                  style={{ color: "#ef4444" }}
                  role="alert"
                >
                  {editError}
                </p>
              )}
            </div>
          </td>
        </tr>
      </>
    )
  }

  return (
    <tr
      className="border-b border-[#1f1f1f] transition-colors duration-150"
      style={{
        background: rowBg,
        ...(flash ? { transition: "background 600ms ease-out" } : undefined),
      }}
      onMouseEnter={(e) => {
        if (!rowBg) {
          ;(e.currentTarget as HTMLTableRowElement).style.background = "#171717"
        }
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLTableRowElement).style.background = rowBg ?? ""
      }}
    >
      <ViewCells submission={submission} />

      {/* Source */}
      <td className="hidden px-4 py-3 sm:table-cell" style={{ width: "8%" }}>
        <SourceBadge imported={submission.imported} />
      </td>

      {/* Flag */}
      <td className="px-4 py-3" style={{ width: "8%" }}>
        <button
          onClick={onFlagToggle}
          disabled={flagging}
          aria-label={submission.flagged ? "Unflag submission" : "Flag submission"}
          className="flex h-9 w-9 items-center justify-center rounded transition-colors duration-100 disabled:opacity-50"
          style={{ color: submission.flagged ? "#f97316" : "#4b5563" }}
          onMouseEnter={(e) => {
            if (!flagging) {
              ;(e.currentTarget as HTMLButtonElement).style.color = submission.flagged
                ? "#ea6c0a"
                : "#9ca3af"
            }
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color =
              submission.flagged ? "#f97316" : "#4b5563"
          }}
        >
          <FlagIcon filled={submission.flagged} />
        </button>
      </td>

      {/* Actions */}
      <td className="px-4 py-3" style={{ width: "14%" }}>
        {mode === "deleting" ? (
          <div className="flex items-center gap-2 text-[13px] text-[#e5e7eb]">
            <span>Remove {formatMiles(submission.converted_miles)} mi?</span>
            <button
              onClick={onDeleteConfirm}
              disabled={deleting}
              className="font-medium disabled:opacity-50"
              style={{ color: "#ef4444" }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              onClick={onDeleteCancel}
              disabled={deleting}
              className="disabled:opacity-50"
              style={{ color: "#6b7280" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Edit */}
            <button
              onClick={onEdit}
              aria-label="Edit submission"
              className="flex h-9 w-9 items-center justify-center rounded transition-colors duration-100"
              style={{ color: "#4b5563" }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = "#4b5563"
              }}
            >
              <PencilIcon />
            </button>

            {/* Delete */}
            <button
              onClick={onDeleteRequest}
              aria-label="Delete submission"
              className="flex h-9 w-9 items-center justify-center rounded transition-colors duration-100"
              style={{ color: "#4b5563" }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = "#ef4444"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = "#4b5563"
              }}
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// AdminPage
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const navigate = useNavigate()

  // ---- Data state ----------------------------------------------------------
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [meta, setMeta] = useState<SubmissionsMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // ---- Filter state --------------------------------------------------------
  // search and flaggedOnly are applied client-side against the current page
  const [search, setSearch] = useState("")
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [page, setPage] = useState(1)

  // ---- Row interaction state -----------------------------------------------
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({})

  // ---- Logout state --------------------------------------------------------
  const [loggingOut, setLoggingOut] = useState(false)

  // Flash timers — cleared on unmount via the ref
  const flashTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  // ---- Auth helpers --------------------------------------------------------
  function requireToken(): string {
    const token = getAdminToken()
    if (!token) {
      navigate("/admin/login", { replace: true })
      throw new Error("Not authenticated")
    }
    return token
  }

  function handleUnauthorized(err: unknown) {
    const status = (err as Error & { status?: number }).status
    if (status === 401) {
      clearAdminToken()
      navigate("/admin/login", { replace: true })
    }
  }

  // ---- Fetch ---------------------------------------------------------------
  // The API supports `imported` as a server-side filter.
  // `flaggedOnly` is applied client-side after fetch since it is not in the
  // AdminSubmissionsParams type — the server does not expose that filter param.
  const fetchSubmissions = useCallback(
    async (targetPage: number, mode: FilterMode) => {
      setLoading(true)
      setFetchError(null)

      try {
        const token = getAdminToken()
        if (!token) {
          navigate("/admin/login", { replace: true })
          return
        }

        const imported =
          mode === "live" ? false : mode === "imported" ? true : undefined

        const response = await getAdminSubmissions(
          { page: targetPage, per_page: PER_PAGE, imported },
          token
        )

        setSubmissions(response.submissions)
        setMeta(response.meta)
        setRowStates({})
      } catch (err) {
        handleUnauthorized(err)
        const message =
          err instanceof Error ? err.message : "Could not load submissions."
        setFetchError(message)
      } finally {
        setLoading(false)
      }
    },
    // navigate is stable — safe to include
    [navigate]
  )

  useEffect(() => {
    fetchSubmissions(page, filterMode)
  }, [fetchSubmissions, page, filterMode])

  // ---- Client-side filtering -----------------------------------------------
  const filteredSubmissions = submissions.filter((s) => {
    if (flaggedOnly && !s.flagged) return false
    if (search.trim() && !s.name.toLowerCase().includes(search.trim().toLowerCase()))
      return false
    return true
  })

  const hasActiveFilters =
    search.trim() !== "" || filterMode !== "all" || flaggedOnly

  // ---- Logout --------------------------------------------------------------
  async function handleLogout() {
    setLoggingOut(true)
    const token = getAdminToken()
    if (token) {
      try {
        await adminLogout(token)
      } catch {
        // Swallow — clear locally regardless
      }
    }
    clearAdminToken()
    navigate("/admin/login", { replace: true })
  }

  // ---- Row state helpers ---------------------------------------------------
  function getRowState(id: number): RowState {
    return rowStates[id] ?? defaultRowState()
  }

  function setRowState(id: number, patch: Partial<RowState>) {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? defaultRowState()), ...patch },
    }))
  }

  // ---- Edit handlers -------------------------------------------------------
  function handleEditStart(submission: Submission) {
    // Close any other open edit rows first (discard unsaved changes silently)
    setRowStates((prev) => {
      const next: Record<number, RowState> = {}
      for (const [k, v] of Object.entries(prev)) {
        next[Number(k)] =
          v.mode === "editing"
            ? { ...v, mode: "view", draft: null, editError: null }
            : v
      }
      return {
        ...next,
        [submission.id]: {
          ...(next[submission.id] ?? defaultRowState()),
          mode: "editing",
          draft: {
            name: submission.name,
            activity_date: submission.activity_date,
            input_type: submission.input_type,
            input_value: String(submission.input_value),
          },
          editError: null,
        },
      }
    })
  }

  function handleCancelEdit(id: number) {
    setRowState(id, { mode: "view", draft: null, editError: null })
  }

  function handleDraftChange(id: number, draft: EditDraft) {
    setRowState(id, { draft })
  }

  async function handleSave(submission: Submission) {
    const state = getRowState(submission.id)
    if (!state.draft) return

    setRowState(submission.id, { saving: true, editError: null })

    try {
      const token = requireToken()
      const { submission: updated } = await updateAdminSubmission(
        submission.id,
        {
          submission: {
            name: state.draft.name,
            activity_date: state.draft.activity_date,
            input_type: state.draft.input_type,
            input_value: parseFloat(state.draft.input_value),
          },
        },
        token
      )

      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      )
      setRowState(submission.id, {
        mode: "view",
        saving: false,
        draft: null,
        editError: null,
        flash: true,
      })

      // Clear flash after 700ms
      if (flashTimers.current[submission.id]) {
        clearTimeout(flashTimers.current[submission.id])
      }
      flashTimers.current[submission.id] = setTimeout(() => {
        setRowState(submission.id, { flash: false })
      }, 700)
    } catch (err) {
      handleUnauthorized(err)
      const message =
        err instanceof Error ? err.message : "Could not save. Check your values."
      setRowState(submission.id, { saving: false, editError: message })
    }
  }

  // ---- Delete handlers -----------------------------------------------------
  function handleDeleteRequest(id: number) {
    setRowState(id, { mode: "deleting" })
  }

  function handleDeleteCancel(id: number) {
    setRowState(id, { mode: "view" })
  }

  async function handleDeleteConfirm(id: number) {
    setRowState(id, { deleting: true })

    try {
      const token = requireToken()
      await deleteAdminSubmission(id, token)

      setSubmissions((prev) => prev.filter((s) => s.id !== id))
      setMeta((prev) =>
        prev ? { ...prev, total_count: prev.total_count - 1 } : prev
      )
      setRowStates((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (err) {
      handleUnauthorized(err)
      setRowState(id, { deleting: false, mode: "view" })
    }
  }

  // ---- Flag handler --------------------------------------------------------
  async function handleFlagToggle(submission: Submission) {
    // Optimistic update
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submission.id ? { ...s, flagged: !s.flagged } : s
      )
    )
    setRowState(submission.id, { flagging: true })

    try {
      const token = requireToken()
      const { submission: updated } = await flagAdminSubmission(submission.id, token)
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      )
    } catch (err) {
      handleUnauthorized(err)
      // Roll back optimistic update
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id ? { ...s, flagged: submission.flagged } : s
        )
      )
    } finally {
      setRowState(submission.id, { flagging: false })
    }
  }

  // ---- Filter change handlers ----------------------------------------------
  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
  }

  function handleFilterModeChange(mode: FilterMode) {
    setFilterMode(mode)
    setPage(1)
  }

  function handleFlaggedOnlyChange(e: ChangeEvent<HTMLInputElement>) {
    setFlaggedOnly(e.target.checked)
    setPage(1)
  }

  function handleClearFilters() {
    setSearch("")
    setFilterMode("all")
    setFlaggedOnly(false)
    setPage(1)
  }

  // ---- Pagination ----------------------------------------------------------
  const totalPages = meta?.total_pages ?? 1
  const totalCount = meta?.total_count ?? 0
  const pageStart = (page - 1) * PER_PAGE + 1
  const pageEnd = Math.min(page * PER_PAGE, totalCount)
  const showPagination = totalCount > PER_PAGE

  // ---- Render --------------------------------------------------------------
  return (
    <div
      className="flex flex-1 flex-col"
      style={{ background: "#0a0a0a", minHeight: "100%" }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Admin sub-header                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="sticky top-0 z-10 px-6"
        style={{
          background: "#0a0a0a",
          borderBottom: "1px solid #1f1f1f",
          height: "52px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-6">
            <span
              className="text-[18px] font-bold uppercase tracking-widest text-white"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              TRACE Trekkers — Admin
            </span>
            <a
              href="/"
              className="text-sm transition-colors duration-100"
              style={{ color: "#9ca3af" }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color = "#e5e7eb"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af"
              }}
            >
              ← Map
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/admin/new-user"
              className="text-sm transition-colors duration-100"
              style={{ color: "#9ca3af" }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color = "#e5e7eb"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af"
              }}
            >
              + New user
            </Link>
            <Link
              to="/admin/change-password"
              className="text-sm transition-colors duration-100"
              style={{ color: "#9ca3af" }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color = "#e5e7eb"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af"
              }}
            >
              Change password
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-sm transition-colors duration-100 disabled:opacity-40"
              style={{ color: "#9ca3af" }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = "#e5e7eb"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"
              }}
            >
              {loggingOut ? "Signing out…" : "Log out"}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile notice                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="mx-auto mt-4 w-full max-w-[1200px] px-6 sm:hidden">
        <div
          className="rounded-md px-4 py-3 text-[13px]"
          style={{
            background: "#111111",
            border: "1px solid #2a2a2a",
            color: "#9ca3af",
          }}
        >
          For the best experience, open this page on a tablet or larger screen.
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Page heading + summary stats                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mx-auto mt-6 w-full max-w-[1200px] px-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1
            className="text-[20px] font-bold uppercase tracking-wide text-white"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Submissions
          </h1>
          {meta !== null && (
            <span className="text-[14px]" style={{ color: "#9ca3af" }}>
              {search.trim() || flaggedOnly
                ? `Showing ${filteredSubmissions.length} of ${meta.total_count} submissions`
                : `${meta.total_count.toLocaleString()} submissions`}
            </span>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filter bar                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="mx-auto mt-4 w-full max-w-[1200px] px-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={handleSearchChange}
            className="rounded-md px-4 py-2 text-[14px] outline-none transition-colors duration-100"
            style={{
              flex: "1 1 200px",
              maxWidth: "400px",
              background: "#111111",
              border: "1px solid #2a2a2a",
              color: "#e5e7eb",
            }}
            onFocus={(e) => {
              ;(e.currentTarget as HTMLInputElement).style.borderColor = "#f97316"
            }}
            onBlur={(e) => {
              ;(e.currentTarget as HTMLInputElement).style.borderColor = "#2a2a2a"
            }}
          />

          {/* Source filter: All / Live / Imported */}
          <div
            className="flex items-center gap-1 rounded-md p-1"
            style={{ background: "#111111", border: "1px solid #2a2a2a" }}
          >
            {(["all", "live", "imported"] as FilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleFilterModeChange(mode)}
                className="rounded px-3 py-1 text-[13px] capitalize transition-colors duration-100"
                style={{
                  background: filterMode === mode ? "#1f1f1f" : "transparent",
                  color: filterMode === mode ? "#e5e7eb" : "#6b7280",
                }}
              >
                {mode === "all" ? "All" : mode === "live" ? "Live" : "Imported"}
              </button>
            ))}
          </div>

          {/* Flagged only */}
          <label
            className="flex cursor-pointer items-center gap-2 text-[14px]"
            style={{ color: "#d1d5db" }}
          >
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={handleFlaggedOnlyChange}
              className="accent-[#f97316]"
            />
            Flagged only
          </label>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleClearFilters}
              className="text-[13px] transition-colors duration-100"
              style={{ color: "#f97316" }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = "#ea6c0a"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = "#f97316"
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner                                                         */}
      {/* ------------------------------------------------------------------ */}
      {fetchError !== null && (
        <div className="mx-auto mt-4 w-full max-w-[1200px] px-6" role="alert">
          <div
            className="flex items-center gap-4 rounded-md px-4 py-3 text-[14px]"
            style={{
              background: "#1a0a0a",
              borderLeft: "3px solid #ef4444",
              color: "#e5e7eb",
            }}
          >
            <span>Could not load submissions.</span>
            <button
              onClick={() => fetchSubmissions(page, filterMode)}
              className="transition-colors duration-100"
              style={{ color: "#f97316" }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Table                                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="mx-auto mt-4 w-full max-w-[1200px] flex-1 overflow-x-auto px-6 pb-8">
        <table className="w-full min-w-[600px] border-collapse text-left">
          <thead>
            <tr
              className="sticky top-[52px] z-10"
              style={{
                background: "#0a0a0a",
                borderBottom: "1px solid #2a2a2a",
              }}
            >
              {[
                { label: "Name", w: "22%" },
                { label: "Date", w: "10%" },
                { label: "Type", w: "8%", hidden: true },
                { label: "Input", w: "10%", hiddenLg: true },
                { label: "Miles", w: "10%" },
                { label: "Source", w: "8%", hidden: true },
                { label: "Flag", w: "8%", srOnly: true },
                { label: "Actions", w: "14%", srOnly: true },
              ].map((col) => (
                <th
                  key={col.label}
                  className={[
                    "px-4 py-3 text-[12px] font-medium uppercase tracking-[0.05em]",
                    col.hidden ? "hidden sm:table-cell" : "",
                    col.hiddenLg ? "hidden lg:table-cell" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ width: col.w, color: "#6b7280" }}
                >
                  {col.srOnly ? (
                    <span className="sr-only">{col.label}</span>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : fetchError !== null ? null : filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  {submissions.length === 0 && !search.trim() && !flaggedOnly ? (
                    <div style={{ color: "#6b7280" }}>
                      <p className="text-[14px]">No submissions yet.</p>
                      <p className="mt-1 text-[13px]">
                        Once the community starts logging miles, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ color: "#6b7280" }}>
                      <p className="text-[14px]">
                        No submissions match your filters.
                      </p>
                      <button
                        onClick={handleClearFilters}
                        className="mt-2 text-[13px] transition-colors duration-100"
                        style={{ color: "#f97316" }}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((submission) => (
                <SubmissionRow
                  key={submission.id}
                  submission={submission}
                  rowState={getRowState(submission.id)}
                  onEdit={() => handleEditStart(submission)}
                  onCancelEdit={() => handleCancelEdit(submission.id)}
                  onDraftChange={(draft) => handleDraftChange(submission.id, draft)}
                  onSave={() => handleSave(submission)}
                  onDeleteRequest={() => handleDeleteRequest(submission.id)}
                  onDeleteConfirm={() => handleDeleteConfirm(submission.id)}
                  onDeleteCancel={() => handleDeleteCancel(submission.id)}
                  onFlagToggle={() => handleFlagToggle(submission)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Pagination                                                           */}
      {/* ------------------------------------------------------------------ */}
      {showPagination && !loading && fetchError === null && (
        <div
          className="mx-auto w-full max-w-[1200px] px-6 py-4"
          style={{ borderTop: "1px solid #1f1f1f" }}
        >
          <div className="flex items-center justify-between text-[13px]">
            <span style={{ color: "#9ca3af" }}>
              Showing {pageStart}–{pageEnd} of {totalCount.toLocaleString()}
            </span>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="transition-colors duration-100 disabled:cursor-not-allowed"
                style={{ color: page <= 1 ? "#2a2a2a" : "#e5e7eb" }}
                onMouseEnter={(e) => {
                  if (page > 1) {
                    ;(e.currentTarget as HTMLButtonElement).style.color = "#f97316"
                  }
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color =
                    page <= 1 ? "#2a2a2a" : "#e5e7eb"
                }}
              >
                ← Prev
              </button>

              <span style={{ color: "#6b7280" }}>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="transition-colors duration-100 disabled:cursor-not-allowed"
                style={{ color: page >= totalPages ? "#2a2a2a" : "#e5e7eb" }}
                onMouseEnter={(e) => {
                  if (page < totalPages) {
                    ;(e.currentTarget as HTMLButtonElement).style.color = "#f97316"
                  }
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color =
                    page >= totalPages ? "#2a2a2a" : "#e5e7eb"
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skeleton shimmer keyframes */}
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-color: #1a1a1a; }
          50%  { background-color: #262626; }
          100% { background-color: #1a1a1a; }
        }
      `}</style>
    </div>
  )
}
