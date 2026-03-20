import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import AdminPage from "./AdminPage"
import * as api from "../../lib/api"
import { setAdminToken, clearAdminToken } from "../../lib/auth"
import type { AdminSubmissionsResponse, Submission, SubmissionsMeta } from "../../lib/types"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeMeta(overrides: Partial<SubmissionsMeta> = {}): SubmissionsMeta {
  return {
    page: 1,
    per_page: 50,
    total_count: 3,
    total_pages: 1,
    ...overrides,
  }
}

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 1,
    name: "Ms. Rivera's Class",
    activity_date: "2026-03-18",
    input_type: "miles",
    input_value: 4.2,
    converted_miles: 4.2,
    imported: false,
    flagged: false,
    created_at: "2026-03-18T10:00:00Z",
    ...overrides,
  }
}

function makeResponse(
  submissions: Submission[] = [],
  metaOverrides: Partial<SubmissionsMeta> = {}
): AdminSubmissionsResponse {
  return {
    submissions,
    meta: makeMeta({ total_count: submissions.length, ...metaOverrides }),
  }
}

// A default set of three distinct submissions for most tests
const defaultSubmissions: Submission[] = [
  makeSubmission({ id: 1, name: "Ms. Rivera's Class", converted_miles: 4.2 }),
  makeSubmission({ id: 2, name: "David M.", input_type: "steps", input_value: 12000, converted_miles: 4.8 }),
  makeSubmission({ id: 3, name: "PE Period 3", converted_miles: 12.0, flagged: true }),
]

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderAdminPage() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AdminPage", () => {
  beforeEach(() => {
    setAdminToken("test-token")
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearAdminToken()
    localStorage.clear()
  })

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe("loading state", () => {
    it("renders skeleton rows while data is being fetched", async () => {
      // Never resolves — stays in loading state
      vi.spyOn(api, "getAdminSubmissions").mockReturnValue(new Promise(() => {}))

      renderAdminPage()

      // The table is rendered immediately
      expect(screen.getByRole("table")).toBeInTheDocument()

      // Skeleton rows are present — they render as tr elements with no text content
      const rows = screen.getAllByRole("row")
      // Header row + 10 skeleton rows
      expect(rows.length).toBe(11)
    })

    it("shows the page heading and filter bar immediately (before data loads)", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockReturnValue(new Promise(() => {}))

      renderAdminPage()

      expect(screen.getByRole("heading", { name: /submissions/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Search by name...")).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Renders rows
  // -------------------------------------------------------------------------

  describe("renders rows from API", () => {
    it("renders a row for each submission returned by the API", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse(defaultSubmissions)
      )

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByText("Ms. Rivera's Class")).toBeInTheDocument()
      })

      expect(screen.getByText("David M.")).toBeInTheDocument()
      expect(screen.getByText("PE Period 3")).toBeInTheDocument()
    })

    it("shows converted miles for each row", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse(defaultSubmissions)
      )

      renderAdminPage()

      await waitFor(() => {
        // Multiple "4.2" visible — at least one per miles-converted column
        const cells = screen.getAllByText("4.2")
        expect(cells.length).toBeGreaterThan(0)
      })
    })

    it("shows the total submission count in the summary stats", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse(defaultSubmissions, { total_count: 3 })
      )

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByText(/3 submissions/i)).toBeInTheDocument()
      })
    })

    it("shows an Import badge for imported submissions", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse([makeSubmission({ id: 1, imported: true })])
      )

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByText("Import")).toBeInTheDocument()
      })
    })

    it("shows a Web badge for non-imported submissions", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse([makeSubmission({ id: 1, imported: false })])
      )

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByText("Web")).toBeInTheDocument()
      })
    })
  })

  // -------------------------------------------------------------------------
  // Empty states
  // -------------------------------------------------------------------------

  describe("empty states", () => {
    it("shows the no-submissions message when the API returns an empty array", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(makeResponse([]))

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByText(/no submissions yet/i)).toBeInTheDocument()
      })
    })
  })

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  describe("fetch error", () => {
    it("shows an error banner when the fetch fails", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockRejectedValue(
        new Error("Network error")
      )

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/could not load submissions/i)
      })
    })

    it("shows a Retry button that re-fetches on click", async () => {
      const user = userEvent.setup()
      const spy = vi
        .spyOn(api, "getAdminSubmissions")
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(makeResponse(defaultSubmissions))

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /retry/i }))

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      })

      expect(spy).toHaveBeenCalledTimes(2)
    })

    it("redirects to /admin/login when the API returns 401", async () => {
      const authError = Object.assign(new Error("Unauthorized"), { status: 401 })
      vi.spyOn(api, "getAdminSubmissions").mockRejectedValue(authError)

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByText("Login page")).toBeInTheDocument()
      })
    })
  })

  // -------------------------------------------------------------------------
  // Search filtering (client-side)
  // -------------------------------------------------------------------------

  describe("search filtering", () => {
    beforeEach(() => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse(defaultSubmissions)
      )
    })

    it("filters rows by name as the user types in the search input", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByText("Ms. Rivera's Class")).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText("Search by name..."), "David")

      await waitFor(() => {
        expect(screen.queryByText("Ms. Rivera's Class")).not.toBeInTheDocument()
      })
      expect(screen.getByText("David M.")).toBeInTheDocument()
    })

    it("shows a filtered count in the summary stats when search is active", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByText("Ms. Rivera's Class")).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText("Search by name..."), "David")

      await waitFor(() => {
        expect(screen.getByText(/showing 1 of 3 submissions/i)).toBeInTheDocument()
      })
    })

    it("shows the empty-filtered state when no rows match the search", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => {
        expect(screen.getByText("Ms. Rivera's Class")).toBeInTheDocument()
      })

      await user.type(
        screen.getByPlaceholderText("Search by name..."),
        "zzznomatch"
      )

      await waitFor(() => {
        expect(
          screen.getByText(/no submissions match your filters/i)
        ).toBeInTheDocument()
      })
    })

    it("shows the Clear filters button when search is active", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      await user.type(screen.getByPlaceholderText("Search by name..."), "PE")

      expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument()
    })

    it("restores all rows after Clear filters is clicked", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      await user.type(screen.getByPlaceholderText("Search by name..."), "PE")

      await waitFor(() => {
        expect(screen.queryByText("David M.")).not.toBeInTheDocument()
      })

      // There may be multiple clear-filters buttons (in bar + empty state)
      await user.click(screen.getAllByRole("button", { name: /clear filters/i })[0])

      await waitFor(() => {
        expect(screen.getByText("David M.")).toBeInTheDocument()
      })
    })
  })

  // -------------------------------------------------------------------------
  // Delete confirmation flow
  // -------------------------------------------------------------------------

  describe("delete flow", () => {
    beforeEach(() => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse(defaultSubmissions)
      )
    })

    it("shows inline delete confirmation when the delete icon is clicked", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      const deleteButtons = screen.getAllByRole("button", { name: /delete submission/i })
      await user.click(deleteButtons[0])

      expect(screen.getByText(/remove/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument()
    })

    it("shows Cancel in the delete confirmation", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      const deleteButtons = screen.getAllByRole("button", { name: /delete submission/i })
      await user.click(deleteButtons[0])

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    })

    it("cancels and returns to normal view when Cancel is clicked", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      const deleteButtons = screen.getAllByRole("button", { name: /delete submission/i })
      await user.click(deleteButtons[0])

      await user.click(screen.getByRole("button", { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByText(/remove/i)).not.toBeInTheDocument()
      })
    })

    it("calls deleteAdminSubmission and removes the row after confirmation", async () => {
      const user = userEvent.setup()
      const spy = vi
        .spyOn(api, "deleteAdminSubmission")
        .mockResolvedValue(undefined)

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      const deleteButtons = screen.getAllByRole("button", { name: /delete submission/i })
      await user.click(deleteButtons[0])

      await user.click(screen.getByRole("button", { name: /^delete$/i }))

      await waitFor(() => {
        expect(screen.queryByText("Ms. Rivera's Class")).not.toBeInTheDocument()
      })

      expect(spy).toHaveBeenCalledWith(1, "test-token")
    })
  })

  // -------------------------------------------------------------------------
  // Flag toggle
  // -------------------------------------------------------------------------

  describe("flag toggle", () => {
    it("calls flagAdminSubmission when the flag icon is clicked", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse([makeSubmission({ id: 1, flagged: false })])
      )
      const spy = vi.spyOn(api, "flagAdminSubmission").mockResolvedValue({
        submission: makeSubmission({ id: 1, flagged: true }),
      })

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      await user.click(screen.getByRole("button", { name: /flag submission/i }))

      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith(1, "test-token")
      })
    })

    it("optimistically toggles the flag state before the API responds", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse([makeSubmission({ id: 1, flagged: false })])
      )
      // Delay the response so we can check the optimistic state
      vi.spyOn(api, "flagAdminSubmission").mockReturnValue(
        new Promise((resolve) =>
          setTimeout(() => resolve({ submission: makeSubmission({ id: 1, flagged: true }) }), 200)
        )
      )

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      // Initially shows "Flag submission" (unflagged)
      expect(screen.getByRole("button", { name: /flag submission/i })).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /flag submission/i }))

      // Optimistic update — label should now be "Unflag submission"
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /unflag submission/i })).toBeInTheDocument()
      })
    })

    it("rolls back the optimistic update when the API call fails", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse([makeSubmission({ id: 1, flagged: false })])
      )
      vi.spyOn(api, "flagAdminSubmission").mockRejectedValue(
        new Error("Server error")
      )

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      await user.click(screen.getByRole("button", { name: /flag submission/i }))

      // After the rejection, should roll back to unflagged state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /flag submission/i })).toBeInTheDocument()
      })
    })
  })

  // -------------------------------------------------------------------------
  // Inline edit
  // -------------------------------------------------------------------------

  describe("inline edit", () => {
    beforeEach(() => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse(defaultSubmissions)
      )
    })

    it("opens the edit row when the edit icon is clicked", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      const editButtons = screen.getAllByRole("button", { name: /edit submission/i })
      await user.click(editButtons[0])

      expect(screen.getByLabelText("Name")).toBeInTheDocument()
      expect(screen.getByLabelText("Activity date")).toBeInTheDocument()
      expect(screen.getByLabelText("Input type")).toBeInTheDocument()
      expect(screen.getByLabelText("Input value")).toBeInTheDocument()
    })

    it("pre-populates the edit fields with the row's current values", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      const editButtons = screen.getAllByRole("button", { name: /edit submission/i })
      await user.click(editButtons[0])

      expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe("Ms. Rivera's Class")
      expect(screen.getByLabelText<HTMLInputElement>("Activity date").value).toBe("2026-03-18")
    })

    it("closes the edit row and discards changes when Cancel is clicked", async () => {
      const user = userEvent.setup()

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      const editButtons = screen.getAllByRole("button", { name: /edit submission/i })
      await user.click(editButtons[0])

      await user.clear(screen.getByLabelText("Name"))
      await user.type(screen.getByLabelText("Name"), "Changed Name")

      await user.click(screen.getByRole("button", { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByLabelText("Name")).not.toBeInTheDocument()
      })
    })

    it("calls updateAdminSubmission with the edited values on Save", async () => {
      const user = userEvent.setup()
      const spy = vi.spyOn(api, "updateAdminSubmission").mockResolvedValue({
        submission: makeSubmission({ id: 1, name: "Updated Name" }),
      })

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      const editButtons = screen.getAllByRole("button", { name: /edit submission/i })
      await user.click(editButtons[0])

      await user.clear(screen.getByLabelText("Name"))
      await user.type(screen.getByLabelText("Name"), "Updated Name")

      await user.click(screen.getByRole("button", { name: /^save$/i }))

      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            submission: expect.objectContaining({ name: "Updated Name" }),
          }),
          "test-token"
        )
      })
    })

    it("closes the edit row and updates the submission after a successful save", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "updateAdminSubmission").mockResolvedValue({
        submission: makeSubmission({ id: 1, name: "Updated Name", converted_miles: 4.2 }),
      })

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      const editButtons = screen.getAllByRole("button", { name: /edit submission/i })
      await user.click(editButtons[0])

      await user.click(screen.getByRole("button", { name: /^save$/i }))

      await waitFor(() => {
        expect(screen.queryByLabelText("Name")).not.toBeInTheDocument()
      })
      expect(screen.getByText("Updated Name")).toBeInTheDocument()
    })

    it("shows an error inside the edit row when Save fails", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "updateAdminSubmission").mockRejectedValue(
        new Error("Validation failed")
      )

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      const editButtons = screen.getAllByRole("button", { name: /edit submission/i })
      await user.click(editButtons[0])

      await user.click(screen.getByRole("button", { name: /^save$/i }))

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/validation failed/i)
      })
      // Edit row should still be open
      expect(screen.getByLabelText("Name")).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  describe("pagination", () => {
    it("does not show pagination controls when total is 50 or fewer", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse(defaultSubmissions, { total_count: 3, total_pages: 1, per_page: 50 })
      )

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      expect(screen.queryByRole("button", { name: /prev/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument()
    })

    it("shows pagination controls when total exceeds 50", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse(defaultSubmissions, { total_count: 100, total_pages: 2, per_page: 50 })
      )

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      expect(screen.getByRole("button", { name: /← prev/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /next →/i })).toBeInTheDocument()
    })

    it("disables the Prev button on the first page", async () => {
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(
        makeResponse(defaultSubmissions, { total_count: 100, total_pages: 2, per_page: 50 })
      )

      renderAdminPage()

      await waitFor(() => screen.getByText("Ms. Rivera's Class"))

      expect(screen.getByRole("button", { name: /← prev/i })).toBeDisabled()
    })
  })

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------

  describe("logout", () => {
    it("calls adminLogout and redirects to /admin/login on logout", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(makeResponse([]))
      const spy = vi.spyOn(api, "adminLogout").mockResolvedValue()

      renderAdminPage()

      await waitFor(() => screen.getByText(/no submissions yet/i))

      await user.click(screen.getByRole("button", { name: /log out/i }))

      await waitFor(() => {
        expect(screen.getByText("Login page")).toBeInTheDocument()
      })

      expect(spy).toHaveBeenCalledWith("test-token")
    })

    it("redirects even if adminLogout throws", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "getAdminSubmissions").mockResolvedValue(makeResponse([]))
      vi.spyOn(api, "adminLogout").mockRejectedValue(new Error("Network error"))

      renderAdminPage()

      await waitFor(() => screen.getByText(/no submissions yet/i))

      await user.click(screen.getByRole("button", { name: /log out/i }))

      await waitFor(() => {
        expect(screen.getByText("Login page")).toBeInTheDocument()
      })
    })
  })
})
