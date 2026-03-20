require "test_helper"

class SubmissionsControllerTest < ActionDispatch::IntegrationTest
  # ---------------------------------------------------------------------------
  # POST /submissions — happy path
  # ---------------------------------------------------------------------------

  test "creates a miles submission and returns 201" do
    assert_difference "Submission.count", 1 do
      post submissions_path,
           params: { submission: { name: "Jess", activity_date: "2026-02-01",
                                   input_type: "miles", input_value: 3.5 } },
           as: :json
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "Jess", body["submission"]["name"]
    assert_in_delta 3.5, body["submission"]["converted_miles"], 0.001
    assert_equal false, body["submission"]["imported"]
    assert_equal false, body["submission"]["flagged"]
  end

  test "creates a steps submission and converts to miles" do
    post submissions_path,
         params: { submission: { name: "Morning Walkers", activity_date: "2026-02-01",
                                 input_type: "steps", input_value: 7500 } },
         as: :json

    assert_response :created
    body = JSON.parse(response.body)
    assert_in_delta 3.0, body["submission"]["converted_miles"], 0.001
    assert_equal 7500.0, body["submission"]["input_value"]
  end

  test "response includes triggered_milestones key" do
    post submissions_path,
         params: { submission: { name: "Test", activity_date: "2026-02-01",
                                 input_type: "miles", input_value: 1.0 } },
         as: :json

    body = JSON.parse(response.body)
    assert body.key?("triggered_milestones"), "Response must include triggered_milestones"
    assert_kind_of Array, body["triggered_milestones"]
  end

  test "sets imported to false regardless of any passed param" do
    post submissions_path,
         params: { submission: { name: "Sneaky", activity_date: "2026-02-01",
                                 input_type: "miles", input_value: 1.0,
                                 imported: true } },
         as: :json

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal false, body["submission"]["imported"]
  end

  # ---------------------------------------------------------------------------
  # POST /submissions — validation failures (422)
  # ---------------------------------------------------------------------------

  test "returns 422 when name is missing" do
    post submissions_path,
         params: { submission: { activity_date: "2026-02-01",
                                 input_type: "miles", input_value: 3.0 } },
         as: :json

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert body["errors"].key?("name")
  end

  test "returns 422 when activity_date is missing" do
    post submissions_path,
         params: { submission: { name: "Test", input_type: "miles", input_value: 3.0 } },
         as: :json

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert body["errors"].key?("activity_date")
  end

  test "returns 422 when input_type is invalid" do
    post submissions_path,
         params: { submission: { name: "Test", activity_date: "2026-02-01",
                                 input_type: "kilometers", input_value: 3.0 } },
         as: :json

    assert_response :unprocessable_entity
  end

  test "returns 422 when input_value is zero" do
    post submissions_path,
         params: { submission: { name: "Test", activity_date: "2026-02-01",
                                 input_type: "miles", input_value: 0 } },
         as: :json

    assert_response :unprocessable_entity
  end

  test "returns 422 when input_value is negative" do
    post submissions_path,
         params: { submission: { name: "Test", activity_date: "2026-02-01",
                                 input_type: "miles", input_value: -1 } },
         as: :json

    assert_response :unprocessable_entity
  end

  test "does not create a record on validation failure" do
    assert_no_difference "Submission.count" do
      post submissions_path,
           params: { submission: { name: "", activity_date: "2026-02-01",
                                   input_type: "miles", input_value: 3.0 } },
           as: :json
    end
  end

  # ---------------------------------------------------------------------------
  # POST /submissions — site field (optional)
  # ---------------------------------------------------------------------------

  test "accepts a valid site and includes it in the response" do
    post submissions_path,
         params: { submission: { name: "North Team", activity_date: "2026-03-01",
                                 input_type: "miles", input_value: 5.0,
                                 site: "trace_north" } },
         as: :json

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "trace_north", body["submission"]["site"]
  end

  test "site defaults to null when not provided" do
    post submissions_path,
         params: { submission: { name: "Anonymous", activity_date: "2026-03-01",
                                 input_type: "miles", input_value: 3.0 } },
         as: :json

    assert_response :created
    body = JSON.parse(response.body)
    assert_nil body["submission"]["site"]
  end

  test "returns 422 for an invalid site value" do
    post submissions_path,
         params: { submission: { name: "Test", activity_date: "2026-03-01",
                                 input_type: "miles", input_value: 3.0,
                                 site: "trace_central" } },
         as: :json

    assert_response :unprocessable_entity
  end

  test "response always includes the site key" do
    post submissions_path,
         params: { submission: { name: "Test", activity_date: "2026-03-01",
                                 input_type: "miles", input_value: 1.0 } },
         as: :json

    body = JSON.parse(response.body)
    assert body["submission"].key?("site")
  end

  # ---------------------------------------------------------------------------
  # POST /submissions — no auth required (public endpoint)
  # ---------------------------------------------------------------------------

  test "does not require an Authorization header" do
    post submissions_path,
         params: { submission: { name: "Anyone", activity_date: "2026-02-01",
                                 input_type: "miles", input_value: 2.0 } },
         as: :json

    assert_response :created
  end
end
