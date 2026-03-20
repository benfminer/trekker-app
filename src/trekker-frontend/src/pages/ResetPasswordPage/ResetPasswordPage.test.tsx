import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as api from "../../lib/api"
import ResetPasswordPage from "./ResetPasswordPage"

function renderWithToken(token?: string) {
  const search = token ? `?token=${token}` : ""
  return render(
    <MemoryRouter initialEntries={[`/admin/reset-password${search}`]}>
      <Routes>
        <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin/login" element={<div>Login page</div>} />
        <Route path="/admin/forgot-password" element={<div>Forgot password page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe("ResetPasswordPage", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // No token in URL
  // -------------------------------------------------------------------------

  it("shows invalid link message when no token is in the URL", () => {
    renderWithToken()
    expect(screen.getByText(/invalid link/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /request a new link/i })).toBeInTheDocument()
  })

  it("does not render the password form when no token is present", () => {
    renderWithToken()
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Form rendering (token present)
  // -------------------------------------------------------------------------

  it("renders the form when a token is present", () => {
    renderWithToken("abc123")
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /set new password/i })).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Client-side validation
  // -------------------------------------------------------------------------

  it("shows error when new password is too short", async () => {
    const user = userEvent.setup()
    renderWithToken("abc123")
    await user.type(screen.getByLabelText(/new password/i), "short")
    await user.type(screen.getByLabelText(/confirm password/i), "short")
    await user.click(screen.getByRole("button", { name: /set new password/i }))
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8 characters/i)
  })

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup()
    renderWithToken("abc123")
    await user.type(screen.getByLabelText(/new password/i), "password123")
    await user.type(screen.getByLabelText(/confirm password/i), "different123")
    await user.click(screen.getByRole("button", { name: /set new password/i }))
    expect(screen.getByRole("alert")).toHaveTextContent(/do not match/i)
  })

  // -------------------------------------------------------------------------
  // Successful reset
  // -------------------------------------------------------------------------

  it("shows success state after a valid submission", async () => {
    vi.spyOn(api, "resetPassword").mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithToken("validtoken123")
    await user.type(screen.getByLabelText(/new password/i), "newpass123")
    await user.type(screen.getByLabelText(/confirm password/i), "newpass123")
    await user.click(screen.getByRole("button", { name: /set new password/i }))
    await waitFor(() => {
      expect(screen.getByText(/password updated/i)).toBeInTheDocument()
    })
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument()
  })

  it("calls resetPassword with the token from the URL and the new password", async () => {
    const spy = vi.spyOn(api, "resetPassword").mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithToken("mytoken456")
    await user.type(screen.getByLabelText(/new password/i), "goodpassword")
    await user.type(screen.getByLabelText(/confirm password/i), "goodpassword")
    await user.click(screen.getByRole("button", { name: /set new password/i }))
    await waitFor(() => expect(spy).toHaveBeenCalledOnce())
    expect(spy).toHaveBeenCalledWith({ token: "mytoken456", new_password: "goodpassword" })
  })

  // -------------------------------------------------------------------------
  // API error (expired / invalid token)
  // -------------------------------------------------------------------------

  it("shows an error message when the API rejects the token", async () => {
    vi.spyOn(api, "resetPassword").mockRejectedValue(
      new Error("Token is invalid or has expired.")
    )
    const user = userEvent.setup()
    renderWithToken("expiredtoken")
    await user.type(screen.getByLabelText(/new password/i), "newpass123")
    await user.type(screen.getByLabelText(/confirm password/i), "newpass123")
    await user.click(screen.getByRole("button", { name: /set new password/i }))
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid or has expired/i)
    })
  })

  it("does not navigate to success state on API error", async () => {
    vi.spyOn(api, "resetPassword").mockRejectedValue(new Error("Expired"))
    const user = userEvent.setup()
    renderWithToken("badtoken")
    await user.type(screen.getByLabelText(/new password/i), "newpass123")
    await user.type(screen.getByLabelText(/confirm password/i), "newpass123")
    await user.click(screen.getByRole("button", { name: /set new password/i }))
    await screen.findByRole("alert")
    expect(screen.queryByText(/password updated/i)).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // NewAdminUserPage — basic smoke tests
  // -------------------------------------------------------------------------
})
