import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import * as api from "../../lib/api"
import ResetUserPasswordPage from "./ResetUserPasswordPage"

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/reset-user-password"]}>
      <Routes>
        <Route path="/admin/reset-user-password" element={<ResetUserPasswordPage />} />
        <Route path="/admin" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe("ResetUserPasswordPage", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Form rendering
  // -------------------------------------------------------------------------

  it("renders the form fields and submit button", () => {
    renderPage()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument()
  })

  it("renders a back link to the dashboard", () => {
    renderPage()
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Client-side validation
  // -------------------------------------------------------------------------

  it("shows error when new password is too short", async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/username/i), "otherAdmin")
    await user.type(screen.getByLabelText(/new password/i), "short")
    await user.type(screen.getByLabelText(/confirm password/i), "short")
    await user.click(screen.getByRole("button", { name: /reset password/i }))
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8 characters/i)
  })

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/username/i), "otherAdmin")
    await user.type(screen.getByLabelText(/new password/i), "password123")
    await user.type(screen.getByLabelText(/confirm password/i), "different123")
    await user.click(screen.getByRole("button", { name: /reset password/i }))
    expect(screen.getByRole("alert")).toHaveTextContent(/do not match/i)
  })

  it("does not call the API when validation fails", async () => {
    const spy = vi.spyOn(api, "resetAdminUserPassword")
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/username/i), "otherAdmin")
    await user.type(screen.getByLabelText(/new password/i), "short")
    await user.type(screen.getByLabelText(/confirm password/i), "short")
    await user.click(screen.getByRole("button", { name: /reset password/i }))
    expect(spy).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // Successful reset
  // -------------------------------------------------------------------------

  it("shows success state after a valid submission", async () => {
    vi.spyOn(api, "resetAdminUserPassword").mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/username/i), "otherAdmin")
    await user.type(screen.getByLabelText(/new password/i), "newpass123")
    await user.type(screen.getByLabelText(/confirm password/i), "newpass123")
    await user.click(screen.getByRole("button", { name: /reset password/i }))
    await waitFor(() => {
      expect(screen.getByText(/password reset/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/otherAdmin/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument()
  })

  it("calls resetAdminUserPassword with the username and new password", async () => {
    const spy = vi.spyOn(api, "resetAdminUserPassword").mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/username/i), "alice")
    await user.type(screen.getByLabelText(/new password/i), "securepass99")
    await user.type(screen.getByLabelText(/confirm password/i), "securepass99")
    await user.click(screen.getByRole("button", { name: /reset password/i }))
    await waitFor(() => expect(spy).toHaveBeenCalledOnce())
    expect(spy).toHaveBeenCalledWith(
      { username: "alice", new_password: "securepass99" },
      expect.any(String)
    )
  })

  it("shows 'Reset another' button on success that resets the form", async () => {
    vi.spyOn(api, "resetAdminUserPassword").mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/username/i), "bob")
    await user.type(screen.getByLabelText(/new password/i), "newpass123")
    await user.type(screen.getByLabelText(/confirm password/i), "newpass123")
    await user.click(screen.getByRole("button", { name: /reset password/i }))
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /reset another/i })).toBeInTheDocument()
    )
    await user.click(screen.getByRole("button", { name: /reset another/i }))
    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // API error
  // -------------------------------------------------------------------------

  it("shows an error message when the API returns an error", async () => {
    vi.spyOn(api, "resetAdminUserPassword").mockRejectedValue(
      new Error("Admin user not found")
    )
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/username/i), "ghost")
    await user.type(screen.getByLabelText(/new password/i), "newpass123")
    await user.type(screen.getByLabelText(/confirm password/i), "newpass123")
    await user.click(screen.getByRole("button", { name: /reset password/i }))
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/not found/i)
    })
  })

  it("does not show success state on API error", async () => {
    vi.spyOn(api, "resetAdminUserPassword").mockRejectedValue(new Error("Error"))
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/username/i), "ghost")
    await user.type(screen.getByLabelText(/new password/i), "newpass123")
    await user.type(screen.getByLabelText(/confirm password/i), "newpass123")
    await user.click(screen.getByRole("button", { name: /reset password/i }))
    await screen.findByRole("alert")
    expect(screen.queryByText(/password reset/i)).not.toBeInTheDocument()
  })
})
