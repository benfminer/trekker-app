module Admin
  # Admin::PasswordResetsController — two-step forgot-password flow.
  #
  # Step 1 — POST  /admin/password_resets        — request a reset email
  # Step 2 — PATCH /admin/password_resets/reset  — submit new password with token
  #
  # Both endpoints are public (no Bearer token required). The admin uses them
  # precisely when they cannot log in.
  #
  # Security properties:
  #   - Step 1 always returns 200 regardless of whether the username exists or
  #     has an email set. This prevents account enumeration.
  #   - Reset tokens are single-use: consumed immediately on successful reset.
  #   - Tokens expire after PasswordResetToken::TOKEN_DURATION (1 hour).
  #   - Any existing unused tokens for the account are invalidated before
  #     issuing a new one, preventing token accumulation.
  class PasswordResetsController < ApplicationController
    # POST /admin/password_resets
    #
    # Expects: { username: String }
    # Always returns 200 with a generic message — never reveals whether the
    # username exists or whether an email was sent.
    def create
      username = params[:username].to_s.downcase.strip

      if username.blank?
        return render json: { error: "username is required" }, status: :bad_request
      end

      admin = AdminUser.active.find_by(username: username)

      if admin&.email.present?
        # Invalidate any existing unused tokens before issuing a new one.
        admin.password_reset_tokens.where(used_at: nil).update_all(
          used_at: Time.current
        )

        token_record = admin.password_reset_tokens.build
        raw_token    = token_record.generate_token
        token_record.save!

        AdminMailer.password_reset(admin, raw_token).deliver_later

        Rails.logger.info("[AdminAuth] Password reset requested for admin_user_id=#{admin.id} ip=#{request.remote_ip}")
      else
        # Log the miss without revealing it to the caller.
        Rails.logger.warn("[AdminAuth] Password reset requested for unknown/no-email account username=#{username.inspect} ip=#{request.remote_ip}")
      end

      # Always the same response — do not reveal whether username was found.
      render json: { message: "If that account exists and has an email address, a reset link has been sent." },
             status: :ok
    end

    # PATCH /admin/password_resets/reset
    #
    # Expects: { token: String, new_password: String }
    # Returns 200 on success.
    # Returns 422 with { errors: [...] } if the new password fails validations.
    # Returns 401 if the token is invalid, expired, or already used — generic
    # message to avoid revealing the reason.
    def reset
      raw_token    = params[:token].to_s
      new_password = params[:new_password].to_s

      if raw_token.blank? || new_password.blank?
        return render json: { error: "token and new_password are required" },
                      status: :bad_request
      end

      token_record = PasswordResetToken.find_active_by_token(raw_token)

      unless token_record
        Rails.logger.warn("[AdminAuth] Invalid/expired reset token presented ip=#{request.remote_ip}")
        return render json: { error: "Invalid or expired reset token" },
                      status: :unauthorized
      end

      admin = token_record.admin_user
      admin.password = new_password

      if admin.save
        token_record.consume!
        Rails.logger.info("[AdminAuth] Password reset completed for admin_user_id=#{admin.id} ip=#{request.remote_ip}")
        render json: { message: "Password has been reset. You can now log in." }, status: :ok
      else
        render json: { errors: admin.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end
end
