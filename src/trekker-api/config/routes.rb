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
  end
end
