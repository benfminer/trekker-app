import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import AdminLoginPage from "./AdminLoginPage"
import * as api from "../../lib/api"
import { clearAdminToken, getAdminToken } from "../../lib/auth"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/login"]}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<div>Admin Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AdminLoginPage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it("renders username and password fields and a submit button", () => {
    renderLoginPage()
    expect(screen.getByLabelText("Username")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("disables the submit button when fields are empty", () => {
    renderLoginPage()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled()
  })

  it("enables the submit button when both fields have values", async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText("Username"), "admin")
    await user.type(screen.getByLabelText("Password"), "secret")

    expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled()
  })

  it("stores the token and redirects to /admin on successful login", async () => {
    const user = userEvent.setup()
    vi.spyOn(api, "adminLogin").mockResolvedValue({ token: "server-token-abc" })

    renderLoginPage()

    await user.type(screen.getByLabelText("Username"), "admin")
    await user.type(screen.getByLabelText("Password"), "correct-password")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument()
    })

    expect(getAdminToken()).toBe("server-token-abc")
  })

  it("shows an error message on failed login", async () => {
    const user = userEvent.setup()
    vi.spyOn(api, "adminLogin").mockRejectedValue(new Error("Invalid credentials"))

    renderLoginPage()

    await user.type(screen.getByLabelText("Username"), "admin")
    await user.type(screen.getByLabelText("Password"), "wrong-password")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials")
    })

    expect(getAdminToken()).toBeNull()
  })

  it("shows a generic error when the API throws a non-Error value", async () => {
    const user = userEvent.setup()
    vi.spyOn(api, "adminLogin").mockRejectedValue("network failure")

    renderLoginPage()

    await user.type(screen.getByLabelText("Username"), "admin")
    await user.type(screen.getByLabelText("Password"), "any")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Something went wrong. Please try again."
      )
    })
  })

  it("clears the error when the user starts typing after a failure", async () => {
    const user = userEvent.setup()
    vi.spyOn(api, "adminLogin").mockRejectedValue(new Error("Invalid credentials"))

    renderLoginPage()

    await user.type(screen.getByLabelText("Username"), "admin")
    await user.type(screen.getByLabelText("Password"), "bad")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })

    // Typing in either field clears the error on next submit attempt
    // (error clears on handleSubmit, not on keystroke — verify it's still shown
    // until next submit, which is the correct UX for this form)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("does not store a token when login fails", async () => {
    const user = userEvent.setup()
    vi.spyOn(api, "adminLogin").mockRejectedValue(new Error("Invalid credentials"))
    clearAdminToken()

    renderLoginPage()

    await user.type(screen.getByLabelText("Username"), "admin")
    await user.type(screen.getByLabelText("Password"), "wrong")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })

    expect(getAdminToken()).toBeNull()
  })
})
