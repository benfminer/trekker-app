import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as api from "../../lib/api"
import ForgotPasswordPage from "./ForgotPasswordPage"

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>
  )
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.spyOn(api, "requestPasswordReset").mockResolvedValue(undefined)
  })

  it("renders the form", () => {
    renderPage()
    expect(screen.getByLabelText("Username")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument()
  })

  it("shows check-inbox message after submit", async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText("Username"), "benjamin")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))
    await waitFor(() => {
      expect(screen.getByText("Check your inbox")).toBeInTheDocument()
    })
  })

  it("always shows success even when the API call fails", async () => {
    vi.spyOn(api, "requestPasswordReset").mockRejectedValue(new Error("Not found"))
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText("Username"), "unknown")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))
    await waitFor(() => {
      expect(screen.getByText("Check your inbox")).toBeInTheDocument()
    })
  })
})
