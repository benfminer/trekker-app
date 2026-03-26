# TRACE Trekkers — iPhone App Exploration
> Status: Theory only — not committed to build
> Last updated: 2026-03-25
> Author: Benjamin

---

## What This Document Is

This is a context brief for a PM and product visioning agent to explore what a native iPhone app for TRACE Trekkers would look like. The web app already exists and is launching April 1, 2026. The iPhone app would be a native iOS client built on top of the same backend — not a separate product.

---

## The Existing Web App

### What It Is

TRACE Trekkers is a collective fitness challenge for the TRACE school community (students, teachers, staff at four San Diego campuses). The whole school pools their miles and steps to walk around the world — starting and ending in San Diego (~24,900 miles total). No user accounts. Anyone with the link can participate.

### Three Public Pages

| Page | Purpose |
|---|---|
| **Map** | Live Mapbox map showing the group's current position on the great circle route around the world. Animated polyline. Rotating inspirational quotes. |
| **Log Activity** | Open form — no login. Enter your name or class name, date, miles or steps (auto-converted), and optionally your campus site. That's it. |
| **Campus Trail** | Dark dashboard showing how far each campus (Trace North, South, East, West) has contributed — expressed as a real geographic location ("Trace North has walked as far as Tokyo"). Celebratory, not competitive. |

### Admin (Protected)

Small admin dashboard behind a login. Admins can review, edit, delete, and flag submissions. Can change their own password and create new admin accounts. Not relevant to the iPhone app.

### Data Model (Key Points)

- **Submissions:** name, date, input type (miles or steps), converted miles, optional campus site
- **Step conversion:** 2,500 steps = 1 mile (server-side)
- **Milestones:** triggered when the group crosses into a new country, continent, ocean, or reaches a major city
- **No user accounts** — submissions are anonymous

### Existing API Endpoints (Public)

| Method | Path | Description |
|---|---|---|
| POST | `/submissions` | Log miles or steps |
| GET | `/stats` | Total miles, current map position, next milestone |
| GET | `/campus_trail` | Per-campus mile totals + geographic narrative milestone |

### Tech Stack

- **Backend:** Ruby on Rails 8, API-only, PostgreSQL
- **Frontend (web):** React + TypeScript + Tailwind CSS
- **Map:** Mapbox GL JS (web) — iOS would use Mapbox Maps SDK for iOS
- **Auth:** Custom Bearer token auth (admin only — not relevant to public iOS app)

---

## The iPhone App Concept

The iPhone app would be a native iOS client for the same backend. Same data, same API, same collective goal. It is not a replacement for the web app — the web app stays live and is the primary experience for desktop and the Campus Trail TV display use case.

### Why an iPhone App Makes Sense

- Students and staff are phone-first
- The log form is already designed to be thumb-friendly, but a native app could make it even faster
- Push notifications for milestone celebrations ("The group just crossed into Asia!") are not possible on the web app
- A home screen icon increases visibility and habit formation

### Likely Core Features (To Be Defined by Vision Agent)

- Log miles or steps (same form, native feel)
- See the live map and current position
- Milestone push notifications
- Campus Trail view
- Submission confirmation that feels rewarding

---

## Known Limitations & Open Questions for the Vision Agent

### Limitations of the Current Backend

1. **No user accounts** — submissions are anonymous. The app cannot show "my history" or "my miles" without adding a user identity layer to the Rails API. This would be new work.
2. **No push notification infrastructure** — the backend has no APNs integration. Milestone alerts would require new backend work.
3. **Mapbox** — the web app uses Mapbox GL JS. iOS would need the Mapbox Maps SDK for iOS (separate SDK, different APIs).
4. **CORS** — the Rails API is currently configured for the web frontend. CORS headers would need to be updated to accept requests from a native client.
5. **No offline/sync support** — if a user tries to log miles without signal, the request fails. No queue or retry mechanism exists.

### Open Questions

- Does the iPhone app need user accounts / personal history, or does it stay anonymous like the web app?
- Should milestone push notifications be in scope?
- Is this App Store distribution or TestFlight / internal only (since the audience is one school)?
- Does the app need to support all four campus sites in the nav, or is a simpler experience appropriate?
- What happens to the admin features — excluded entirely from the iOS app?

---

## What the Vision Agent Should Produce

A product vision document for the iPhone app that covers:

1. The specific user problems the app solves better than the web app
2. Feature scope — what's in, what's out
3. Screen-by-screen flow
4. Any new backend requirements (user accounts, push notifications, etc.)
5. Design direction — how it extends the existing visual identity (expedition journal, orange + black accents, Oswald + Inter type) into native iOS conventions
6. Distribution approach (App Store vs. internal)
7. Dependencies on the existing backend — what needs to change vs. what can be used as-is

---

## Existing Brand & Design Direction (Pass to Vision Agent)

- **Aesthetic:** Expedition journal meets adventure map. Warm parchment base, earth tones, orange (#FF6B00) and black as accents.
- **Fonts:** Oswald Bold (headings), Inter (body)
- **Voice:** Energetic, collective, celebratory. Never competitive or ranked. "Keep trekking." "Together."
- **Campus names:** Trace North, Trace South, Trace East, Trace West
- **Team name:** The Suns / TRACE Suns
- **Step conversion:** 2,500 steps = 1 mile

---

## How to Use This Document

Pass this file — along with `PROJECT_VISION.md` — to a PM agent and a project-visioning agent. The PM should scope the exploration and identify what questions need answering before any build decision is made. The vision agent should produce a lightweight product vision for the iPhone app, clearly flagging where new backend work would be required.

This is an exploration. No build commitment has been made.
