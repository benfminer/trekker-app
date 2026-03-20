# AdminMailer — transactional emails for admin account management.
#
# Delivery method is configured in config/environments/*.rb via
# config.action_mailer.delivery_method. In development this defaults to
# :letter_opener or :test. In production, wire a real service (Postmark or
# SendGrid) by setting SMTP credentials in environment variables — see
# integrations-agent handoff for the production wiring task.
#
# The FROM address is read from ENV["ADMIN_MAILER_FROM"], with a fallback
# to a placeholder. Set this in production environment variables.
class AdminMailer < ApplicationMailer
  FROM_ADDRESS = ENV.fetch("ADMIN_MAILER_FROM", "noreply@tracetrekkers.example.com")

  # Sends a password reset link to the given admin.
  #
  # The raw_token is embedded in the reset URL. It is single-use and expires
  # after PasswordResetToken::TOKEN_DURATION (1 hour).
  #
  # The frontend reset URL is read from ENV["FRONTEND_BASE_URL"] so it works
  # across dev, staging, and production without code changes.
  #
  # @param admin [AdminUser]
  # @param raw_token [String] the plaintext token to embed in the reset link
  # @return [Mail::Message]
  def password_reset(admin, raw_token)
    @admin       = admin
    @reset_url   = "#{frontend_base_url}/admin/reset-password?token=#{raw_token}"
    @expires_in  = "1 hour"

    mail(
      to:      admin.email,
      from:    FROM_ADDRESS,
      subject: "Reset your TRACE Trekkers admin password"
    )
  end

  private

  def frontend_base_url
    ENV.fetch("FRONTEND_BASE_URL", "http://localhost:5173")
  end
end
