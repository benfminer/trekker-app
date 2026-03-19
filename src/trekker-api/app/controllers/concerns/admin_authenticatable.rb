# AdminAuthenticatable — concern for controllers that require admin authentication.
#
# Include this in ApplicationController (or any controller) and call
# `authenticate_admin!` as a before_action on controllers or actions that
# should be protected.
#
# It is intentionally NOT applied globally. Public controllers (submissions,
# stats) remain open-access. Only admin-namespaced controllers call it.
#
# Authentication flow:
#   1. Read the Authorization header — must be "Bearer <token>"
#   2. Delegate lookup to AdminSession.find_active_by_token, which hashes the
#      token and checks expiry + admin_user.active in a single joined query.
#   3. Set @current_admin to the AdminUser on success.
#   4. Render 401 on any failure — never reveal whether the token exists,
#      is expired, or belongs to an inactive account.
module AdminAuthenticatable
  extend ActiveSupport::Concern

  included do
    # Expose @current_admin as a helper method if views are ever needed, but
    # in API mode this is mainly for controller logic.
    attr_reader :current_admin
  end

  # before_action — protect any action by calling authenticate_admin!.
  #
  # Sets @current_admin on success. Halts the filter chain and renders 401
  # on any failure.
  def authenticate_admin!
    raw_token = extract_bearer_token
    session   = AdminSession.find_active_by_token(raw_token)

    if session
      @current_admin = session.admin_user
    else
      render_unauthorized
    end
  end

  private

  # Pulls the raw token from "Authorization: Bearer <token>".
  # Returns nil if the header is absent or malformed.
  #
  # @return [String, nil]
  def extract_bearer_token
    header = request.headers["Authorization"]
    return nil unless header&.start_with?("Bearer ")

    header.split(" ", 2).last.presence
  end

  # Renders a 401 without revealing any implementation detail.
  # The message is deliberately generic — do not change it to say "expired" or
  # "not found" as that would aid enumeration.
  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end
end
