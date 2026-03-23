# Rate limiting for the Trekker API.
#
# Throttles are keyed by IP address. Limits are intentionally generous
# for a school community but sufficient to block naive spam scripts.
#
# POST /submissions — 20 per 5 minutes per IP
#   A class of 30 could all submit in a burst; 20/5min is a safe ceiling.
#
# POST /admin/sessions — 5 per 15 minutes per IP
#   Standard brute-force protection for the login endpoint.
#
# Blocked requests receive a 429 Too Many Requests response.
#
# In test, rack-attack is disabled so request specs run at full speed.

class Rack::Attack
  ### Throttles ###

  throttle("submissions/ip", limit: 20, period: 5.minutes) do |req|
    req.ip if req.post? && req.path == "/submissions"
  end

  throttle("admin/sessions/ip", limit: 5, period: 15.minutes) do |req|
    req.ip if req.post? && req.path == "/admin/sessions"
  end

  ### Response ###

  self.throttled_responder = lambda do |_req|
    [
      429,
      { "Content-Type" => "application/json" },
      [ { error: "Too many requests. Please try again later." }.to_json ]
    ]
  end
end

# Disable in test so request specs are unaffected.
Rails.application.config.middleware.use(Rack::Attack) unless Rails.env.test?
