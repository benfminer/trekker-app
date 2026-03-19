require "digest"

# AdminSession — a server-side record backing each admin Bearer token.
#
# The raw token (a 32-byte hex string from SecureRandom) is given to the client
# exactly once at login and is never stored on the server. Only the SHA-256
# digest is persisted. Requests authenticate by hashing the presented token and
# looking up the digest — so a database dump does not expose live sessions.
#
# Sessions expire 24 hours after creation. Expired sessions remain in the table
# until cleaned up explicitly:
#   AdminSession.where("expires_at < ?", Time.current).delete_all
class AdminSession < ApplicationRecord
  belongs_to :admin_user

  SESSION_DURATION = 24.hours

  validates :token_digest, presence: true, uniqueness: true
  validates :expires_at, presence: true

  # Generates a new secure random token, stores its digest, sets expiry.
  #
  # Returns the raw token string. The caller must transmit this to the client
  # immediately — it cannot be recovered later.
  #
  # Call on an unsaved record only. This method does NOT persist the record.
  # Example:
  #   session = admin_user.admin_sessions.build(created_from_ip: request.remote_ip)
  #   raw_token = session.generate_token
  #   session.save!
  #   render json: { token: raw_token }
  def generate_token
    raw_token = SecureRandom.hex(32)   # 64 hex chars — 256 bits of entropy
    self.token_digest = digest(raw_token)
    self.expires_at   = SESSION_DURATION.from_now
    raw_token
  end

  # Returns true if the session has passed its expiry time.
  #
  # @return [Boolean]
  def expired?
    expires_at <= Time.current
  end

  # Returns true if the given raw token matches this session's stored digest
  # AND the session has not expired.
  #
  # Never short-circuit on expiry before the digest check — always compare
  # the digest first to avoid timing-based enumeration of token validity.
  #
  # @param raw_token [String] the token value sent by the client
  # @return [Boolean]
  def valid_token?(raw_token)
    return false if raw_token.blank?

    # ActiveSupport::SecurityUtils.secure_compare guards against timing attacks.
    ActiveSupport::SecurityUtils.secure_compare(digest(raw_token), token_digest) &&
      !expired?
  end

  # Looks up an active session by raw token.
  #
  # Hashes the presented token, queries by digest, and confirms the session is
  # not expired and the owning admin account is active. Returns nil on any
  # failure — callers must treat nil as unauthenticated.
  #
  # @param raw_token [String]
  # @return [AdminSession, nil]
  def self.find_active_by_token(raw_token)
    return nil if raw_token.blank?

    token_digest = Digest::SHA256.hexdigest(raw_token)
    session = joins(:admin_user)
                .where(token_digest: token_digest)
                .where("admin_sessions.expires_at > ?", Time.current)
                .where(admin_users: { active: true })
                .first

    session
  end

  private

  def digest(raw_token)
    Digest::SHA256.hexdigest(raw_token)
  end
end
