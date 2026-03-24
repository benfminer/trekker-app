Rails.application.routes.draw do
  # Health check — used by load balancers and uptime monitors.
  get "up" => "rails/health#show", as: :rails_health_check

  # ---------------------------------------------------------------------------
  # Public endpoints — no authentication required
  # ---------------------------------------------------------------------------

  # POST /submissions — log a new activity (miles or steps)
  resources :submissions, only: [:create]

  # GET /stats — cumulative total miles, current position, next milestone
  get "stats", to: "stats#show"

  # GET /campus_trail — per-site miles and geographic narrative milestone for each campus
  get "campus_trail", to: "campus_trail#show"

  # ---------------------------------------------------------------------------
  # Admin endpoints — all require Bearer token (authenticate_admin!)
  # ---------------------------------------------------------------------------

  namespace :admin do
    # POST   /admin/sessions  — login (returns Bearer token)
    # DELETE /admin/sessions  — logout (invalidates current session via Bearer token, no ID needed)
    resources :sessions, only: [:create] do
      collection { delete :destroy }
    end

    # GET    /admin/submissions        — paginated list
    # PATCH  /admin/submissions/:id    — edit a submission
    # DELETE /admin/submissions/:id    — hard delete
    resources :submissions, only: [:index, :update, :destroy] do
      # POST /admin/submissions/:id/flag — toggle flagged status
      member do
        post :flag
      end
    end

    # PATCH /admin/password — change own password (requires Bearer token)
    resource :password, only: [:update]

    # POST /admin/milestones — add a new milestone to the route (requires Bearer token)
    resources :milestones, only: [:create]

    # POST  /admin/users                  — create a new admin account (requires Bearer token)
    # PATCH /admin/users/reset_password   — reset any admin's password by username (requires Bearer token)
    resources :users, only: [:create] do
      collection { patch :reset_password }
    end

    # POST  /admin/password_resets        — request a reset email (public)
    # PATCH /admin/password_resets/reset  — submit new password with token (public)
    resources :password_resets, only: [:create] do
      collection { patch :reset }
    end
  end
end
