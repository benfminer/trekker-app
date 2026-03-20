// ---------------------------------------------------------------------------
// Shared types mirroring Rails API response shapes.
// ---------------------------------------------------------------------------

export type InputType = "miles" | "steps"

export type MilestoneType = "country" | "continent" | "ocean" | "city" | "capital"

export type SiteSlug = "trace_north" | "trace_south" | "trace_east" | "trace_west"

export interface Submission {
  id: number
  name: string
  activity_date: string
  input_type: InputType
  input_value: number
  converted_miles: number
  site: SiteSlug | null
  imported: boolean
  flagged: boolean
  created_at: string
  updated_at?: string
}

export interface Milestone {
  id: number
  name: string
  milestone_type: MilestoneType
  mile_marker: number
  description: string | null
  triggered_at: string | null
}

export interface NextMilestone {
  id: number
  name: string
  milestone_type: MilestoneType
  mile_marker: number
  miles_remaining: number
}

export interface Stats {
  total_miles: number
  current_position: number
  next_milestone: NextMilestone | null
}

export interface SubmissionsMeta {
  page: number
  per_page: number
  total_count: number
  total_pages: number
}

// ---------------------------------------------------------------------------
// Request payloads
// ---------------------------------------------------------------------------

export interface CreateSubmissionPayload {
  submission: {
    name: string
    activity_date: string
    input_type: InputType
    input_value: number
    site?: SiteSlug | null
  }
}

export interface UpdateSubmissionPayload {
  submission: Partial<{
    name: string
    activity_date: string
    input_type: InputType
    input_value: number
  }>
}

export interface AdminSubmissionsParams {
  page?: number
  per_page?: number
  imported?: boolean
}

// ---------------------------------------------------------------------------
// Response wrappers
// ---------------------------------------------------------------------------

export interface CreateSubmissionResponse {
  submission: Submission
  triggered_milestones: Milestone[]
}

export interface AdminSubmissionsResponse {
  submissions: Submission[]
  meta: SubmissionsMeta
}

export interface SubmissionResponse {
  submission: Submission
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  rank: number
  site: SiteSlug
  display_name: string
  total_miles: number
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  total_site_miles: number
  updated_at: string | null
}

// ---------------------------------------------------------------------------
// Admin auth
// ---------------------------------------------------------------------------

export interface AdminLoginPayload {
  username: string
  password: string
}

export interface AdminLoginResponse {
  token: string
}

// ---------------------------------------------------------------------------
// Admin password & user management
// ---------------------------------------------------------------------------

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

export interface CreateAdminUserPayload {
  username: string
  password: string
  email?: string
}

export interface RequestPasswordResetPayload {
  username: string
}

export interface ResetPasswordPayload {
  token: string
  new_password: string
}

// ---------------------------------------------------------------------------
// Error shapes
// ---------------------------------------------------------------------------

export interface ApiError {
  message: string
  status: number
}
