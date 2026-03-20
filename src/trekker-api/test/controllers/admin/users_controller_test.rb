require "test_helper"

module Admin
  class UsersControllerTest < ActionDispatch::IntegrationTest
    VALID_RAW_TOKEN = "validtoken_abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"

    def auth_headers
      { "Authorization" => "Bearer #{VALID_RAW_TOKEN}" }
    end

    # -------------------------------------------------------------------------
    # POST /admin/users — happy path
    # -------------------------------------------------------------------------

    test "creates a new admin account and returns 201" do
      assert_difference "AdminUser.count", 1 do
        post admin_users_path,
             params: { username: "newadmin", password: "Password1!", display_name: "New Admin",
                       email: "newadmin@tracetrekkers.test" },
             headers: auth_headers,
             as: :json
      end

      assert_response :created
      body = JSON.parse(response.body)
      assert_equal "newadmin", body["username"]
      assert_equal "New Admin", body["display_name"]
      assert body["active"]
    end

    test "response does not include password_digest" do
      post admin_users_path,
           params: { username: "newadmin", password: "Password1!" },
           headers: auth_headers,
           as: :json

      body = JSON.parse(response.body)
      assert_nil body["password_digest"]
    end

    test "creates account without optional fields" do
      post admin_users_path,
           params: { username: "minimaladmin", password: "Password1!" },
           headers: auth_headers,
           as: :json

      assert_response :created
    end

    # -------------------------------------------------------------------------
    # POST /admin/users — failure cases
    # -------------------------------------------------------------------------

    test "returns 422 when username is already taken" do
      post admin_users_path,
           params: { username: "benjamin", password: "Password1!" },
           headers: auth_headers,
           as: :json

      assert_response :unprocessable_entity
      body = JSON.parse(response.body)
      assert body["errors"].any? { |e| e.match?(/username/i) }
    end

    test "returns 422 when password is too short" do
      post admin_users_path,
           params: { username: "newadmin", password: "short" },
           headers: auth_headers,
           as: :json

      assert_response :unprocessable_entity
    end

    test "returns 422 when email format is invalid" do
      post admin_users_path,
           params: { username: "newadmin", password: "Password1!", email: "notanemail" },
           headers: auth_headers,
           as: :json

      assert_response :unprocessable_entity
    end

    test "returns 401 without a Bearer token" do
      post admin_users_path,
           params: { username: "newadmin", password: "Password1!" },
           as: :json

      assert_response :unauthorized
    end
  end
end
