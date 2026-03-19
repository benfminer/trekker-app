# CORS configuration for the Trekker API.
#
# In development, all origins are permitted so the React dev server (any port)
# can reach the API without friction.
#
# In production, the allowed origin is read from CORS_ALLOWED_ORIGIN. Set this
# env var to the deployed frontend URL (e.g., "https://trekkers.traceschool.org").
# Defaults to "*" if unset — tighten before public launch.
#
# See: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    if Rails.env.development? || Rails.env.test?
      origins "*"
    else
      origins ENV.fetch("CORS_ALLOWED_ORIGIN", "*")
    end

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose:  ["Authorization"]
  end
end
