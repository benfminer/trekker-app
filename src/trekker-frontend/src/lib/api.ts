import type {
  AdminLoginPayload,
  AdminLoginResponse,
  AdminSubmissionsParams,
  AdminSubmissionsResponse,
  CreateSubmissionPayload,
  CreateSubmissionResponse,
  Stats,
  SubmissionResponse,
  UpdateSubmissionPayload,
} from "./types"

// ---------------------------------------------------------------------------
// Base configuration
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  adminToken?: string
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, adminToken, ...rest } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  if (adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return undefined as unknown as T
  }

  const data = await response.json()

  if (!response.ok) {
    const message =
      (data as { error?: string }).error ??
      "An unexpected error occurred. Please try again."
    const err = new Error(message) as Error & { status: number }
    err.status = response.status
    throw err
  }

  return data as T
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

/**
 * POST /submissions
 * Log a new activity (open access — no auth required).
 */
export function createSubmission(
  payload: CreateSubmissionPayload
): Promise<CreateSubmissionResponse> {
  return request<CreateSubmissionResponse>("/submissions", {
    method: "POST",
    body: payload,
  })
}

/**
 * GET /stats
 * Cumulative total miles, current route position, and next untriggered milestone.
 */
export function getStats(): Promise<Stats> {
  return request<Stats>("/stats")
}

// ---------------------------------------------------------------------------
// Admin auth endpoints
// ---------------------------------------------------------------------------

/**
 * POST /admin/sessions
 * Authenticate with username + password. Returns a raw Bearer token.
 * The token is returned once and never stored server-side in plaintext.
 */
export function adminLogin(payload: AdminLoginPayload): Promise<AdminLoginResponse> {
  return request<AdminLoginResponse>("/admin/sessions", {
    method: "POST",
    body: payload,
  })
}

/**
 * DELETE /admin/sessions
 * Invalidate the current session. Requires the Bearer token.
 * Returns undefined (200 with { message } body, but we discard it).
 */
export function adminLogout(adminToken: string): Promise<void> {
  return request<void>("/admin/sessions", {
    method: "DELETE",
    adminToken,
  })
}

// ---------------------------------------------------------------------------
// Admin endpoints (Bearer token required)
// ---------------------------------------------------------------------------

/**
 * GET /admin/submissions
 * Paginated list of all submissions. Optionally filter by imported status.
 */
export function getAdminSubmissions(
  params: AdminSubmissionsParams = {},
  adminToken: string
): Promise<AdminSubmissionsResponse> {
  const search = new URLSearchParams()
  if (params.page !== undefined) search.set("page", String(params.page))
  if (params.per_page !== undefined) search.set("per_page", String(params.per_page))
  if (params.imported !== undefined) search.set("imported", String(params.imported))

  const query = search.toString()
  const path = query ? `/admin/submissions?${query}` : "/admin/submissions"

  return request<AdminSubmissionsResponse>(path, { adminToken })
}

/**
 * PATCH /admin/submissions/:id
 * Edit a submission. converted_miles is recalculated server-side.
 */
export function updateAdminSubmission(
  id: number,
  payload: UpdateSubmissionPayload,
  adminToken: string
): Promise<SubmissionResponse> {
  return request<SubmissionResponse>(`/admin/submissions/${id}`, {
    method: "PATCH",
    body: payload,
    adminToken,
  })
}

/**
 * DELETE /admin/submissions/:id
 * Hard delete — no recovery. Returns undefined (204 No Content).
 */
export function deleteAdminSubmission(id: number, adminToken: string): Promise<void> {
  return request<void>(`/admin/submissions/${id}`, {
    method: "DELETE",
    adminToken,
  })
}

/**
 * POST /admin/submissions/:id/flag
 * Toggle the flagged status of a submission.
 */
export function flagAdminSubmission(
  id: number,
  adminToken: string
): Promise<SubmissionResponse> {
  return request<SubmissionResponse>(`/admin/submissions/${id}/flag`, {
    method: "POST",
    adminToken,
  })
}

// ---------------------------------------------------------------------------
// Health check — call once on app load to confirm API is reachable.
// Logs result to console. Does not throw.
// ---------------------------------------------------------------------------

export async function checkApiHealth(): Promise<void> {
  try {
    await fetch(`${BASE_URL}/up`)
    console.info(`[API] Connected — ${BASE_URL}`)
  } catch {
    console.warn(`[API] Unreachable — ${BASE_URL}. Check VITE_API_BASE_URL and that the Rails server is running.`)
  }
}
