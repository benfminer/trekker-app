import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import * as api from "../../lib/api"
import NewMilestonePage from "./NewMilestonePage"

const MOCK_MILESTONE = {
  id: 99,
  name: "Tokyo",
  milestone_type: "city" as const,
  mile_marker: 9000,
  miles_remaining: 865,
  description: null,
  fun_fact: null,
  triggered: false,
  triggered_at: null,
  created_at: "2026-03-20T12:00:00Z",
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/new-milestone"]}>
      <Routes>
        <Route path="/admin/new-milestone" element={<NewMilestonePage />} />
        <Route path="/admin" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe("NewMilestonePage", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Form rendering
  // -------------------------------------------------------------------------

  it("renders all form fields", () => {
    renderPage()
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mile marker/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fun fact/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /add milestone/i })).toBeInTheDocument()
  })

  it("renders type options for all four milestone types", () => {
    renderPage()
    const select = screen.getByLabelText(/type/i)
    expect(select).toHaveValue("city")
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.value)
    expect(options).toContain("city")
    expect(options).toContain("country")
    expect(options).toContain("continent")
    expect(options).toContain("ocean")
  })

  it("renders a back link to the dashboard", () => {
    renderPage()
    expect(screen.getByRole("link", { name: /back to dashboard/i })).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Client-side validation
  // -------------------------------------------------------------------------

  it("shows error when mile marker is negative", async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/^name/i), "Tokyo")
    await user.clear(screen.getByLabelText(/mile marker/i))
    await user.type(screen.getByLabelText(/mile marker/i), "-100")
    await user.click(screen.getByRole("button", { name: /add milestone/i }))
    expect(screen.getByRole("alert")).toHaveTextContent(/positive number/i)
  })

  it("does not call the API when client-side validation fails", async () => {
    const spy = vi.spyOn(api, "createAdminMilestone")
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/^name/i), "Tokyo")
    await user.type(screen.getByLabelText(/mile marker/i), "-1")
    await user.click(screen.getByRole("button", { name: /add milestone/i }))
    expect(spy).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // Successful submission
  // -------------------------------------------------------------------------

  it("shows success state after a valid submission", async () => {
    vi.spyOn(api, "createAdminMilestone").mockResolvedValue({ milestone: MOCK_MILESTONE })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/^name/i), "Tokyo")
    await user.type(screen.getByLabelText(/mile marker/i), "9000")
    await user.click(screen.getByRole("button", { name: /add milestone/i }))
    await waitFor(() => {
      expect(screen.getByText(/added to the route/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Tokyo/)).toBeInTheDocument()
  })

  it("calls createAdminMilestone with the correct payload", async () => {
    const spy = vi
      .spyOn(api, "createAdminMilestone")
      .mockResolvedValue({ milestone: MOCK_MILESTONE })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/^name/i), "Tokyo")
    await user.selectOptions(screen.getByLabelText(/type/i), "city")
    await user.type(screen.getByLabelText(/mile marker/i), "9000")
    await user.click(screen.getByRole("button", { name: /add milestone/i }))
    await waitFor(() => expect(spy).toHaveBeenCalledOnce())
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Tokyo", milestone_type: "city", mile_marker: 9000 }),
      expect.any(String)
    )
  })

  it("shows 'Already reached' note when the returned milestone is triggered", async () => {
    vi.spyOn(api, "createAdminMilestone").mockResolvedValue({
      milestone: { ...MOCK_MILESTONE, triggered: true },
    })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/^name/i), "Old City")
    await user.type(screen.getByLabelText(/mile marker/i), "500")
    await user.click(screen.getByRole("button", { name: /add milestone/i }))
    await waitFor(() =>
      expect(screen.getByText(/already reached/i)).toBeInTheDocument()
    )
  })

  it("'Add another' button resets the form", async () => {
    vi.spyOn(api, "createAdminMilestone").mockResolvedValue({ milestone: MOCK_MILESTONE })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/^name/i), "Tokyo")
    await user.type(screen.getByLabelText(/mile marker/i), "9000")
    await user.click(screen.getByRole("button", { name: /add milestone/i }))
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /add another/i })).toBeInTheDocument()
    )
    await user.click(screen.getByRole("button", { name: /add another/i }))
    expect(screen.getByRole("button", { name: /add milestone/i })).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // API error
  // -------------------------------------------------------------------------

  it("shows an error message when the API rejects the request", async () => {
    vi.spyOn(api, "createAdminMilestone").mockRejectedValue(
      new Error("Milestone type is not included in the list")
    )
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/^name/i), "Bad Type")
    await user.type(screen.getByLabelText(/mile marker/i), "5000")
    await user.click(screen.getByRole("button", { name: /add milestone/i }))
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })

  it("does not show success state on API error", async () => {
    vi.spyOn(api, "createAdminMilestone").mockRejectedValue(new Error("Server error"))
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/^name/i), "Bad")
    await user.type(screen.getByLabelText(/mile marker/i), "5000")
    await user.click(screen.getByRole("button", { name: /add milestone/i }))
    await screen.findByRole("alert")
    expect(screen.queryByText(/added to the route/i)).not.toBeInTheDocument()
  })
})
