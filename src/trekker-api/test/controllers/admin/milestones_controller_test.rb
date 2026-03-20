require "test_helper"

module Admin
  class MilestonesControllerTest < ActionDispatch::IntegrationTest
    VALID_RAW_TOKEN = "validtoken_abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"

    def auth_headers
      { "Authorization" => "Bearer #{VALID_RAW_TOKEN}" }
    end

    # -------------------------------------------------------------------------
    # POST /admin/milestones — happy path
    # -------------------------------------------------------------------------

    test "creates a milestone and returns 201" do
      assert_difference "Milestone.count", 1 do
        post admin_milestones_path,
             params: { name: "Tokyo", milestone_type: "city", mile_marker: 9000 },
             headers: auth_headers,
             as: :json
      end

      assert_response :created
      body = JSON.parse(response.body)
      assert_equal "Tokyo", body["milestone"]["name"]
      assert_equal "city",  body["milestone"]["milestone_type"]
      assert_in_delta 9000.0, body["milestone"]["mile_marker"], 0.001
    end

    test "response includes all expected fields" do
      post admin_milestones_path,
           params: { name: "Paris", milestone_type: "city", mile_marker: 7500,
                     description: "The City of Light", fun_fact: "Home of the Eiffel Tower" },
           headers: auth_headers,
           as: :json

      body = JSON.parse(response.body)["milestone"]
      assert body.key?("id")
      assert body.key?("triggered")
      assert body.key?("triggered_at")
      assert_equal "The City of Light",       body["description"]
      assert_equal "Home of the Eiffel Tower", body["fun_fact"]
    end

    test "creates milestone with optional fields omitted" do
      post admin_milestones_path,
           params: { name: "Athens", milestone_type: "city", mile_marker: 8000 },
           headers: auth_headers,
           as: :json

      assert_response :created
    end

    test "milestone is immediately triggered when mile_marker is below current total" do
      # Fixture total is ~2072 miles. A marker of 500 is already crossed.
      post admin_milestones_path,
           params: { name: "Tijuana", milestone_type: "city", mile_marker: 500 },
           headers: auth_headers,
           as: :json

      assert_response :created
      body = JSON.parse(response.body)
      assert body["milestone"]["triggered"],
             "Expected milestone to be triggered immediately when below current total"
    end

    test "milestone is not triggered when mile_marker is above current total" do
      post admin_milestones_path,
           params: { name: "Far Away", milestone_type: "city", mile_marker: 19_000 },
           headers: auth_headers,
           as: :json

      assert_response :created
      body = JSON.parse(response.body)
      assert_not body["milestone"]["triggered"]
    end

    # -------------------------------------------------------------------------
    # POST /admin/milestones — validation failures
    # -------------------------------------------------------------------------

    test "returns 422 when name is blank" do
      post admin_milestones_path,
           params: { name: "", milestone_type: "city", mile_marker: 5000 },
           headers: auth_headers,
           as: :json

      assert_response :unprocessable_entity
      assert JSON.parse(response.body).key?("errors")
    end

    test "returns 422 when milestone_type is invalid" do
      post admin_milestones_path,
           params: { name: "Somewhere", milestone_type: "landmark", mile_marker: 5000 },
           headers: auth_headers,
           as: :json

      assert_response :unprocessable_entity
    end

    test "returns 422 when mile_marker is missing" do
      post admin_milestones_path,
           params: { name: "Somewhere", milestone_type: "city" },
           headers: auth_headers,
           as: :json

      assert_response :unprocessable_entity
    end

    # -------------------------------------------------------------------------
    # Authentication
    # -------------------------------------------------------------------------

    test "returns 401 without a Bearer token" do
      post admin_milestones_path,
           params: { name: "Tokyo", milestone_type: "city", mile_marker: 9000 },
           as: :json

      assert_response :unauthorized
    end

    test "returns 401 with an invalid token" do
      post admin_milestones_path,
           params: { name: "Tokyo", milestone_type: "city", mile_marker: 9000 },
           headers: { "Authorization" => "Bearer bogus" },
           as: :json

      assert_response :unauthorized
    end
  end
end
