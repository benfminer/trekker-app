module Admin
  # Admin::PasswordsController — allows a logged-in admin to change their password.
  #
  # PATCH /admin/password
  #
  # The admin must supply their current password to confirm identity before
  # the new password is accepted. This prevents someone with an unattended
  # logged-in session from silently changing the password.
  class PasswordsController < ApplicationController
    before_action :authenticate_admin!

    # PATCH /admin/password
    #
    # Expects: { current_password: String, new_password: String }
    # Returns 200 on success.
    # Returns 422 with { errors: [...] } if the new password is invalid.
    # Returns 401 if current_password is wrong — same as authentication failure
    # to avoid leaking which step failed.
    def update
      current_password = params[:current_password].to_s
      new_password      = params[:new_password].to_s

      if current_password.blank? || new_password.blank?
        return render json: { error: "current_password and new_password are required" },
                      status: :bad_request
      end

      # Verify current password before accepting a change.
      # authenticate() returns false on wrong password — treat identically to
      # any other auth failure to avoid confirming the admin's current password.
      unless current_admin.authenticate(current_password)
        Rails.logger.warn("[AdminAuth] Failed password change — wrong current password for admin_user_id=#{current_admin.id} ip=#{request.remote_ip}")
        return render json: { error: "Unauthorized" }, status: :unauthorized
      end

      current_admin.password = new_password

      if current_admin.save
        Rails.logger.info("[AdminAuth] Password changed for admin_user_id=#{current_admin.id} ip=#{request.remote_ip}")
        render json: { message: "Password updated" }, status: :ok
      else
        render json: { errors: current_admin.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end
end
