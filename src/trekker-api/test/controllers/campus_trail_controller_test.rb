require "test_helper"

class CampusTrailControllerTest < ActionDispatch::IntegrationTest
  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  def submission_attrs(overrides = {})
    {
      name:          "Test User",
      activity_date: "2026-03-01",
      input_type:    "miles",
      input_value:   10.0
    }.merge(overrides)
  end

  # ---------------------------------------------------------------------------
  # Setup / teardown
  # ---------------------------------------------------------------------------

  setup do
    Submission.delete_all

    # Trace North — 200 miles (should reach Phoenix, AZ at the 140-mile waypoint)
    Submission.create!(submission_attrs(input_value: 200.0, site: "trace_north"))

    # Trace South — 50 miles (should still be at San Diego, the 0-mile waypoint)
    Submission.create!(submission_attrs(input_value: 50.0, site: "trace_south"))

    # Trace East — three entries totaling 1,500 miles (should reach Charlotte, NC at 1,400)
    Submission.create!(submission_attrs(input_value: 500.0, site: "trace_east"))
    Submission.create!(submission_attrs(input_value: 500.0, site: "trace_east"))
    Submission.create!(submission_attrs(input_value: 500.0, site: "trace_east"))

    # Trace West — 0 miles (no submissions — should return San Diego starting point)

    # Untagged submission — must NOT appear in campus trail totals
    Submission.create!(submission_attrs(input_value: 500.0, site: nil))
  end

  # ---------------------------------------------------------------------------
  # GET /campus_trail — response shape
  # ---------------------------------------------------------------------------

  test "returns 200" do
    get campus_trail_path
    assert_response :ok
  end

  test "response includes campus_trail array with exactly 4 entries" do
    get campus_trail_path
    body = JSON.parse(response.body)
    assert_equal 4, body["campus_trail"].length
  end

  test "each entry has all required fields" do
    get campus_trail_path
    body = JSON.parse(response.body)

    body["campus_trail"].each do |entry|
      assert entry.key?("site"),               "missing site"
      assert entry.key?("miles"),              "missing miles"
      assert entry.key?("milestone"),          "missing milestone"
      assert entry.key?("milestone_location"), "missing milestone_location"
      assert entry.key?("coordinates"),        "missing coordinates"
      assert entry["coordinates"].key?("lat"), "coordinates missing lat"
      assert entry["coordinates"].key?("lng"), "coordinates missing lng"
    end
  end

  test "all four campus display names are present" do
    get campus_trail_path
    sites = JSON.parse(response.body)["campus_trail"].map { |e| e["site"] }
    assert_includes sites, "Trace North"
    assert_includes sites, "Trace South"
    assert_includes sites, "Trace East"
    assert_includes sites, "Trace West"
  end

  test "entries are sorted alphabetically by site name" do
    get campus_trail_path
    sites = JSON.parse(response.body)["campus_trail"].map { |e| e["site"] }
    assert_equal sites.sort, sites
  end

  # ---------------------------------------------------------------------------
  # GET /campus_trail — mile totals per site
  # ---------------------------------------------------------------------------

  test "trace_north total miles reflects its submissions" do
    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace North" }
    assert_in_delta 200.0, entry["miles"], 0.01
  end

  test "trace_south total miles reflects its submissions" do
    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace South" }
    assert_in_delta 50.0, entry["miles"], 0.01
  end

  test "trace_east total miles sums across multiple submissions" do
    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace East" }
    assert_in_delta 1500.0, entry["miles"], 0.01
  end

  test "site with no submissions has miles of 0.0" do
    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace West" }
    assert_equal 0.0, entry["miles"]
  end

  test "untagged submissions do not appear in any site total" do
    get campus_trail_path
    total = JSON.parse(response.body)["campus_trail"].sum { |e| e["miles"] }
    # Only tagged miles: 200 + 50 + 1500 = 1750. The 500 untagged miles must not appear.
    assert_in_delta 1750.0, total, 0.01
  end

  # ---------------------------------------------------------------------------
  # GET /campus_trail — milestone lookup logic
  # ---------------------------------------------------------------------------

  test "trace_north milestone reflects 200 miles (past Phoenix at 140, not yet Albuquerque at 350)" do
    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace North" }
    assert_equal "Phoenix, AZ", entry["milestone_location"]
  end

  test "site with zero miles returns San Diego as the starting milestone" do
    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace West" }
    assert_equal "San Diego, CA", entry["milestone_location"]
  end

  test "trace_east milestone reflects 1500 miles (past Atlanta at 1400, not yet Charlotte at 1650)" do
    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace East" }
    assert_equal "Atlanta, GA", entry["milestone_location"]
  end

  test "milestone narrative is a human-readable string" do
    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace North" }
    assert_match(/Trace North has walked as far as/, entry["milestone"])
    assert_match(/Phoenix, AZ/, entry["milestone"])
  end

  test "milestone_location appears in the milestone narrative string" do
    get campus_trail_path
    JSON.parse(response.body)["campus_trail"].each do |entry|
      assert_includes entry["milestone"], entry["milestone_location"],
        "milestone narrative for #{entry['site']} should include milestone_location"
    end
  end

  test "coordinates are numeric lat/lng for the milestone location" do
    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace North" }
    # Phoenix, AZ is lat ~33.45, lng ~-112.07
    assert_in_delta  33.4484, entry["coordinates"]["lat"], 0.01
    assert_in_delta -112.074, entry["coordinates"]["lng"], 0.01
  end

  # ---------------------------------------------------------------------------
  # GET /campus_trail — milestone boundary cases
  # ---------------------------------------------------------------------------

  test "site at exactly a waypoint mile marker lands on that waypoint" do
    Submission.delete_all
    # 140 miles lands exactly on the Phoenix waypoint
    Submission.create!(submission_attrs(input_value: 140.0, site: "trace_north"))

    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace North" }
    assert_equal "Phoenix, AZ", entry["milestone_location"]
  end

  test "site one mile before a waypoint lands on the previous waypoint" do
    Submission.delete_all
    # 139 miles is just before Phoenix (140) — should still show San Diego (0)
    Submission.create!(submission_attrs(input_value: 139.0, site: "trace_north"))

    get campus_trail_path
    entry = JSON.parse(response.body)["campus_trail"].find { |e| e["site"] == "Trace North" }
    assert_equal "San Diego, CA", entry["milestone_location"]
  end

  # ---------------------------------------------------------------------------
  # GET /campus_trail — no auth required
  # ---------------------------------------------------------------------------

  test "does not require an Authorization header" do
    get campus_trail_path
    assert_response :ok
  end
end
