require "test_helper"

class StatsControllerTest < ActionDispatch::IntegrationTest
  # ---------------------------------------------------------------------------
  # GET /stats — happy path
  # ---------------------------------------------------------------------------

  test "returns 200 with total_miles, current_position, and next_milestone" do
    get stats_path, as: :json

    assert_response :ok
    body = JSON.parse(response.body)

    assert body.key?("total_miles"),      "Response must include total_miles"
    assert body.key?("current_position"), "Response must include current_position"
    assert body.key?("next_milestone"),   "Response must include next_milestone"
  end

  test "total_miles equals the sum of all converted_miles" do
    # Fixture total: 10 + 2 + 5 + 2025 = 2042
    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_in_delta 2042.0, body["total_miles"], 0.001
  end

  test "current_position equals total_miles" do
    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_equal body["total_miles"], body["current_position"]
  end

  test "next_milestone returns the lowest untriggered milestone" do
    get stats_path, as: :json

    body = JSON.parse(response.body)
    next_m = body["next_milestone"]
    assert_not_nil next_m
    # near_milestone (Mexico, 100.0) is the lowest untriggered marker
    assert_equal "Mexico", next_m["name"]
    assert_equal "country", next_m["milestone_type"]
  end

  test "next_milestone includes miles_remaining" do
    get stats_path, as: :json

    body = JSON.parse(response.body)
    next_m = body["next_milestone"]
    assert next_m.key?("miles_remaining")
    # Total is 2042, near_milestone is at 100 — miles_remaining should be 0
    # because total already exceeds the marker (not yet triggered in fixture)
    assert_operator next_m["miles_remaining"], :>=, 0
  end

  test "next_milestone is null when all milestones are triggered" do
    Milestone.update_all(triggered: true, triggered_at: Time.current)

    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_nil body["next_milestone"]
  end

  test "total_miles is 0.0 when there are no submissions" do
    Submission.delete_all

    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_equal 0.0, body["total_miles"]
  end

  # ---------------------------------------------------------------------------
  # GET /stats — no auth required (public endpoint)
  # ---------------------------------------------------------------------------

  test "does not require an Authorization header" do
    get stats_path, as: :json
    assert_response :ok
  end
end
