import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as api from "../../lib/api"
import LeaderboardPage from "./LeaderboardPage"

const MOCK_RESPONSE = {
  leaderboard: [
    { rank: 1, site: "trace_north" as const, display_name: "Trace North", total_miles: 120.5 },
    { rank: 2, site: "trace_south" as const, display_name: "Trace South", total_miles: 80.0 },
    { rank: 3, site: "trace_east"  as const, display_name: "Trace East",  total_miles: 45.0 },
    { rank: 4, site: "trace_west"  as const, display_name: "Trace West",  total_miles: 0.0  },
  ],
  total_site_miles: 245.5,
  updated_at: "2026-03-20T10:00:00.000Z",
}

function renderPage() {
  return render(
    <MemoryRouter>
      <LeaderboardPage />
    </MemoryRouter>
  )
}

describe("LeaderboardPage", () => {
  beforeEach(() => {
    vi.spyOn(api, "getLeaderboard").mockResolvedValue(MOCK_RESPONSE)
  })

  it("renders the leaderboard heading", () => {
    renderPage()
    expect(screen.getByText("Leaderboard")).toBeInTheDocument()
  })

  it("shows all four campus names after load", async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("Trace North")).toBeInTheDocument()
    })
    expect(screen.getByText("Trace South")).toBeInTheDocument()
    expect(screen.getByText("Trace East")).toBeInTheDocument()
    expect(screen.getByText("Trace West")).toBeInTheDocument()
  })

  it("shows rank labels for each entry", async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("Rank 1")).toBeInTheDocument()
    })
    expect(screen.getByText("Rank 4")).toBeInTheDocument()
  })

  it("shows combined campus miles footer", async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("combined campus miles")).toBeInTheDocument()
    })
  })

  it("shows error state and retry button on fetch failure", async () => {
    vi.spyOn(api, "getLeaderboard").mockRejectedValue(new Error("Network error"))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("Could not load leaderboard data.")).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
  })
})
