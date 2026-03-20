require "test_helper"

module Admin
  class PasswordsControllerTest < ActionDispatch::IntegrationTest
    VALID_RAW_TOKEN = "validtoken_abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"

    def auth_headers
      { "Authorization" => "Bearer #{VALID_RAW_TOKEN}" }
    end

    # -------------------------------------------------------------------------
    # PATCH /admin/password — happy path
    # -------------------------------------------------------------------------

    test "returns 200 and updates password with correct current password" do
      patch admin_password_path,
            params: { current_password: "Password1!", new_password: "NewPassword2!" },
            headers: auth_headers,
            as: :json

      assert_response :ok
      assert_equal "Password updated", JSON.parse(response.body)["message"]
    end

    test "admin can log in with new password after successful change" do
      patch admin_password_path,
            params: { current_password: "Password1!", new_password: "NewPassword2!" },
            headers: auth_headers,
            as: :json

      assert_response :ok

      post admin_sessions_path,
           params: { username: "benjamin", password: "NewPassword2!" },
           as: :json

      assert_response :created
    end

    # -------------------------------------------------------------------------
    # PATCH /admin/password — failure cases
    # -------------------------------------------------------------------------

    test "returns 401 when current_password is wrong" do
      patch admin_password_path,
            params: { current_password: "wrongpassword", new_password: "NewPassword2!" },
            headers: auth_headers,
            as: :json

      assert_response :unauthorized
    end

    test "returns 400 when current_password is missing" do
      patch admin_password_path,
            params: { new_password: "NewPassword2!" },
            headers: auth_headers,
            as: :json

      assert_response :bad_request
    end

    test "returns 400 when new_password is missing" do
      patch admin_password_path,
            params: { current_password: "Password1!" },
            headers: auth_headers,
            as: :json

      assert_response :bad_request
    end

    test "returns 422 when new_password fails model validation" do
      patch admin_password_path,
            params: { current_password: "Password1!", new_password: "short" },
            headers: auth_headers,
            as: :json

      assert_response :unprocessable_entity
      body = JSON.parse(response.body)
      assert body["errors"].present?
    end

    test "returns 401 without a Bearer token" do
      patch admin_password_path,
            params: { current_password: "Password1!", new_password: "NewPassword2!" },
            as: :json

      assert_response :unauthorized
    end
  end
end
