require "digest"

# PasswordResetToken — a short-lived token emailed to an admin to verify
# ownership of the account before allowing a password change.
#
# Security model mirrors AdminSession:
#   - Raw token (SecureRandom.hex(32)) is emailed once and never stored.
#   - Only the SHA-256 digest is persisted — a database dump cannot expose
#     live reset links.
#   - Token expires after TOKEN_DURATION (1 hour).
#   - used_at is set on first use — subsequent attempts with the same token
#     are rejected even if the expiry has not passed.
#
# Typical flow:
#   token = admin_user.password_reset_tokens.build
#   raw_token = token.generate_token
#   token.save!
#   ResetMailer.reset_email(admin_user, raw_token).deliver_later
class PasswordResetToken < ApplicationRecord
  belongs_to :admin_user

  TOKEN_DURATION = 1.hour

  validates :token_digest, presence: true, uniqueness: true
  validates :expires_at,   presence: true

  # Generates a new secure random token, stores its digest, and sets expiry.
  #
  # Returns the raw token string. The caller must email this to the admin
  # immediately — it cannot be recovered later.
  #
  # Call on an unsaved record only. Does NOT persist the record.
  #
  # @return [String] the raw token to include in the reset URL
  def generate_token
    raw_token = SecureRandom.hex(32)
    self.token_digest = digest(raw_token)
    self.expires_at   = TOKEN_DURATION.from_now
    raw_token
  end

  # Returns true if this token is still valid: not expired and not yet used.
  #
  # @return [Boolean]
  def active?
    used_at.nil? && expires_at > Time.current
  end

  # Marks the token as consumed by setting used_at to now.
  # Call this immediately after a successful password reset.
  #
  # @return [Boolean] true if the update succeeded
  def consume!
    touch(:used_at)
  end

  # Looks up an active (unused, unexpired) reset token by raw token value.
  #
  # Hashes the presented token, queries by digest, and confirms the token
  # is not expired and not already used. Returns nil on any failure.
  #
  # @param raw_token [String]
  # @return [PasswordResetToken, nil]
  def self.find_active_by_token(raw_token)
    return nil if raw_token.blank?

    token_digest = Digest::SHA256.hexdigest(raw_token)
    where(token_digest: token_digest)
      .where(used_at: nil)
      .where("expires_at > ?", Time.current)
      .first
  end

  private

  def digest(raw_token)
    Digest::SHA256.hexdigest(raw_token)
  end
end
