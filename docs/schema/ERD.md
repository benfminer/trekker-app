# Data Model — TRACE Trekkers
> Last updated: 2026-03-18
> Stack: Rails 7.2 API mode + PostgreSQL

---

## Overview

Four tables. The core flow: participants submit activity via an open form → stored in `submissions` → cumulative miles computed → checked against `milestones` → milestone triggered if threshold crossed. Admins authenticate via `admin_users` + `admin_sessions`.

```
submissions         milestones
-----------         ----------
(no FK)             (standalone lookup table)

admin_users ──────< admin_sessions
```

---

## Tables

---

### submissions

Purpose: Every mile and step logged by the TRACE community. The source of truth for the cumulative total used to drive the map.

No foreign keys — submissions are open-access. A submitter can be an individual ("Wayne Amo") or a class/group ("TRACE Linda Vista").

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | no | auto | Primary key |
| name | varchar | no | — | Individual or class name. Not linked to any account. |
| activity_date | date | no | — | The date the activity happened (user-entered). Distinct from created_at. |
| input_type | varchar | no | — | `"miles"` or `"steps"`. Validated at model level. |
| input_value | decimal(10,4) | no | — | The raw number the user entered, preserved exactly as submitted. |
| converted_miles | decimal(10,4) | no | — | Computed miles. If input_type = miles: equals input_value. If input_type = steps: input_value / 2500. Stored to keep SUM queries simple. |
| imported | boolean | no | false | True for records loaded from CSV rather than submitted via the live form. |
| created_at | datetime | no | auto | When the database record was created. For imported records, backfilled to the original Google Form submission timestamp. |
| updated_at | datetime | no | auto | Standard Rails timestamp. |

**Indexes:**
- `idx_submissions_converted_miles` — supports fast SUM for total miles calculation (hits every row on every map load)
- `idx_submissions_activity_date` — admin date-range filtering
- `idx_submissions_created_at` — admin dashboard default sort
- `idx_submissions_imported` — admin filter: show only historical vs. live submissions

**Relationships:** None (standalone table).

**Notes:**
- `activity_date` and `created_at` are intentionally separate. Historical imports arrive with a `created_at` matching the original form submission time, not the import time.
- `input_value` is preserved unmodified. If a user entered `100000` steps, that is stored as `100000.0` regardless of the converted value.
- The step conversion rate is **2,500 steps per mile** per PROJECT_VISION.md.
- No soft-delete column. Admins delete bad submissions outright. This keeps the total miles calculation clean.

---

### milestones

Purpose: Pre-seeded checkpoints along the circumnavigation route. Each milestone represents a notable crossing — country border, continent, ocean, or major city. When the group's cumulative miles crosses a `mile_marker`, the milestone is marked triggered.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | no | auto | Primary key |
| name | varchar | no | — | Display name: "Morocco", "Atlantic Ocean", "Africa", "Dakar, Senegal" |
| milestone_type | varchar | no | — | `"country"`, `"continent"`, `"ocean"`, `"city"`. Drives celebration UI intensity. |
| mile_marker | decimal(10,4) | no | — | Cumulative miles from San Diego at which this milestone triggers. |
| description | text | yes | null | Short celebration text: "You've crossed into Africa!" |
| fun_fact | text | yes | null | Optional flavor text for the celebration card. |
| triggered | boolean | no | false | True once the group has crossed this mile_marker. Never reset to false. |
| triggered_at | datetime | yes | null | When the milestone was first triggered. Null until triggered = true. |
| display_order | integer | yes | null | Sort order for displaying milestones in a list UI, within type group. |
| created_at | datetime | no | auto | Standard Rails timestamp. |
| updated_at | datetime | no | auto | Standard Rails timestamp. |

**Indexes:**
- `idx_milestones_mile_marker` — primary sort for the milestone list
- `idx_milestones_triggered` — filter untriggered milestones
- `idx_milestones_type` — filter by milestone_type for the celebration UI
- `idx_milestones_triggered_mile_marker` — composite index for the trigger check query: `WHERE triggered = false AND mile_marker <= :total`

**Relationships:** None (standalone lookup table — no FK to submissions).

**Notes:**
- Milestones are never un-triggered. Once the group crosses a threshold, that event has happened in the real world — even if an admin later deletes a submission that would drop the total below the marker. The celebration already occurred.
- The milestone seeding task (PROJECT_PLAN.md task 2.4) populates this table with the full route dataset. The table is empty after the initial migration.
- `celebration_type` driving the frontend animation is derived from `milestone_type`:
  - `"continent"` → full-screen celebration
  - `"ocean"` → large celebration
  - `"country"` → medium celebration
  - `"city"` → small celebration

---

### admin_users

Purpose: Credentials for admin dashboard access. Minimal table — not a full user management system. Expected to hold 1–3 records permanently.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | no | auto | Primary key |
| username | varchar | no | — | Login identifier. Unique. Downcased before save. |
| password_digest | varchar | no | — | BCrypt digest via Rails `has_secure_password`. Never store plaintext. |
| display_name | varchar | yes | null | Human-readable name for the admin UI ("Benjamin", "TRACE Admin"). |
| active | boolean | no | true | Soft-disable an account without deleting it. |
| created_at | datetime | no | auto | Standard Rails timestamp. |
| updated_at | datetime | no | auto | Standard Rails timestamp. |

**Indexes:**
- `uq_admin_users_username` — unique constraint; username is the login lookup key

**Relationships:**
- Has many `admin_sessions`

**Notes:**
- Uses Rails `has_secure_password` which provides `.authenticate(password)` and automatically manages `password_digest`.
- Add accounts via `rails console` or a one-time seed script. No admin registration UI.
- `active: false` prevents login without deleting the record or its session history.

---

### admin_sessions

Purpose: Bearer-token sessions for admin API authentication. Created on login, expires after 24 hours.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | no | auto | Primary key |
| admin_user_id | bigint | no | — | FK → admin_users.id |
| token_digest | varchar | no | — | SHA-256 digest of the raw token. The raw token is returned to the client once and never stored server-side. |
| expires_at | datetime | no | — | Session expiry. Default: 24 hours from created_at. |
| created_from_ip | varchar | yes | null | IP address that created the session. Optional audit trail. |
| created_at | datetime | no | auto | Standard Rails timestamp. |
| updated_at | datetime | no | auto | Standard Rails timestamp. |

**Indexes:**
- `uq_admin_sessions_token_digest` — unique; this is the lookup key on every authenticated request (hot path)
- `idx_admin_sessions_admin_user_id` — FK index (auto-added by `t.references`)
- `idx_admin_sessions_expires_at` — supports efficient cleanup of expired sessions

**Relationships:**
- Belongs to `admin_users`

**Notes:**
- Authentication flow: client sends `Authorization: Bearer <raw_token>` → server SHA-256 hashes it → looks up `token_digest` → checks `expires_at > NOW()` → checks `admin_user.active = true`.
- Expired sessions can be cleaned up with: `AdminSession.where("expires_at < ?", Time.current).delete_all`
- We store the digest, not the raw token, so a database dump doesn't expose active sessions.

---

## Entity Relationship Summary

```
admin_users (1) ──────────────< (many) admin_sessions
  id                                     admin_user_id (FK)

submissions                   milestones
  (no FK relationships)         (no FK relationships)
  open-access                   seeded lookup table
```

---

## Key Queries

**Get current total miles (used on every map load):**
```sql
SELECT SUM(converted_miles) FROM submissions;
```

**Check for newly triggered milestones:**
```sql
SELECT * FROM milestones
WHERE triggered = false
  AND mile_marker <= :current_total
ORDER BY mile_marker ASC;
```

**Admin submissions list (paginated, newest first):**
```sql
SELECT * FROM submissions
ORDER BY created_at DESC
LIMIT 50 OFFSET :offset;
```

**Authenticate an admin session:**
```sql
SELECT admin_sessions.*, admin_users.*
FROM admin_sessions
JOIN admin_users ON admin_users.id = admin_sessions.admin_user_id
WHERE admin_sessions.token_digest = :digest
  AND admin_sessions.expires_at > NOW()
  AND admin_users.active = true
LIMIT 1;
```

---

## Migration Files

All migrations live in `src/db/migrate/`. Run in order:

| File | Description |
|------|-------------|
| `20260318000001_create_submissions.rb` | Core submissions table |
| `20260318000002_create_milestones.rb` | Milestones lookup table |
| `20260318000003_create_admin_users.rb` | Admin credentials |
| `20260318000004_create_admin_sessions.rb` | Admin bearer-token sessions |

Run with: `rails db:migrate`

---

## Historical Data Import

See `src/db/seeds/import_historical_csv.rb`.

- Source: `previous_data/responses.csv` (279 rows, 9/15/2025 – 3/18/2026)
- Run with: `rails runner db/seeds/import_historical_csv.rb`
- Dry run: `rails runner db/seeds/import_historical_csv.rb -- --dry-run`
- Idempotent: safe to re-run; deduplicates on (name, activity_date, input_type, input_value)

**Known data quality issues in the CSV (flagged, not filtered):**

| Row | Submitter | Issue |
|-----|-----------|-------|
| 185 | Ecc | input_value = 2025 miles. Almost certainly a typo (year). Admin should review. |
| 179 | Ecc | steps = 5.062. Likely meant 5,062. Converts to ~0.002 miles. |
| 279 | Marco Velazquez | input_value = "1.36 miles" — units string embedded in the number field. Script strips and parses correctly. |
| 86 | Donte Locke | 200 miles on 10/29/2025. Large but not impossible. |
