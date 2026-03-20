import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import LogPage from "./LogPage"
import * as api from "../../lib/api"
import type { CreateSubmissionResponse } from "../../lib/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderLogPage() {
  return render(
    <MemoryRouter initialEntries={["/log"]}>
      <Routes>
        <Route path="/log" element={<LogPage />} />
        <Route path="/" element={<div>Map page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

function makeSubmissionResponse(
  overrides: Partial<CreateSubmissionResponse["submission"]> = {}
): CreateSubmissionResponse {
  return {
    submission: {
      id: 1,
      name: "Test User",
      activity_date: todayISO(),
      input_type: "miles",
      input_value: 3.2,
      converted_miles: 3.2,
      imported: false,
      flagged: false,
      created_at: new Date().toISOString(),
      ...overrides,
    },
    triggered_milestones: [],
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LogPage", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe("initial render", () => {
    it("renders the page heading", () => {
      renderLogPage()
      expect(screen.getByRole("heading", { name: /log your activity/i })).toBeInTheDocument()
    })

    it("renders name, date, and value inputs", () => {
      renderLogPage()
      expect(screen.getByLabelText(/your name or class name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/how many miles/i)).toBeInTheDocument()
    })

    it("defaults the date field to today", () => {
      renderLogPage()
      const dateInput = screen.getByLabelText<HTMLInputElement>(/^date/i)
      expect(dateInput.value).toBe(todayISO())
    })

    it("renders the Miles/Steps toggle with Miles active by default", () => {
      renderLogPage()
      const milesBtn = screen.getByRole("radio", { name: /miles/i })
      const stepsBtn = screen.getByRole("radio", { name: /steps/i })
      expect(milesBtn).toHaveAttribute("aria-checked", "true")
      expect(stepsBtn).toHaveAttribute("aria-checked", "false")
    })

    it("renders the submit button", () => {
      renderLogPage()
      expect(screen.getByRole("button", { name: /log your miles/i })).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Toggle behavior
  // -------------------------------------------------------------------------

  describe("Miles/Steps toggle", () => {
    it("switches to Steps when the Steps button is clicked", async () => {
      const user = userEvent.setup()
      renderLogPage()

      await user.click(screen.getByRole("radio", { name: /steps/i }))

      expect(screen.getByRole("radio", { name: /steps/i })).toHaveAttribute("aria-checked", "true")
      expect(screen.getByRole("radio", { name: /miles/i })).toHaveAttribute("aria-checked", "false")
    })

    it("updates the value input label when switching to Steps", async () => {
      const user = userEvent.setup()
      renderLogPage()

      await user.click(screen.getByRole("radio", { name: /steps/i }))

      expect(screen.getByLabelText(/how many steps/i)).toBeInTheDocument()
    })

    it("updates the submit button label when switching to Steps", async () => {
      const user = userEvent.setup()
      renderLogPage()

      await user.click(screen.getByRole("radio", { name: /steps/i }))

      expect(screen.getByRole("button", { name: /log your steps/i })).toBeInTheDocument()
    })

    it("does not clear the value field when switching input type", async () => {
      const user = userEvent.setup()
      renderLogPage()

      await user.type(screen.getByLabelText(/how many miles/i), "5")
      await user.click(screen.getByRole("radio", { name: /steps/i }))

      expect(screen.getByLabelText(/how many steps/i)).toHaveValue(5)
    })
  })

  // -------------------------------------------------------------------------
  // Step conversion preview
  // -------------------------------------------------------------------------

  describe("step conversion preview", () => {
    it("shows the steps hint when Steps mode is active", async () => {
      const user = userEvent.setup()
      renderLogPage()

      await user.click(screen.getByRole("radio", { name: /steps/i }))

      expect(screen.getByText(/2,500 steps = 1 mile/i)).toBeVisible()
    })

    it("shows converted miles inline when a step count is entered", async () => {
      const user = userEvent.setup()
      renderLogPage()

      await user.click(screen.getByRole("radio", { name: /steps/i }))
      await user.type(screen.getByLabelText(/how many steps/i), "5000")

      // 5000 / 2500 = 2.0
      expect(screen.getByText(/\u2248 2\.0 miles/)).toBeInTheDocument()
    })

    it("shows converted miles for a non-round step count", async () => {
      const user = userEvent.setup()
      renderLogPage()

      await user.click(screen.getByRole("radio", { name: /steps/i }))
      await user.type(screen.getByLabelText(/how many steps/i), "7500")

      // 7500 / 2500 = 3.0
      expect(screen.getByText(/\u2248 3\.0 miles/)).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Field validation
  // -------------------------------------------------------------------------

  describe("field validation", () => {
    it("shows all required field errors on empty submit", async () => {
      const user = userEvent.setup()
      renderLogPage()

      // Clear the date that was pre-filled (value input is empty, name is empty)
      const dateInput = screen.getByLabelText<HTMLInputElement>(/^date/i)
      await user.clear(dateInput)

      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      expect(await screen.findByText(/please enter a name or class name/i)).toBeInTheDocument()
      expect(await screen.findByText(/please enter a valid date/i)).toBeInTheDocument()
      expect(await screen.findByText(/enter a number greater than 0/i)).toBeInTheDocument()
    })

    it("shows a name error when name is blank", async () => {
      const user = userEvent.setup()
      renderLogPage()

      await user.type(screen.getByLabelText(/how many miles/i), "3")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      expect(await screen.findByText(/please enter a name or class name/i)).toBeInTheDocument()
    })

    it("shows a value error when 0 is entered", async () => {
      const user = userEvent.setup()
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Jess")
      await user.type(screen.getByLabelText(/how many miles/i), "0")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      expect(await screen.findByText(/enter a number greater than 0/i)).toBeInTheDocument()
    })

    it("shows a future date error when the date is in the future", async () => {
      const user = userEvent.setup()
      renderLogPage()

      const dateInput = screen.getByLabelText(/^date/i)
      await user.clear(dateInput)
      await user.type(dateInput, "2099-01-01")
      await user.type(screen.getByLabelText(/your name or class name/i), "Jess")
      await user.type(screen.getByLabelText(/how many miles/i), "3")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      expect(await screen.findByText(/date can't be in the future/i)).toBeInTheDocument()
    })

    it("does not show errors before a submit attempt", () => {
      renderLogPage()
      // No errors visible on first render
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    it("clears a field error in real time once the value is corrected", async () => {
      const user = userEvent.setup()
      renderLogPage()

      // Trigger name error
      await user.type(screen.getByLabelText(/how many miles/i), "3")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))
      expect(await screen.findByText(/please enter a name or class name/i)).toBeInTheDocument()

      // Fix it — error should disappear
      await user.type(screen.getByLabelText(/your name or class name/i), "Ms. Rivera")
      await waitFor(() => {
        expect(screen.queryByText(/please enter a name or class name/i)).not.toBeInTheDocument()
      })
    })
  })

  // -------------------------------------------------------------------------
  // Successful submission
  // -------------------------------------------------------------------------

  describe("successful submission", () => {
    it("shows the success state after a valid miles submission", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "createSubmission").mockResolvedValue(
        makeSubmissionResponse({ input_type: "miles", input_value: 3.2, converted_miles: 3.2 })
      )
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Coach Kim")
      await user.type(screen.getByLabelText(/how many miles/i), "3.2")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      await waitFor(() => {
        expect(screen.getByText(/you just added/i)).toBeInTheDocument()
      })
      expect(screen.getByText(/3\.2 miles/)).toBeInTheDocument()
      expect(screen.getByText(/the trace suns are on the move/i)).toBeInTheDocument()
    })

    it("shows converted miles and step count after a steps submission", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "createSubmission").mockResolvedValue(
        makeSubmissionResponse({
          input_type: "steps",
          input_value: 6000,
          converted_miles: 2.4,
        })
      )
      renderLogPage()

      await user.click(screen.getByRole("radio", { name: /steps/i }))
      await user.type(screen.getByLabelText(/your name or class name/i), "8th Grade")
      await user.type(screen.getByLabelText(/how many steps/i), "6000")
      await user.click(screen.getByRole("button", { name: /log your steps/i }))

      await waitFor(() => {
        expect(screen.getByText(/you just added/i)).toBeInTheDocument()
      })
      expect(screen.getByText(/2\.4 miles/)).toBeInTheDocument()
      expect(screen.getByText(/6,000 steps/)).toBeInTheDocument()
    })

    it("shows a 'See where we are' link to the map page", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "createSubmission").mockResolvedValue(makeSubmissionResponse())
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Ana")
      await user.type(screen.getByLabelText(/how many miles/i), "2")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      const link = await screen.findByRole("link", { name: /see where we are/i })
      expect(link).toBeInTheDocument()
    })

    it("calls createSubmission with the correct payload", async () => {
      const user = userEvent.setup()
      const spy = vi.spyOn(api, "createSubmission").mockResolvedValue(makeSubmissionResponse())
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Ms. Lee")
      await user.type(screen.getByLabelText(/how many miles/i), "5")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      await waitFor(() => expect(spy).toHaveBeenCalledOnce())
      expect(spy).toHaveBeenCalledWith({
        submission: {
          name: "Ms. Lee",
          activity_date: todayISO(),
          input_type: "miles",
          input_value: 5,
          site: null,
        },
      })
    })
  })

  // -------------------------------------------------------------------------
  // "Log more activity" reset
  // -------------------------------------------------------------------------

  describe("log more activity", () => {
    beforeEach(async () => {
      vi.spyOn(api, "createSubmission").mockResolvedValue(makeSubmissionResponse())
    })

    it("resets the form in place when 'Log more activity' is clicked", async () => {
      const user = userEvent.setup()
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Tyler")
      await user.type(screen.getByLabelText(/how many miles/i), "4")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      await waitFor(() => screen.getByText(/you just added/i))

      await user.click(screen.getByRole("button", { name: /log more activity/i }))

      // Form should be back, fields cleared
      expect(screen.getByLabelText(/your name or class name/i)).toHaveValue("")
      expect(screen.getByLabelText<HTMLInputElement>(/^date/i).value).toBe(todayISO())
      expect(screen.getByRole("radio", { name: /miles/i })).toHaveAttribute("aria-checked", "true")
      expect(screen.getByLabelText(/how many miles/i)).toHaveValue(null)
    })
  })

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  describe("API error state", () => {
    it("shows the API error banner when createSubmission throws", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "createSubmission").mockRejectedValue(
        new Error("Something went wrong. Try again.")
      )
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Kai")
      await user.type(screen.getByLabelText(/how many miles/i), "2")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      const banner = await screen.findByRole("alert")
      expect(banner).toHaveTextContent(/something went wrong/i)
    })

    it("keeps the form visible (does not show success state) after an API error", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "createSubmission").mockRejectedValue(new Error("Network error"))
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Kai")
      await user.type(screen.getByLabelText(/how many miles/i), "2")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      await screen.findByRole("alert")
      expect(screen.queryByText(/you just added/i)).not.toBeInTheDocument()
      // Form inputs still present
      expect(screen.getByLabelText(/your name or class name/i)).toBeInTheDocument()
    })

    it("dismisses the error banner when the X button is clicked", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "createSubmission").mockRejectedValue(new Error("Oops"))
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Kai")
      await user.type(screen.getByLabelText(/how many miles/i), "2")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      const banner = await screen.findByRole("alert")
      const dismiss = within(banner).getByRole("button", { name: /dismiss error/i })
      await user.click(dismiss)

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      })
    })

    it("clears the API error banner on the next submit attempt", async () => {
      const user = userEvent.setup()
      const spy = vi.spyOn(api, "createSubmission")
      spy.mockRejectedValueOnce(new Error("Server error"))
      spy.mockResolvedValueOnce(makeSubmissionResponse())

      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Mia")
      await user.type(screen.getByLabelText(/how many miles/i), "1")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      await screen.findByRole("alert")

      // Submit again — error should clear
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      })
      await waitFor(() => {
        expect(screen.getByText(/you just added/i)).toBeInTheDocument()
      })
    })

    it("shows a generic error when the rejection value is not an Error instance", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "createSubmission").mockRejectedValue("timeout")
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Sam")
      await user.type(screen.getByLabelText(/how many miles/i), "3")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      const banner = await screen.findByRole("alert")
      expect(banner).toHaveTextContent(/something went wrong/i)
    })
  })

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe("loading state", () => {
    it("disables the submit button while the request is in flight", async () => {
      const user = userEvent.setup()
      // Never resolves — stays in loading state for the duration of this test
      vi.spyOn(api, "createSubmission").mockReturnValue(new Promise(() => {}))
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Jordan")
      await user.type(screen.getByLabelText(/how many miles/i), "2")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      const btn = screen.getByRole("button", { name: /\u00b7\u00b7\u00b7/ })
      expect(btn).toBeDisabled()
    })
  })

  // -------------------------------------------------------------------------
  // Site dropdown
  // -------------------------------------------------------------------------

  describe("site dropdown", () => {
    it("renders a campus select with a placeholder option", () => {
      renderLogPage()
      const select = screen.getByLabelText(/your campus/i)
      expect(select).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /select your campus/i })).toBeInTheDocument()
    })

    it("lists all four campus options", () => {
      renderLogPage()
      expect(screen.getByRole("option", { name: "Trace North" })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "Trace South" })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "Trace East" })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "Trace West" })).toBeInTheDocument()
    })

    it("sends the selected site in the submission payload", async () => {
      const user = userEvent.setup()
      const spy = vi.spyOn(api, "createSubmission").mockResolvedValue(makeSubmissionResponse())
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "North Team")
      await user.type(screen.getByLabelText(/how many miles/i), "3")
      await user.selectOptions(screen.getByLabelText(/your campus/i), "trace_north")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      await waitFor(() => expect(spy).toHaveBeenCalledOnce())
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          submission: expect.objectContaining({ site: "trace_north" }),
        })
      )
    })

    it("sends site: null when no campus is selected", async () => {
      const user = userEvent.setup()
      const spy = vi.spyOn(api, "createSubmission").mockResolvedValue(makeSubmissionResponse())
      renderLogPage()

      await user.type(screen.getByLabelText(/your name or class name/i), "Anyone")
      await user.type(screen.getByLabelText(/how many miles/i), "2")
      await user.click(screen.getByRole("button", { name: /log your miles/i }))

      await waitFor(() => expect(spy).toHaveBeenCalledOnce())
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          submission: expect.objectContaining({ site: null }),
        })
      )
    })
  })
})
