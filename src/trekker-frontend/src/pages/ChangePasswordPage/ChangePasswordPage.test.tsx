import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as api from "../../lib/api"
import * as auth from "../../lib/auth"
import ChangePasswordPage from "./ChangePasswordPage"

function renderPage() {
  return render(
    <MemoryRouter>
      <ChangePasswordPage />
    </MemoryRouter>
  )
}

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    vi.spyOn(auth, "getAdminToken").mockReturnValue("test-token")
    vi.spyOn(api, "changeAdminPassword").mockResolvedValue(undefined)
  })

  it("renders the form fields", () => {
    renderPage()
    expect(screen.getByLabelText("Current password")).toBeInTheDocument()
    expect(screen.getByLabelText("New password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument()
  })

  it("shows error when passwords don't match", async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText("Current password"), "oldpass")
    await user.type(screen.getByLabelText("New password"), "newpass123")
    await user.type(screen.getByLabelText("Confirm new password"), "different123")
    await user.click(screen.getByRole("button", { name: /update password/i }))
    expect(screen.getByText("New passwords do not match.")).toBeInTheDocument()
  })

  it("shows error when new password is too short", async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText("Current password"), "oldpass")
    await user.type(screen.getByLabelText("New password"), "short")
    await user.type(screen.getByLabelText("Confirm new password"), "short")
    await user.click(screen.getByRole("button", { name: /update password/i }))
    expect(screen.getByText("New password must be at least 8 characters.")).toBeInTheDocument()
  })

  it("shows success state after valid submit", async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText("Current password"), "oldpass123")
    await user.type(screen.getByLabelText("New password"), "newpass123")
    await user.type(screen.getByLabelText("Confirm new password"), "newpass123")
    await user.click(screen.getByRole("button", { name: /update password/i }))
    await waitFor(() => {
      expect(screen.getByText("Password updated")).toBeInTheDocument()
    })
  })

  it("shows API error on failure", async () => {
    vi.spyOn(api, "changeAdminPassword").mockRejectedValue(new Error("Invalid current password"))
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText("Current password"), "wrongpass")
    await user.type(screen.getByLabelText("New password"), "newpass123")
    await user.type(screen.getByLabelText("Confirm new password"), "newpass123")
    await user.click(screen.getByRole("button", { name: /update password/i }))
    await waitFor(() => {
      expect(screen.getByText("Invalid current password")).toBeInTheDocument()
    })
  })
})
