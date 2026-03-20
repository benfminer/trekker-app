module Admin
  # Admin::UsersController — allows a logged-in admin to create new admin accounts.
  #
  # POST /admin/users
  #
  # Only active admins with a valid Bearer token can create accounts.
  # New accounts are active by default. Password must meet model validations.
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
