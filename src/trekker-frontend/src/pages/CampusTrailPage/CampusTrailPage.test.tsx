import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as api from "../../lib/api"
import CampusTrailPage from "./CampusTrailPage"

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_RESPONSE = {
  campus_trail: [
    {
      site: "Trace East",
      miles: 1500.0,
      milestone: "Trace East has walked as far as Charlotte, NC",
      milestone_location: "Charlotte, NC",
      coordinates: { lat: 35.2271, lng: -80.8431 },
    },
    {
      site: "Trace North",
      miles: 800.0,
      milestone: "Trace North has reached Nashville, TN",
      milestone_location: "Nashville, TN",
      coordinates: { lat: 36.1627, lng: -86.7816 },
    },
    {
      site: "Trace South",
      miles: 200.0,
      milestone: "Trace South has walked as far as Phoenix, AZ",
      milestone_location: "Phoenix, AZ",
      coordinates: { lat: 33.4484, lng: -112.074 },
    },
    {
      site: "Trace West",
      miles: 0.0,
      milestone: "Trace West is just getting started",
      milestone_location: "San Diego, CA",
      coordinates: { lat: 32.7157, lng: -117.1611 },
    },
  ],
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <MemoryRouter>
      <CampusTrailPage />
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CampusTrailPage", () => {
  beforeEach(() => {
    vi.spyOn(api, "getCampusTrail").mockResolvedValue(MOCK_RESPONSE)
  })

  it("renders the Campus Trail heading", () => {
    renderPage()
    expect(screen.getByText("Campus Trail")).toBeInTheDocument()
  })

  it("renders the page subtitle", () => {
    renderPage()
    expect(screen.getByText("Every mile moves us forward.")).toBeInTheDocument()
  })

  it("renders the page root element", () => {
    renderPage()
    expect(screen.getByTestId("campus-trail-page")).toBeInTheDocument()
  })

  it("shows all four campus names after data loads", async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("Trace East")).toBeInTheDocument()
    })
    expect(screen.getByText("Trace North")).toBeInTheDocument()
    expect(screen.getByText("Trace South")).toBeInTheDocument()
    expect(screen.getByText("Trace West")).toBeInTheDocument()
  })

  it("shows the milestone narrative text for each campus", async () => {
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText("Trace East has walked as far as Charlotte, NC")
      ).toBeInTheDocument()
    })
    expect(
      screen.getByText("Trace North has reached Nashville, TN")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Trace South has walked as far as Phoenix, AZ")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Trace West is just getting started")
    ).toBeInTheDocument()
  })

  it("shows 'miles logged' label for each card", async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("Trace East")).toBeInTheDocument()
    })
    const labels = screen.getAllByText("miles logged")
    expect(labels).toHaveLength(4)
  })

  it("shows error state and retry button on fetch failure", async () => {
    vi.spyOn(api, "getCampusTrail").mockRejectedValue(new Error("Network error"))
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText("Could not load campus trail data.")
      ).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
  })

  it("does not render any rank or position labels", async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("Trace East")).toBeInTheDocument()
    })
    expect(screen.queryByText(/rank/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/1st/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/2nd/i)).not.toBeInTheDocument()
  })
})
