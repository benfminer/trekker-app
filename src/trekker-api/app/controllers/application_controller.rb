class ApplicationController < ActionController::API
  # AdminAuthenticatable provides authenticate_admin! and current_admin.
  # It is NOT applied here globally — only controllers that need protection
  # call `before_action :authenticate_admin!` explicitly.
  include AdminAuthenticatable
end
