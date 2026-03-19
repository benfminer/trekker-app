require "test_helper"

class AdminSessionTest < ActiveSupport::TestCase
  def setup
    @admin = admin_users(:benjamin)
  end

  # ---------------------------------------------------------------------------
  # generate_token
  # ---------------------------------------------------------------------------

  test "generate_token returns a non-blank string" do
    session = @admin.admin_sessions.build
    raw_token = session.generate_token
    assert raw_token.present?
  end

  test "generate_token sets token_digest to SHA-256 of the raw token" do
    session = @admin.admin_sessions.build
    raw_token = session.generate_token
    assert_equal Digest::SHA256.hexdigest(raw_token), session.token_digest
  end

  test "generate_token sets expires_at approximately 24 hours from now" do
    session = @admin.admin_sessions.build
    session.generate_token
    assert_in_delta 24.hours.from_now.to_i, session.expires_at.to_i, 5
  end

  test "two calls to generate_token produce different tokens" do
    session1 = @admin.admin_sessions.build
    session2 = @admin.admin_sessions.build
    assert_not_equal session1.generate_token, session2.generate_token
  end

  # ---------------------------------------------------------------------------
  # expired?
  # ---------------------------------------------------------------------------

  test "expired? returns false for a fresh session" do
    session = @admin.admin_sessions.build
    session.generate_token
    assert_not session.expired?
  end

  test "expired? returns true when expires_at is in the past" do
    session = admin_sessions(:expired_session)
    assert session.expired?
  end

  # ---------------------------------------------------------------------------
  # valid_token?
  # ---------------------------------------------------------------------------

  test "valid_token? returns true for correct token on a non-expired session" do
    raw_token = "validtoken_abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"
    session   = admin_sessions(:active_session)
    assert session.valid_token?(raw_token)
  end

  test "valid_token? returns false for wrong token" do
    session = admin_sessions(:active_session)
    assert_not session.valid_token?("completelywrong")
  end

  test "valid_token? returns false for blank token" do
    session = admin_sessions(:active_session)
    assert_not session.valid_token?(nil)
    assert_not session.valid_token?("")
  end

  test "valid_token? returns false for correct token on an expired session" do
    raw_token = "expiredtoken_bcdef1234567890abcdef1234567890abcdef1234567890abcdef123456"
    session   = admin_sessions(:expired_session)
    assert_not session.valid_token?(raw_token)
  end

  # ---------------------------------------------------------------------------
  # find_active_by_token
  # ---------------------------------------------------------------------------

  test "find_active_by_token returns the session for a valid token" do
    raw_token = "validtoken_abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"
    session   = AdminSession.find_active_by_token(raw_token)
    assert_not_nil session
    assert_equal admin_sessions(:active_session).id, session.id
  end

  test "find_active_by_token returns nil for an expired token" do
    raw_token = "expiredtoken_bcdef1234567890abcdef1234567890abcdef1234567890abcdef123456"
    assert_nil AdminSession.find_active_by_token(raw_token)
  end

  test "find_active_by_token returns nil for a token belonging to an inactive admin" do
    # Create a session for the inactive admin and verify it is rejected.
    inactive = admin_users(:inactive_admin)
    session  = inactive.admin_sessions.build
    raw_token = session.generate_token
    session.save!

    assert_nil AdminSession.find_active_by_token(raw_token)
  end

  test "find_active_by_token returns nil for blank input" do
    assert_nil AdminSession.find_active_by_token(nil)
    assert_nil AdminSession.find_active_by_token("")
  end

  test "find_active_by_token returns nil for a garbage token" do
    assert_nil AdminSession.find_active_by_token("not-a-real-token")
  end
end
