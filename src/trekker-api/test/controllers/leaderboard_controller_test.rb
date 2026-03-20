require "test_helper"

class LeaderboardControllerTest < ActionDispatch::IntegrationTest
  # -------------------------------------------------------------------------
  # GET /leaderboard — response structure
  # -------------------------------------------------------------------------

  test "returns 200" do
    get leaderboard_path
    assert_response :ok
  end

  test "response includes leaderboard array with exactly 4 entries" do
    get leaderboard_path
    body = JSON.parse(response.body)
    assert_equal 4, body["leaderboard"].length
  end

  test "each leaderboard entry has required fields" do
    get leaderboard_path
    body = JSON.parse(response.body)

    body["leaderboard"].each do |entry|
      assert entry.key?("rank"),         "missing rank"
      assert entry.key?("site"),         "missing site"
      assert entry.key?("display_name"), "missing display_name"
      assert entry.key?("total_miles"),  "missing total_miles"
    end
  end

  test "all four sites are present in the response" do
    get leaderboard_path
    sites = JSON.parse(response.body)["leaderboard"].map { |e| e["site"] }
    assert_includes sites, "trace_north"
    assert_includes sites, "trace_south"
    assert_includes sites, "trace_east"
    assert_includes sites, "trace_west"
  end

  test "display_names are human-readable" do
    get leaderboard_path
    body = JSON.parse(response.body)
    entry = body["leaderboard"].find { |e| e["site"] == "trace_north" }
    assert_equal "Trace North", entry["display_name"]
  end

  test "response includes total_site_miles" do
    get leaderboard_path
    body = JSON.parse(response.body)
    assert body.key?("total_site_miles")
    assert_kind_of Numeric, body["total_site_miles"]
  end

  # -------------------------------------------------------------------------
  # GET /leaderboard — ranking and totals
  # -------------------------------------------------------------------------

  test "trace_north ranks above trace_south given fixture data" do
    get leaderboard_path
    body = JSON.parse(response.body)
    north = body["leaderboard"].find { |e| e["site"] == "trace_north" }
    south = body["leaderboard"].find { |e| e["site"] == "trace_south" }
    assert north["rank"] < south["rank"]
  end

  test "trace_north total_miles reflects fixture data (20 miles)" do
    get leaderboard_path
    body = JSON.parse(response.body)
    north = body["leaderboard"].find { |e| e["site"] == "trace_north" }
    assert_in_delta 20.0, north["total_miles"], 0.01
  end

  test "sites with no submissions have total_miles of 0.0" do
    get leaderboard_path
    body = JSON.parse(response.body)
    east = body["leaderboard"].find { |e| e["site"] == "trace_east" }
    west = body["leaderboard"].find { |e| e["site"] == "trace_west" }
    assert_equal 0.0, east["total_miles"]
    assert_equal 0.0, west["total_miles"]
  end

  test "leaderboard is ordered by total_miles descending" do
    get leaderboard_path
    miles = JSON.parse(response.body)["leaderboard"].map { |e| e["total_miles"] }
    assert_equal miles.sort.reverse, miles
  end

  test "untagged submissions do not appear in total_site_miles" do
    get leaderboard_path
    body = JSON.parse(response.body)
    # Fixtures have 20 (north) + 10 (south) = 30 site-tagged miles.
    # Untagged fixtures (miles_submission 10.0, steps_submission 2.0, etc.) should not count.
    assert_in_delta 30.0, body["total_site_miles"], 0.01
  end

  # -------------------------------------------------------------------------
  # GET /leaderboard — no auth required
  # -------------------------------------------------------------------------

  test "does not require an Authorization header" do
    get leaderboard_path
    assert_response :ok
  end
end
