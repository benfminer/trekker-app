module Admin
  # Admin::SessionsController — handles admin login and logout.
  #
  # POST   /admin/sessions  — authenticate with username + password, receive token
  # DELETE /admin/sessions  — invalidate the current session (logout)
  #
  # The raw token is returned once on login and never stored server-side.
  # Clients must send it as: Authorization: Bearer <token>
  #
  # Error responses are deliberately generic — never confirm whether a username
  # exists or whether a session was found.
  class SessionsController < ApplicationController
    before_action :authenticate_admin!, only: [:destroy]

    # POST /admin/sessions
    #
    # Expects: { username: String, password: String }
    # Returns 201 with { token: String } on success.
    # Returns 401 on invalid credentials — same message for unknown user or wrong password.
    def create
      username = params.dig(:username).to_s.downcase.strip
      password = params.dig(:password).to_s

      if username.blank? || password.blank?
        return render json: { error: "Username and password are required" },
                      status: :bad_request
      end

      admin = AdminUser.active.find_by(username: username)

      # authenticate() returns the record on success, false on wrong password.
      # We treat both unknown username and wrong password identically.
      unless admin&.authenticate(password)
        Rails.logger.warn("[AdminAuth] Failed login attempt for username=#{username.inspect} ip=#{request.remote_ip}")
        return render json: { error: "Invalid credentials" }, status: :unauthorized
      end

      session = admin.admin_sessions.build(created_from_ip: request.remote_ip)
      raw_token = session.generate_token
      session.save!

      Rails.logger.info("[AdminAuth] Login succeeded for admin_user_id=#{admin.id} ip=#{request.remote_ip}")

      render json: { token: raw_token }, status: :created
    end

    # DELETE /admin/sessions
    #
    # Requires: Authorization: Bearer <token>
    # Returns 200 on success.
    # Returns 401 if the token is missing or invalid (via authenticate_admin! before_action).
    def destroy
      # current_admin is set by authenticate_admin!. We destroy the specific session
      # that was used to authenticate this request, not all sessions.
      raw_token  = extract_bearer_token
      token_digest = Digest::SHA256.hexdigest(raw_token)
      session    = current_admin.admin_sessions.find_by(token_digest: token_digest)

      session&.destroy

      Rails.logger.info("[AdminAuth] Logout for admin_user_id=#{current_admin.id} ip=#{request.remote_ip}")

      render json: { message: "Logged out" }, status: :ok
    end
  end
end
