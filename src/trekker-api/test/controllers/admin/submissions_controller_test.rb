require "test_helper"

module Admin
  class SubmissionsControllerTest < ActionDispatch::IntegrationTest
    VALID_RAW_TOKEN = "validtoken_abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"

    def auth_header
      { "Authorization" => "Bearer #{VALID_RAW_TOKEN}" }
    end

    # -------------------------------------------------------------------------
    # GET /admin/submissions — index
    # -------------------------------------------------------------------------

    test "returns 200 with paginated submissions when authenticated" do
      get admin_submissions_path, headers: auth_header, as: :json

      assert_response :ok
      body = JSON.parse(response.body)
      assert body.key?("submissions")
      assert body.key?("meta")
      assert body["meta"].key?("total_count")
      assert body["meta"].key?("total_pages")
    end

    test "returns submissions sorted by activity_date descending" do
      get admin_submissions_path, headers: auth_header, as: :json

      body = JSON.parse(response.body)
      dates = body["submissions"].map { |s| Date.parse(s["activity_date"]) }
      assert_equal dates, dates.sort.reverse
    end

    test "defaults to 50 records per page" do
      get admin_submissions_path, headers: auth_header, as: :json

      body = JSON.parse(response.body)
      assert_equal 50, body["meta"]["per_page"]
    end

    test "accepts custom per_page param" do
      get admin_submissions_path, params: { per_page: 2 }, headers: auth_header

      body = JSON.parse(response.body)
      assert_equal 2, body["meta"]["per_page"]
      assert body["submissions"].length <= 2
    end

    test "filter imported=true returns only imported submissions" do
      get admin_submissions_path, params: { imported: "true" }, headers: auth_header

      body = JSON.parse(response.body)
      assert body["submissions"].all? { |s| s["imported"] == true }
    end

    test "filter imported=false returns only non-imported submissions" do
      get admin_submissions_path, params: { imported: "false" }, headers: auth_header

      body = JSON.parse(response.body)
      assert body["submissions"].all? { |s| s["imported"] == false }
    end

    test "no imported filter returns all submissions" do
      get admin_submissions_path, headers: auth_header, as: :json

      body = JSON.parse(response.body)
      assert_equal Submission.count, body["meta"]["total_count"]
    end

    test "filter flagged=true returns only flagged submissions" do
      get admin_submissions_path, params: { flagged: "true" }, headers: auth_header

      body = JSON.parse(response.body)
      assert body["submissions"].all? { |s| s["flagged"] == true }
      # Fixtures: only flagged_submission is flagged
      assert_equal 1, body["meta"]["total_count"]
    end

    test "filter flagged=false returns only unflagged submissions" do
      get admin_submissions_path, params: { flagged: "false" }, headers: auth_header

      body = JSON.parse(response.body)
      assert body["submissions"].all? { |s| s["flagged"] == false }
    end

    test "no flagged filter returns all submissions regardless of flag status" do
      get admin_submissions_path, headers: auth_header, as: :json

      body = JSON.parse(response.body)
      assert_equal Submission.count, body["meta"]["total_count"]
    end

    test "search filters by name case-insensitively" do
      # Fixture: miles_submission has name "Wayne Amo"
      get admin_submissions_path, params: { search: "wayne" }, headers: auth_header

      body = JSON.parse(response.body)
      assert_equal 1, body["meta"]["total_count"]
      assert_equal "Wayne Amo", body["submissions"].first["name"]
    end

    test "search returns multiple matches when several names contain the term" do
      # Fixture: "Linda Vista Class" and others — search for a common substring
      get admin_submissions_path, params: { search: "Linda" }, headers: auth_header

      body = JSON.parse(response.body)
      assert_equal 1, body["meta"]["total_count"]
      assert_equal "Linda Vista Class", body["submissions"].first["name"]
    end

    test "search returns empty results when no name matches" do
      get admin_submissions_path, params: { search: "xyznotfound" }, headers: auth_header

      body = JSON.parse(response.body)
      assert_equal 0, body["meta"]["total_count"]
      assert_empty body["submissions"]
    end

    test "search can be combined with flagged filter" do
      # flagged_submission has name "Ecc" and is flagged
      get admin_submissions_path,
          params: { search: "Ecc", flagged: "true" },
          headers: auth_header

      body = JSON.parse(response.body)
      assert_equal 1, body["meta"]["total_count"]
      assert body["submissions"].first["flagged"]
    end

    test "returns 401 without Authorization header" do
      get admin_submissions_path, as: :json
      assert_response :unauthorized
    end

    test "returns 401 with invalid token" do
      get admin_submissions_path,
          headers: { "Authorization" => "Bearer bogustoken" },
          as: :json
      assert_response :unauthorized
    end

    # -------------------------------------------------------------------------
    # PATCH /admin/submissions/:id — update
    # -------------------------------------------------------------------------

    test "updates a submission and returns 200" do
      sub = submissions(:miles_submission)
      patch admin_submission_path(sub),
            params: { submission: { name: "Updated Name" } },
            headers: auth_header,
            as: :json

      assert_response :ok
      body = JSON.parse(response.body)
      assert_equal "Updated Name", body["submission"]["name"]
    end

    test "recalculates converted_miles when input_value changes" do
      sub = submissions(:miles_submission)
      patch admin_submission_path(sub),
            params: { submission: { input_type: "miles", input_value: 20.0 } },
            headers: auth_header,
            as: :json

      assert_response :ok
      body = JSON.parse(response.body)
      assert_in_delta 20.0, body["submission"]["converted_miles"], 0.001
    end

    test "recalculates converted_miles when input_type changes to steps" do
      sub = submissions(:miles_submission)
      patch admin_submission_path(sub),
            params: { submission: { input_type: "steps", input_value: 5000.0 } },
            headers: auth_header,
            as: :json

      assert_response :ok
      body = JSON.parse(response.body)
      assert_in_delta 2.0, body["submission"]["converted_miles"], 0.001
    end

    test "returns 422 when update params are invalid" do
      sub = submissions(:miles_submission)
      patch admin_submission_path(sub),
            params: { submission: { name: "" } },
            headers: auth_header,
            as: :json

      assert_response :unprocessable_entity
      body = JSON.parse(response.body)
      assert body.key?("errors")
    end

    test "returns 404 for a non-existent submission" do
      patch admin_submission_path(id: 9999999),
            params: { submission: { name: "Ghost" } },
            headers: auth_header,
            as: :json

      assert_response :not_found
    end

    test "update returns 401 without auth" do
      sub = submissions(:miles_submission)
      patch admin_submission_path(sub),
            params: { submission: { name: "Hack" } },
            as: :json

      assert_response :unauthorized
    end

    # -------------------------------------------------------------------------
    # DELETE /admin/submissions/:id — destroy
    # -------------------------------------------------------------------------

    test "hard-deletes a submission and returns 204" do
      sub = submissions(:miles_submission)
      assert_difference "Submission.count", -1 do
        delete admin_submission_path(sub), headers: auth_header
      end

      assert_response :no_content
    end

    test "returns 404 when deleting a non-existent submission" do
      delete admin_submission_path(id: 9999999), headers: auth_header
      assert_response :not_found
    end

    test "delete returns 401 without auth" do
      sub = submissions(:miles_submission)
      delete admin_submission_path(sub)
      assert_response :unauthorized
    end

    # -------------------------------------------------------------------------
    # POST /admin/submissions/:id/flag — flag toggle
    # -------------------------------------------------------------------------

    test "flags an unflagged submission and returns 200" do
      sub = submissions(:miles_submission)
      assert_equal false, sub.flagged

      post flag_admin_submission_path(sub), headers: auth_header

      assert_response :ok
      sub.reload
      assert sub.flagged
    end

    test "un-flags a flagged submission" do
      sub = submissions(:flagged_submission)
      assert sub.flagged

      post flag_admin_submission_path(sub), headers: auth_header

      assert_response :ok
      sub.reload
      assert_not sub.flagged
    end

    test "flag response includes the updated submission record" do
      sub = submissions(:miles_submission)
      post flag_admin_submission_path(sub), headers: auth_header

      body = JSON.parse(response.body)
      assert body.key?("submission")
      assert body["submission"].key?("flagged")
    end

    test "flag returns 404 for a non-existent submission" do
      post flag_admin_submission_path(id: 9999999), headers: auth_header
      assert_response :not_found
    end

    test "flag returns 401 without auth" do
      sub = submissions(:miles_submission)
      post flag_admin_submission_path(sub)
      assert_response :unauthorized
    end
  end
end



