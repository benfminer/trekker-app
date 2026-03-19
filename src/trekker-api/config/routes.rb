Rails.application.routes.draw do
  # Health check — used by load balancers and uptime monitors.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :admin do
    # POST   /admin/sessions  — login (returns Bearer token)
    # DELETE /admin/sessions  — logout (invalidates current session)
    resources :sessions, only: [:create, :destroy]
  end
end
