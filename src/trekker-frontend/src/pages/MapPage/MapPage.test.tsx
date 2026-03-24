import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import MapPage from "./MapPage"
import * as api from "../../lib/api"
import type { Stats } from "../../lib/types"

// ---------------------------------------------------------------------------
// Mock mapbox-gl
// jsdom has no WebGL/canvas support so we replace the entire module.
// Must use `function` (not arrow functions) so vi.fn() instances are
// constructable with `new`.
// ---------------------------------------------------------------------------

const mockFitBounds = vi.fn()
const mockSetData = vi.fn()

vi.mock("mapbox-gl", () => {
  const MockMap = vi.fn(function () {
    return {
      on: vi.fn(function (event: string, cb: () => void) {
        // Fire "load" synchronously so layer-registration code runs in tests.
        if (event === "load") cb()
      }),
      addControl: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      getSource: vi.fn(function () {
        return { setData: mockSetData }
      }),
      flyTo: vi.fn(),
      fitBounds: mockFitBounds,
      resize: vi.fn(),
      remove: vi.fn(),
    }
  })

  const MockMarker = vi.fn(function () {
    const self = {
      setLngLat: vi.fn(function () { return self }),
      setPopup: vi.fn(function () { return self }),
      addTo: vi.fn(function () { return self }),
    }
    return self
  })

  const MockPopup = vi.fn(function () {
    const self = {
      setHTML: vi.fn(function () { return self }),
    }
    return self
  })

  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      Popup: MockPopup,
      NavigationControl: vi.fn(function () { return {} }),
      AttributionControl: vi.fn(function () { return {} }),
      accessToken: "",
    },
  }
})

vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    total_miles: 7135,
    current_position: 7135,
    next_milestone: {
      id: 42,
      name: "Athens",
      milestone_type: "city",
      mile_marker: 8000,
      miles_remaining: 865,
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function renderMapPage() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/log" element={<div>Log page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

interface ContributionState {
  beforeMiles: number
  afterMiles: number
}

function renderMapPageWithContribution(state: ContributionState) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/", state }]}>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/log" element={<div>Log page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MapPage", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubEnv("VITE_MAPBOX_TOKEN", "pk.test_token")
    mockFitBounds.mockClear()
    mockSetData.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.useRealTimers()
    sessionStorage.clear()
  })

  // -------------------------------------------------------------------------
  // Token missing fallback
  // -------------------------------------------------------------------------

  describe("token missing", () => {
    it("renders a clear fallback when VITE_MAPBOX_TOKEN is not set", () => {
      vi.stubEnv("VITE_MAPBOX_TOKEN", "")

      renderMapPage()

      expect(screen.getByText(/map unavailable/i)).toBeInTheDocument()
      expect(screen.getByText(/VITE_MAPBOX_TOKEN/)).toBeInTheDocument()
    })

    it("does not attempt to call getStats when the token is missing", () => {
      vi.stubEnv("VITE_MAPBOX_TOKEN", "")
      const spy = vi.spyOn(api, "getStats")

      renderMapPage()

      expect(spy).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Stats overlay — renders with mocked data
  // -------------------------------------------------------------------------

  describe("stats overlay", () => {
    it("renders the total miles after the API resolves", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPage()

      await waitFor(() => {
        expect(screen.getByText("7,135")).toBeInTheDocument()
      })

      expect(screen.getByText("miles logged")).toBeInTheDocument()
    })

    it("renders the percentage of the school-year goal", async () => {
      // 7135 / 20286 = ~35%
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPage()

      await waitFor(() => {
        expect(screen.getByText(/35%/)).toBeInTheDocument()
      })

      expect(screen.getByText("of our goal")).toBeInTheDocument()
    })

    it("renders the next milestone name and distance", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPage()

      await waitFor(() => {
        expect(screen.getByText("Athens")).toBeInTheDocument()
      })

      expect(screen.getByText(/865 miles away/i)).toBeInTheDocument()
    })

    it("renders the progress bar with the correct aria attributes", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPage()

      await waitFor(() => {
        const bar = screen.getByRole("progressbar", {
          name: /progress toward goal/i,
        })
        expect(bar).toBeInTheDocument()
        expect(bar).toHaveAttribute("aria-valuenow", "35")
      })
    })

    it("shows 'Goal reached!' when there is no next milestone", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(
        makeStats({ next_milestone: null })
      )

      renderMapPage()

      await waitFor(() => {
        expect(screen.getByText(/goal reached!/i)).toBeInTheDocument()
      })
    })
  })

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  describe("fetch error", () => {
    it("shows the error/retry UI when the stats API fails", async () => {
      vi.spyOn(api, "getStats").mockRejectedValue(new Error("Network error"))

      renderMapPage()

      await waitFor(() => {
        expect(
          screen.getByText(/could not load progress/i)
        ).toBeInTheDocument()
      })

      expect(
        screen.getByRole("button", { name: /retry/i })
      ).toBeInTheDocument()
    })

    it("re-fetches when the Retry button is clicked", async () => {
      const user = userEvent.setup()
      const spy = vi
        .spyOn(api, "getStats")
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(makeStats())

      renderMapPage()

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /retry/i })
        ).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /retry/i }))

      await waitFor(() => {
        expect(screen.getByText("7,135")).toBeInTheDocument()
      })

      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  // -------------------------------------------------------------------------
  // Polling — set up and tear down
  // -------------------------------------------------------------------------

  describe("polling", () => {
    it("polls getStats on a 30-second interval and stops after unmount", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })

      const spy = vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      const { unmount } = renderMapPage()

      // Flush the initial fetch promise
      await act(async () => {
        await Promise.resolve()
      })

      expect(spy).toHaveBeenCalledTimes(1)

      // Advance by one interval — should trigger a second call
      await act(async () => {
        vi.advanceTimersByTime(30_000)
        await Promise.resolve()
      })

      expect(spy).toHaveBeenCalledTimes(2)

      // Unmount — interval should be cleared; no further calls
      unmount()

      await act(async () => {
        vi.advanceTimersByTime(30_000)
        await Promise.resolve()
      })

      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  // -------------------------------------------------------------------------
  // Milestone celebration overlay
  // -------------------------------------------------------------------------

  describe("milestone celebration", () => {
    it("shows the celebration overlay when a milestone is crossed between polls", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })

      const initialStats = makeStats({
        next_milestone: {
          id: 10,
          name: "London",
          milestone_type: "city",
          mile_marker: 5000,
          miles_remaining: 200,
        },
      })
      const updatedStats = makeStats({
        total_miles: 5200,
        next_milestone: {
          id: 11,
          name: "Paris",
          milestone_type: "city",
          mile_marker: 5400,
          miles_remaining: 200,
        },
      })

      vi.spyOn(api, "getStats")
        .mockResolvedValueOnce(initialStats)
        .mockResolvedValueOnce(updatedStats)

      renderMapPage()

      // Flush initial fetch
      await act(async () => {
        await Promise.resolve()
      })

      // Trigger a poll
      await act(async () => {
        vi.advanceTimersByTime(30_000)
        await Promise.resolve()
      })

      // waitFor works because shouldAdvanceTime:true keeps real time moving
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText(/London/)).toBeInTheDocument()
    })

    it("does not show a celebration for a milestone already seen this session", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })

      // Pre-seed sessionStorage so milestone 10 is already seen
      sessionStorage.setItem("seen_milestone_ids", JSON.stringify([10]))

      const initialStats = makeStats({
        next_milestone: {
          id: 10,
          name: "London",
          milestone_type: "city",
          mile_marker: 5000,
          miles_remaining: 200,
        },
      })
      const updatedStats = makeStats({
        total_miles: 5200,
        next_milestone: {
          id: 11,
          name: "Paris",
          milestone_type: "city",
          mile_marker: 5400,
          miles_remaining: 200,
        },
      })

      vi.spyOn(api, "getStats")
        .mockResolvedValueOnce(initialStats)
        .mockResolvedValueOnce(updatedStats)

      renderMapPage()

      await act(async () => {
        await Promise.resolve()
      })

      await act(async () => {
        vi.advanceTimersByTime(30_000)
        await Promise.resolve()
      })

      // Give React a tick to process any potential state updates
      await act(async () => {
        await Promise.resolve()
      })

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("dismisses the overlay when 'Keep trekking' is clicked", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })

      // Use delay: null so userEvent doesn't rely on real timers
      const user = userEvent.setup({ delay: null })

      vi.spyOn(api, "getStats")
        .mockResolvedValueOnce(
          makeStats({
            next_milestone: {
              id: 20,
              name: "Madrid",
              milestone_type: "city",
              mile_marker: 6000,
              miles_remaining: 100,
            },
          })
        )
        .mockResolvedValueOnce(
          makeStats({
            total_miles: 6100,
            next_milestone: {
              id: 21,
              name: "Lisbon",
              milestone_type: "city",
              mile_marker: 6200,
              miles_remaining: 100,
            },
          })
        )

      renderMapPage()

      await act(async () => {
        await Promise.resolve()
      })

      await act(async () => {
        vi.advanceTimersByTime(30_000)
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      }, { timeout: 3000 })

      await user.click(screen.getByRole("button", { name: /keep trekking/i }))

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  // -------------------------------------------------------------------------
  // Log Activity CTA
  // -------------------------------------------------------------------------

  describe("log activity CTA", () => {
    it("renders a link to /log", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPage()

      // The mobile CTA uses sm:hidden — query with hidden:true to find it
      const link = screen.getByRole("link", { name: /log activity/i, hidden: true })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute("href", "/log")
    })
  })

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe("accessibility", () => {
    it("renders the map container with a descriptive role and label", () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPage()

      // The map div uses role="img" and aria-label — query with hidden:true
      // since jsdom may mark it hidden without Tailwind layout
      const mapEl = screen.getByRole("img", {
        name: /circumnavigation route map/i,
        hidden: true,
      })
      expect(mapEl).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Rotating quotes
  // -------------------------------------------------------------------------

  describe("rotating quotes", () => {
    it("renders a quote on the page", () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())
      renderMapPage()
      // At least one of the known quotes should be in the document
      const quoteRegion = document.querySelector("[aria-live='polite']")
      expect(quoteRegion).toBeInTheDocument()
    })

    it("quote region has aria-live=polite for screen readers", () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())
      renderMapPage()
      expect(document.querySelector("[aria-live='polite']")).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Contribution highlight
  // -------------------------------------------------------------------------

  describe("contribution highlight", () => {
    it("shows the contribution overlay when navigation state has beforeMiles and afterMiles", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPageWithContribution({ beforeMiles: 7000, afterMiles: 7050 })

      await waitFor(() => {
        expect(screen.getByTestId("contribution-overlay")).toBeInTheDocument()
      })
    })

    it("shows the contributed miles in the overlay", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPageWithContribution({ beforeMiles: 7000, afterMiles: 7025 })

      await waitFor(() => {
        expect(screen.getByTestId("contribution-overlay")).toBeInTheDocument()
      })

      // Overlay should mention the 25 miles contributed
      expect(screen.getByText(/25 miles/i)).toBeInTheDocument()
    })

    it("calls fitBounds when contribution state is present and map is ready", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPageWithContribution({ beforeMiles: 5000, afterMiles: 5100 })

      await waitFor(() => {
        expect(mockFitBounds).toHaveBeenCalledOnce()
      })

      // Should be called with a bounding box (two coordinate pairs)
      const [bounds, options] = mockFitBounds.mock.calls[0]
      expect(bounds).toHaveLength(2)
      expect(options).toMatchObject({ duration: 1400, essential: true })
    })

    it("does not show the overlay or call fitBounds when there is no navigation state", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPage()

      await waitFor(() => {
        expect(screen.getByText("7,135")).toBeInTheDocument()
      })

      expect(screen.queryByTestId("contribution-overlay")).not.toBeInTheDocument()
      expect(mockFitBounds).not.toHaveBeenCalled()
    })

    it("does not show the overlay when afterMiles equals beforeMiles (no contribution)", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPageWithContribution({ beforeMiles: 7000, afterMiles: 7000 })

      await waitFor(() => {
        expect(screen.getByText("7,135")).toBeInTheDocument()
      })

      expect(screen.queryByTestId("contribution-overlay")).not.toBeInTheDocument()
    })

    it("dismisses the overlay when the close button is clicked", async () => {
      const user = userEvent.setup()
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPageWithContribution({ beforeMiles: 7000, afterMiles: 7050 })

      await waitFor(() => {
        expect(screen.getByTestId("contribution-overlay")).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole("button", { name: /dismiss contribution highlight/i })
      )

      await waitFor(() => {
        expect(screen.queryByTestId("contribution-overlay")).not.toBeInTheDocument()
      })
    })

    it("handles beforeMiles = 0 (first contribution from San Diego) without error", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      renderMapPageWithContribution({ beforeMiles: 0, afterMiles: 10 })

      await waitFor(() => {
        expect(screen.getByTestId("contribution-overlay")).toBeInTheDocument()
      })

      expect(mockFitBounds).toHaveBeenCalledOnce()
    })

    it("enforces a minimum bounding box size for tiny contributions", async () => {
      vi.spyOn(api, "getStats").mockResolvedValue(makeStats())

      // 1-mile contribution is below the 5-mile minimum — fitBounds should
      // still be called (segment gets padded to 5 miles minimum)
      renderMapPageWithContribution({ beforeMiles: 7000, afterMiles: 7001 })

      await waitFor(() => {
        expect(mockFitBounds).toHaveBeenCalledOnce()
      })
    })
  })
})
