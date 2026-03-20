require "test_helper"

class StatsControllerTest < ActionDispatch::IntegrationTest
  # ---------------------------------------------------------------------------
  # GET /stats — response shape
  # ---------------------------------------------------------------------------

  test "returns 200 with all required top-level keys" do
    get stats_path, as: :json

    assert_response :ok
    body = JSON.parse(response.body)

    %w[total_miles submission_count goal_miles percent_complete
       current_position next_milestone triggered_milestones].each do |key|
      assert body.key?(key), "Response must include #{key}"
    end
  end

  # ---------------------------------------------------------------------------
  # GET /stats — total_miles and current_position
  # ---------------------------------------------------------------------------

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

  test "total_miles is 0.0 when there are no submissions" do
    Submission.delete_all

    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_equal 0.0, body["total_miles"]
  end

  # ---------------------------------------------------------------------------
  # GET /stats — submission_count
  # ---------------------------------------------------------------------------

  test "submission_count equals the number of submission records" do
    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_equal Submission.count, body["submission_count"]
  end

  test "submission_count is 0 when there are no submissions" do
    Submission.delete_all

    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_equal 0, body["submission_count"]
  end

  # ---------------------------------------------------------------------------
  # GET /stats — goal_miles and percent_complete
  # ---------------------------------------------------------------------------

  test "goal_miles is always 20286" do
    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_equal 20_286.0, body["goal_miles"]
  end

  test "percent_complete is total_miles / 20286 * 100 rounded to 2 decimals" do
    get stats_path, as: :json

    body = JSON.parse(response.body)
    expected = (2042.0 / 20_286.0 * 100).round(2)
    assert_in_delta expected, body["percent_complete"], 0.01
  end

  test "percent_complete is 0.0 when there are no submissions" do
    Submission.delete_all

    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_equal 0.0, body["percent_complete"]
  end

  # ---------------------------------------------------------------------------
  # GET /stats — next_milestone
  # ---------------------------------------------------------------------------

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
    assert next_m.key?("miles_remaining"), "next_milestone must include miles_remaining"
    # Total is 2042, marker is at 100 — total already exceeds marker, so miles_remaining is 0
    assert_operator next_m["miles_remaining"], :>=, 0
  end

  test "miles_remaining is 0 when the group has already passed the next marker" do
    # Fixture total 2042 > near_milestone marker of 100
    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_equal 0.0, body["next_milestone"]["miles_remaining"]
  end

  test "miles_remaining is positive when the group has not yet reached the marker" do
    Submission.delete_all

    get stats_path, as: :json

    body = JSON.parse(response.body)
    # With 0 miles, nearest marker is 100 — miles_remaining should be 100
    assert_in_delta 100.0, body["next_milestone"]["miles_remaining"], 0.001
  end

  test "next_milestone is null when all milestones are triggered" do
    Milestone.update_all(triggered: true, triggered_at: Time.current)

    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_nil body["next_milestone"]
  end

  # ---------------------------------------------------------------------------
  # GET /stats — triggered_milestones
  # ---------------------------------------------------------------------------

  test "triggered_milestones is an array" do
    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_kind_of Array, body["triggered_milestones"]
  end

  test "triggered_milestones contains only triggered milestones" do
    get stats_path, as: :json

    body = JSON.parse(response.body)
    # Fixtures: only already_triggered (San Diego Start) is triggered
    assert_equal 1, body["triggered_milestones"].length
    assert_equal "San Diego Start", body["triggered_milestones"].first["name"]
  end

  test "triggered_milestones includes required fields" do
    get stats_path, as: :json

    body = JSON.parse(response.body)
    milestone = body["triggered_milestones"].first
    %w[id name milestone_type mile_marker triggered_at].each do |key|
      assert milestone.key?(key), "triggered_milestone must include #{key}"
    end
  end

  test "triggered_milestones is ordered by mile_marker ascending" do
    Milestone.update_all(triggered: true, triggered_at: Time.current)

    get stats_path, as: :json

    body = JSON.parse(response.body)
    markers = body["triggered_milestones"].map { |m| m["mile_marker"] }
    assert_equal markers, markers.sort
  end

  test "triggered_milestones is empty when no milestones have been triggered" do
    Milestone.update_all(triggered: false, triggered_at: nil)

    get stats_path, as: :json

    body = JSON.parse(response.body)
    assert_empty body["triggered_milestones"]
  end

  # ---------------------------------------------------------------------------
  # GET /stats — no auth required (public endpoint)
  # ---------------------------------------------------------------------------

  test "does not require an Authorization header" do
    get stats_path, as: :json
    assert_response :ok
  end
end
