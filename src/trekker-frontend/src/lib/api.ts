import type {
  AdminLoginPayload,
  AdminLoginResponse,
  AdminSubmissionsParams,
  AdminSubmissionsResponse,
  CampusTrailResponse,
  ChangePasswordPayload,
  CreateAdminUserPayload,
  CreateSubmissionPayload,
  CreateSubmissionResponse,
  CreateMilestonePayload,
  CreateMilestoneResponse,
  ResetAdminUserPasswordPayload,
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

/**
 * GET /campus_trail
 * Per-campus mileage totals with narrative geographic milestone for each site.
 */
export function getCampusTrail(): Promise<CampusTrailResponse> {
  return request<CampusTrailResponse>("/campus_trail")
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
  if (params.sort_by !== undefined) search.set("sort_by", params.sort_by)
  if (params.sort_dir !== undefined) search.set("sort_dir", params.sort_dir)
  if (params.date_from !== undefined) search.set("date_from", params.date_from)
  if (params.date_to !== undefined) search.set("date_to", params.date_to)
  if (params.miles_min !== undefined) search.set("miles_min", String(params.miles_min))
  if (params.miles_max !== undefined) search.set("miles_max", String(params.miles_max))

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

/**
 * PATCH /admin/password
 * Change the authenticated admin's password.
 */
export function changeAdminPassword(
  payload: ChangePasswordPayload,
  adminToken: string
): Promise<void> {
  return request<void>("/admin/password", {
    method: "PATCH",
    body: payload,
    adminToken,
  })
}

/**
 * POST /admin/users
 * Create a new admin account. Requires Bearer token.
 */
export function createAdminUser(
  payload: CreateAdminUserPayload,
  adminToken: string
): Promise<void> {
  return request<void>("/admin/users", {
    method: "POST",
    body: payload,
    adminToken,
  })
}

/**
 * POST /admin/milestones
 * Add a new milestone (city, country, etc.) to the route.
 */
export function createAdminMilestone(
  payload: CreateMilestonePayload,
  adminToken: string
): Promise<CreateMilestoneResponse> {
  return request<CreateMilestoneResponse>("/admin/milestones", {
    method: "POST",
    body: payload,
    adminToken,
  })
}

/**
 * PATCH /admin/users/reset_password
 * Authenticated admin sets a new password for any admin account by username.
 */
export function resetAdminUserPassword(
  payload: ResetAdminUserPasswordPayload,
  adminToken: string
): Promise<void> {
  return request<void>("/admin/users/reset_password", {
    method: "PATCH",
    body: payload,
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
