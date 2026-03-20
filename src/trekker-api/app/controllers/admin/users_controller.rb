module Admin
  # Admin::UsersController — allows a logged-in admin to create new admin accounts
  # and reset another admin's password.
  #
  # POST  /admin/users                    — create a new account
  # PATCH /admin/users/reset_password     — set any admin's password by username
  #
  # All actions require a valid Bearer token.
  class UsersController < ApplicationController
    before_action :authenticate_admin!

    # POST /admin/users
    #
    # Expects: { username: String, password: String, email: String (optional),
    #            display_name: String (optional) }
    # Returns 201 with the created user (id, username, display_name, email, active)
    # on success.
    # Returns 422 with { errors: [...] } if validations fail (e.g. username taken).
    def create
      admin = AdminUser.new(admin_user_params)

      if admin.save
        Rails.logger.info("[AdminAuth] New admin account created: username=#{admin.username} by admin_user_id=#{current_admin.id} ip=#{request.remote_ip}")
        render json: serialize(admin), status: :created
      else
        render json: { errors: admin.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # PATCH /admin/users/reset_password
    #
    # Lets an authenticated admin set a new password for any admin account by
    # username — no email required. Intended for the two-admin use case where
    # one admin resets the other's password directly.
    #
    # Expects: { username: String, new_password: String }
    # Returns 200 on success.
    # Returns 404 if username not found.
    # Returns 422 if the new password fails model validations.
    def reset_password
      username     = params[:username].to_s.strip
      new_password = params[:new_password].to_s

      if username.blank? || new_password.blank?
        return render json: { error: "username and new_password are required" },
                      status: :bad_request
      end

      target = AdminUser.find_by(username: username)
      unless target
        return render json: { error: "Admin user not found" }, status: :not_found
      end

      target.password = new_password

      if target.save
        Rails.logger.info("[AdminAuth] Password reset by admin_user_id=#{current_admin.id} for username=#{username} ip=#{request.remote_ip}")
        render json: { message: "Password reset" }, status: :ok
      else
        render json: { errors: target.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def admin_user_params
      params.permit(:username, :password, :display_name, :email)
    end

    # Returns a safe representation of an AdminUser — never exposes password_digest.
    #
    # @param admin [AdminUser]
    # @return [Hash]
    def serialize(admin)
      {
        id:           admin.id,
        username:     admin.username,
        display_name: admin.display_name,
        email:        admin.email,
        active:       admin.active,
        created_at:   admin.created_at
      }
    end
  end
end
