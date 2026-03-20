require "test_helper"

module Admin
  class SessionsControllerTest < ActionDispatch::IntegrationTest
    VALID_RAW_TOKEN = "validtoken_abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"

    # -------------------------------------------------------------------------
    # POST /admin/sessions — login
    # -------------------------------------------------------------------------

    test "login with valid credentials returns 201 and a token" do
      post admin_sessions_path, params: { username: "benjamin", password: "Password1!" },
                                as: :json

      assert_response :created
      body = JSON.parse(response.body)
      assert body["token"].present?, "Expected a token in the response body"
    end

    test "login creates an AdminSession record" do
      assert_difference "AdminSession.count", 1 do
        post admin_sessions_path, params: { username: "benjamin", password: "Password1!" },
                                  as: :json
      end
    end

    test "login with wrong password returns 401" do
      post admin_sessions_path, params: { username: "benjamin", password: "wrongpassword" },
                                as: :json

      assert_response :unauthorized
      body = JSON.parse(response.body)
      assert_equal "Invalid credentials", body["error"]
    end

    test "login with unknown username returns 401" do
      post admin_sessions_path, params: { username: "nobody", password: "Password1!" },
                                as: :json

      assert_response :unauthorized
      body = JSON.parse(response.body)
      assert_equal "Invalid credentials", body["error"]
    end

    test "login for an inactive account returns 401" do
      post admin_sessions_path, params: { username: "inactive", password: "Password1!" },
                                as: :json

      assert_response :unauthorized
    end

    test "login with missing username returns 400" do
      post admin_sessions_path, params: { password: "Password1!" }, as: :json

      assert_response :bad_request
    end

    test "login with missing password returns 400" do
      post admin_sessions_path, params: { username: "benjamin" }, as: :json

      assert_response :bad_request
    end

    test "login error response does not reveal whether the username exists" do
      post admin_sessions_path, params: { username: "nobody", password: "x" }, as: :json
      body_unknown = JSON.parse(response.body)["error"]

      post admin_sessions_path, params: { username: "benjamin", password: "x" }, as: :json
      body_wrong_pw = JSON.parse(response.body)["error"]

      assert_equal body_unknown, body_wrong_pw,
                   "Error messages must be identical for unknown user vs wrong password"
    end

    # -------------------------------------------------------------------------
    # DELETE /admin/sessions — logout
    # -------------------------------------------------------------------------

    test "logout with valid token returns 200 and destroys the session" do
      assert_difference "AdminSession.count", -1 do
        delete admin_sessions_path,
               headers: { "Authorization" => "Bearer #{VALID_RAW_TOKEN}" }
      end

      assert_response :ok
      body = JSON.parse(response.body)
      assert_equal "Logged out", body["message"]
    end

    test "logout without Authorization header returns 401" do
      delete admin_sessions_path
      assert_response :unauthorized
    end

    test "logout with a malformed Authorization header returns 401" do
      delete admin_sessions_path, headers: { "Authorization" => "NotBearer abc" }
      assert_response :unauthorized
    end

    test "logout with an expired token returns 401" do
      expired_raw = "expiredtoken_bcdef1234567890abcdef1234567890abcdef1234567890abcdef123456"
      delete admin_sessions_path,
             headers: { "Authorization" => "Bearer #{expired_raw}" }
      assert_response :unauthorized
    end

    test "logout with a garbage token returns 401" do
      delete admin_sessions_path,
             headers: { "Authorization" => "Bearer totallyfake" }
      assert_response :unauthorized
    end

    # -------------------------------------------------------------------------
    # authenticate_admin! concern behavior
    # -------------------------------------------------------------------------

    test "authenticate_admin! sets current_admin on a valid request" do
      # We verify this indirectly: a valid logout returns 200, which requires
      # current_admin to be set for the controller to find the right session.
      delete admin_sessions_path,
             headers: { "Authorization" => "Bearer #{VALID_RAW_TOKEN}" }
      assert_response :ok
    end
  end
end
