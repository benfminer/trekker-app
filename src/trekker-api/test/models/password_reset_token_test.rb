require "test_helper"

class PasswordResetTokenTest < ActiveSupport::TestCase
  ACTIVE_RAW   = "resettoken_abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456"
  EXPIRED_RAW  = "resettoken_expired_bcdef1234567890abcdef1234567890abcdef1234567890ab"
  USED_RAW     = "resettoken_used_cdef1234567890abcdef1234567890abcdef1234567890abcdef"

  # -------------------------------------------------------------------------
  # generate_token
  # -------------------------------------------------------------------------

  test "generate_token sets token_digest and expires_at" do
    admin = admin_users(:benjamin)
    token = admin.password_reset_tokens.build
    raw   = token.generate_token

    assert raw.present?
    assert token.token_digest.present?
    assert token.expires_at.present?
    assert token.expires_at > Time.current
  end

  test "generate_token stores SHA-256 digest of the raw token" do
    admin = admin_users(:benjamin)
    token = admin.password_reset_tokens.build
    raw   = token.generate_token

    assert_equal Digest::SHA256.hexdigest(raw), token.token_digest
  end

  # -------------------------------------------------------------------------
  # active?
  # -------------------------------------------------------------------------

  test "active? returns true for an unused, unexpired token" do
    assert password_reset_tokens(:active_reset).active?
  end

  test "active? returns false for an expired token" do
    assert_not password_reset_tokens(:expired_reset).active?
  end

  test "active? returns false for an already-used token" do
    assert_not password_reset_tokens(:used_reset).active?
  end

  # -------------------------------------------------------------------------
  # find_active_by_token
  # -------------------------------------------------------------------------

  test "find_active_by_token returns the record for a valid raw token" do
    result = PasswordResetToken.find_active_by_token(ACTIVE_RAW)
    assert_equal password_reset_tokens(:active_reset), result
  end

  test "find_active_by_token returns nil for an expired token" do
    assert_nil PasswordResetToken.find_active_by_token(EXPIRED_RAW)
  end

  test "find_active_by_token returns nil for an already-used token" do
    assert_nil PasswordResetToken.find_active_by_token(USED_RAW)
  end

  test "find_active_by_token returns nil for a garbage token" do
    assert_nil PasswordResetToken.find_active_by_token("totallyfake")
  end

  test "find_active_by_token returns nil for a blank token" do
    assert_nil PasswordResetToken.find_active_by_token("")
    assert_nil PasswordResetToken.find_active_by_token(nil)
  end

  # -------------------------------------------------------------------------
  # consume!
  # -------------------------------------------------------------------------

  test "consume! sets used_at to the current time" do
    token = password_reset_tokens(:active_reset)
    assert_nil token.used_at

    token.consume!
    token.reload

    assert_not_nil token.used_at
  end

  test "token is no longer active after consume!" do
    token = password_reset_tokens(:active_reset)
    token.consume!
    token.reload

    assert_not token.active?
  end
end
