# UX Spec: Log Entry Page (/log)
> Artifact type: User Flow + Wireframe + Interaction Spec
> Last updated: 2026-03-19

---

## Overview

The log entry page is the highest-frequency interaction in the app. Students and teachers use it on their phones, often quickly, possibly in a hallway or after gym class. The design principle is: get the user from landing to confirmed submission in under 60 seconds with zero confusion.

No login required. No account. Just the form.

---

## User Flow

**User:** Any student, teacher, or staff member at TRACE
**Goal:** Submit miles or steps toward the school's collective total
**Entry point:** Tapping a link shared in a class, email, or the school's internal channels. May also arrive from the map page via the "Log Activity" CTA.

### Steps

1. **Page loads**
   - Happy path: Form is immediately visible, no loading state needed (static form, no pre-fetch required)
   - Edge case: Slow connection — form skeleton or plain form with no dynamic content; nothing to wait for

2. **User enters their name or class name**
   - Happy path: Types freely — no validation format required, any string accepted
   - Edge case: Leaves blank — inline validation fires on submit attempt: "Please enter a name or class name"

3. **User confirms or changes the date**
   - Happy path: Date field defaults to today's date. User accepts it and moves on.
   - Edge case: User submitting for a previous day — they tap the date field and adjust. Date picker uses native browser input[type="date"].
   - Edge case: Future date entered — show inline error on submit: "Date can't be in the future"

4. **User selects input type: Miles or Steps**
   - Happy path: Defaults to Miles. User taps the toggle if they have steps.
   - No edge case — toggle is binary, one is always selected

5. **User enters their value**
   - Happy path: Numeric field, user enters a number
   - Edge case: Non-numeric input — browser enforces input[type="number"]; if somehow bypassed, API returns error
   - Edge case: Value of 0 or negative — inline error on submit: "Enter a number greater than 0"
   - Edge case: Absurdly large value (e.g., 1,000,000 miles) — submit succeeds; admin can flag or delete from dashboard. UX does not block this, admin handles it.
   - Edge case: Steps entered — display conversion hint below value field: "2,500 steps = 1 mile" as passive help text

6. **User taps Submit**
   - Happy path: Button shows loading state (spinner or disabled), POST fires, success state renders
   - Edge case: API error (network failure, server error) — form remains filled, error banner appears: "Something went wrong. Try again."
   - Edge case: Validation failure from API — show field-level error next to the offending input

7. **Success state renders**
   - Happy path: Form is replaced by a success message. Shows miles credited (or converted miles if steps were entered). Includes a secondary link: "See where we are" → map page.
   - User has no next required action. Session is complete.

**Exit point:** User has submitted their activity. They may tap through to the map, or simply close the page.
**Emotional arc:** Calm and frictionless going in; genuinely satisfying on the way out — feels like a contribution, not just form-filling.

---

## Wireframe

```
┌────────────────────────────────────┐
│  TRACE TREKKERS          [Map →]   │  ← Header: wordmark left, small map link right
│  ─────────────────────────────     │     Header height: 52px. bg: #0a0a0a. Text: white.
│                                    │
│  Log Your Activity                 │  ← Page heading. Oswald 700, 28px, white on dark bg.
│                                    │     Subhead optional: "Every mile counts."
│  ┌────────────────────────────┐   │
│  │ Name or class name         │   │  ← Text input. Full width.
│  │ e.g. "Ms. Rivera's class"  │   │     Placeholder text gray. Label above: "Your name".
│  └────────────────────────────┘   │
│                                    │
│  ┌────────────────────────────┐   │
│  │ Date           [03/19/2026]│   │  ← Date input. Label above: "Date".
│  └────────────────────────────┘   │     Defaults to today.
│                                    │
│  Activity type                     │  ← Label above toggle.
│  ┌────────────┬───────────────┐   │
│  │   MILES    │     STEPS     │   │  ← Segmented toggle. Full width.
│  └────────────┴───────────────┘   │     Active tab: bg #f97316, text white.
│                                    │     Inactive tab: bg transparent, border, text gray.
│  ┌────────────────────────────┐   │
│  │ 0                          │   │  ← Number input. Label above: "How many?".
│  └────────────────────────────┘   │
│                                    │
│  [Steps mode only, passive text:]  │
│  2,500 steps ≈ 1 mile              │  ← Inter 400, 12px, gray (#6b7280). Hidden in Miles mode.
│                                    │
│  ┌────────────────────────────┐   │
│  │       LOG YOUR MILES       │   │  ← Primary CTA. Oswald 700, uppercase.
│  └────────────────────────────┘   │     bg: #f97316. text: white. full width. height: 52px.
│                                    │     Rounded: 6px.
│                                    │
└────────────────────────────────────┘

PAGE BACKGROUND: #0a0a0a (black)
CARD/FORM REGION: no explicit card — form fields sit directly on the page.
MAX WIDTH: 480px, centered on desktop. Full bleed padding 20px on mobile.
VERTICAL RHYTHM: 24px gap between form fields.
```

### Success State (replaces form)

```
┌────────────────────────────────────┐
│  TRACE TREKKERS          [Map →]   │
│  ─────────────────────────────     │
│                                    │
│           ✓                        │  ← Icon: checkmark circle, #f97316, 48px.
│                                    │
│  You just added                    │  ← Oswald 700, 24px, white.
│  3.2 miles to the journey.         │     Miles figure is dynamic.
│                                    │     If steps: "You just added 2.4 miles
│                                    │     (6,000 steps) to the journey."
│  The TRACE Suns are on the move.   │  ← Inter 400, 16px, gray (#9ca3af).
│                                    │
│  ┌────────────────────────────┐   │
│  │      SEE WHERE WE ARE      │   │  ← Secondary CTA. Same button style.
│  └────────────────────────────┘   │     Routes to /
│                                    │
│  Log more activity                 │  ← Text link, Inter 400, 14px, #f97316.
│                                    │     Reloads the form state (clears fields,
│                                    │     keeps date as today).
└────────────────────────────────────┘
```

---

## Component Inventory

| Component | Type | Notes |
|-----------|------|-------|
| Page header | Layout | Wordmark "TRACE TREKKERS" in Oswald 700. Small "Map" link right-aligned. Sticky on scroll. |
| Page heading | Typography | "Log Your Activity". Oswald 700, 28px. Top of content area. |
| Name input | Form field | `input[type="text"]`. Label above. Placeholder: "Your name or class name". Required. |
| Date input | Form field | `input[type="date"]`. Label above. Defaults to today. Max: today. |
| Miles/Steps toggle | Segmented control | Two options, binary. Controls label and hint text visibility on the value input. |
| Value input | Form field | `input[type="number"]`. Label: "Miles" or "Steps" (updates based on toggle). Min: 0.01. Step: "any". |
| Steps conversion hint | Passive text | "2,500 steps ≈ 1 mile". Visible only when Steps is selected. |
| Submit button | Primary CTA | Full-width. Oswald 700, uppercase. Loading state on tap. |
| Inline error messages | Validation UI | Appear below the relevant field. Inter 400, 13px, #ef4444. |
| Error banner | Page-level error | Appears above the submit button on API failure. Dismissible. |
| Success state | Full page replace | Replaces form. Shows credited miles, secondary CTA to map, and "Log more" text link. |

---

## Interaction Notes

### Miles/Steps Toggle
- Tapping a tab switches the active state immediately (no animation needed, snap transition)
- Switching tabs updates the value input's label: "Miles" or "Steps"
- Switching tabs shows/hides the conversion hint: `transition: opacity 150ms ease`
- The value field is NOT cleared when the toggle changes — user may have typed a number before toggling

### Submit Button Loading State
- On tap: button text changes to a loading indicator (e.g., three-dot ellipsis or spinner icon). Button is disabled and opacity drops to 70%.
- Duration: while the POST request is in flight
- On success: button is not shown again (success state replaces the form)
- On failure: button returns to its active state; error banner appears

### Field Validation Timing
- Validate on submit attempt only, not on blur. Blur validation is annoying on mobile.
- Once submitted with errors, re-validate in real time as the user corrects fields.

### Date Input
- Native `input[type="date"]` — do not build a custom date picker. Native behavior is thumb-friendly on mobile.
- Default value: set to today's date via JavaScript on mount
- Max attribute: today's date (prevents future dates at browser level; also validated server-side)

### Form Reset After Success
- Tapping "Log more activity" clears name and value fields
- Date resets to today
- Toggle resets to Miles
- Does NOT animate — just resets and shows the form

---

## Mobile Considerations

- **Minimum tap target:** 44×44px for all interactive elements
- **Submit button height:** 52px minimum — easy to reach with thumb
- **Toggle height:** 48px per tab
- **Font size minimums:** 16px on all inputs (prevents iOS auto-zoom on focus)
- **Keyboard behavior:** Number input on iOS shows numeric keypad. Date input shows native date picker. Name input shows standard keyboard.
- **Scroll behavior:** If the keyboard pushes content up, the form should remain accessible. Avoid fixed-position elements that conflict with the software keyboard.
- **Max-width:** 480px centered with auto margins on desktop. On mobile, full bleed with 20px horizontal padding.
- **No horizontal scroll** — single column layout, nothing overflows

---

## Typography

| Element | Font | Weight | Size | Color |
|---------|------|--------|------|-------|
| Page heading | Oswald | 700 | 28px | #ffffff |
| Field labels | Inter | 500 | 14px | #d1d5db |
| Input text | Inter | 400 | 16px | #ffffff |
| Placeholder text | Inter | 400 | 16px | #6b7280 |
| CTA button text | Oswald | 700 | 16px uppercase | #ffffff |
| Hint text (steps) | Inter | 400 | 12px | #6b7280 |
| Error messages | Inter | 400 | 13px | #ef4444 |
| Success heading | Oswald | 700 | 24px | #ffffff |
| Success body | Inter | 400 | 16px | #9ca3af |

---

## Color Reference

| Token | Value | Use |
|-------|-------|-----|
| Background | #0a0a0a | Page background |
| Surface | #111111 | Input backgrounds |
| Border | #2a2a2a | Input borders (default state) |
| Border focus | #f97316 | Input border on focus |
| Primary | #f97316 | CTA button, active toggle, links |
| Text primary | #ffffff | Headings, input values |
| Text secondary | #9ca3af | Body, subheads |
| Text muted | #6b7280 | Placeholders, hints |
| Error | #ef4444 | Validation errors |

---

## Open Questions / Decisions for Frontend

1. Does the form need to persist across page refreshes (localStorage)? Recommend: no. Keep it stateless.
2. Should the "Log more activity" link reset in-place or do a full page reload? Recommend: in-place reset (clear state, no reload) to avoid re-downloading assets on mobile.
3. Should the API return the converted miles value so the success state can show "X miles (Y steps)"? The spec assumes yes — confirm with api-builder.
