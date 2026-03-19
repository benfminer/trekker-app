import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AdminRoute } from "./AdminRoute"
import { clearAdminToken, setAdminToken } from "../../lib/auth"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
        </Route>
        <Route path="/admin/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AdminRoute", () => {
  afterEach(() => {
    localStorage.clear()
  })

  it("renders the protected content when a token is present", () => {
    setAdminToken("valid-token")
    renderWithRouter("/admin")
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument()
  })

  it("redirects to /admin/login when no token is present", () => {
    clearAdminToken()
    renderWithRouter("/admin")
    expect(screen.getByText("Login Page")).toBeInTheDocument()
    expect(screen.queryByText("Admin Dashboard")).not.toBeInTheDocument()
  })

  it("redirects after an existing token is cleared", () => {
    setAdminToken("was-valid")
    clearAdminToken()
    renderWithRouter("/admin")
    expect(screen.getByText("Login Page")).toBeInTheDocument()
  })
})
