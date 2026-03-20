require "test_helper"

module Admin
  class PasswordResetsControllerTest < ActionDispatch::IntegrationTest
    ACTIVE_RAW_TOKEN   = "resettoken_abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456"
    EXPIRED_RAW_TOKEN  = "resettoken_expired_bcdef1234567890abcdef1234567890abcdef1234567890ab"
    USED_RAW_TOKEN     = "resettoken_used_cdef1234567890abcdef1234567890abcdef1234567890abcdef"

    # -------------------------------------------------------------------------
    # POST /admin/password_resets — request reset email
    # -------------------------------------------------------------------------

    test "returns 200 for a known username with email" do
      post admin_password_resets_path,
           params: { username: "benjamin" },
           as: :json

      assert_response :ok
      assert JSON.parse(response.body)["message"].present?
    end

    test "returns 200 for an unknown username (does not reveal account existence)" do
      post admin_password_resets_path,
           params: { username: "nobody" },
           as: :json

      assert_response :ok
    end

    test "returns the same message for known and unknown usernames" do
      post admin_password_resets_path, params: { username: "benjamin" }, as: :json
      known_message = JSON.parse(response.body)["message"]

      post admin_password_resets_path, params: { username: "nobody" }, as: :json
      unknown_message = JSON.parse(response.body)["message"]

      assert_equal known_message, unknown_message
    end

    test "creates a PasswordResetToken for a known user with email" do
      assert_difference "PasswordResetToken.count", 1 do
        post admin_password_resets_path,
             params: { username: "benjamin" },
             as: :json
      end
    end

    test "does not create a token for an unknown username" do
      assert_no_difference "PasswordResetToken.count" do
        post admin_password_resets_path,
             params: { username: "nobody" },
             as: :json
      end
    end

    test "invalidates existing unused tokens before issuing a new one" do
      existing_token = password_reset_tokens(:active_reset)
      assert_nil existing_token.used_at

      post admin_password_resets_path,
           params: { username: "benjamin" },
           as: :json

      existing_token.reload
      assert_not_nil existing_token.used_at
    end

    test "returns 400 when username is missing" do
      post admin_password_resets_path, params: {}, as: :json
      assert_response :bad_request
    end

    # -------------------------------------------------------------------------
    # PATCH /admin/password_resets/reset — submit new password with token
    # -------------------------------------------------------------------------

    test "resets password with a valid token and returns 200" do
      patch reset_admin_password_resets_path,
            params: { token: ACTIVE_RAW_TOKEN, new_password: "NewPassword2!" },
            as: :json

      assert_response :ok
      assert JSON.parse(response.body)["message"].present?
    end

    test "token is consumed (used_at set) after successful reset" do
      patch reset_admin_password_resets_path,
            params: { token: ACTIVE_RAW_TOKEN, new_password: "NewPassword2!" },
            as: :json

      token_record = password_reset_tokens(:active_reset)
      token_record.reload
      assert_not_nil token_record.used_at
    end

    test "admin can log in with new password after reset" do
      patch reset_admin_password_resets_path,
            params: { token: ACTIVE_RAW_TOKEN, new_password: "NewPassword2!" },
            as: :json

      assert_response :ok

      post admin_sessions_path,
           params: { username: "benjamin", password: "NewPassword2!" },
           as: :json

      assert_response :created
    end

    test "returns 401 with an expired token" do
      patch reset_admin_password_resets_path,
            params: { token: EXPIRED_RAW_TOKEN, new_password: "NewPassword2!" },
            as: :json

      assert_response :unauthorized
    end

    test "returns 401 with an already-used token" do
      patch reset_admin_password_resets_path,
            params: { token: USED_RAW_TOKEN, new_password: "NewPassword2!" },
            as: :json

      assert_response :unauthorized
    end

    test "returns 401 with a garbage token" do
      patch reset_admin_password_resets_path,
            params: { token: "totallyfake", new_password: "NewPassword2!" },
            as: :json

      assert_response :unauthorized
    end

    test "returns 422 when new_password fails validation" do
      patch reset_admin_password_resets_path,
            params: { token: ACTIVE_RAW_TOKEN, new_password: "short" },
            as: :json

      assert_response :unprocessable_entity
      body = JSON.parse(response.body)
      assert body["errors"].present?
    end

    test "returns 400 when token is missing" do
      patch reset_admin_password_resets_path,
            params: { new_password: "NewPassword2!" },
            as: :json

      assert_response :bad_request
    end

    test "returns 400 when new_password is missing" do
      patch reset_admin_password_resets_path,
            params: { token: ACTIVE_RAW_TOKEN },
            as: :json

      assert_response :bad_request
    end
  end
end
