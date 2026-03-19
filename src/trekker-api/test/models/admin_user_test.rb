require "test_helper"

class AdminUserTest < ActiveSupport::TestCase
  # ---------------------------------------------------------------------------
  # has_secure_password
  # ---------------------------------------------------------------------------

  test "authenticates with correct password" do
    admin = AdminUser.new(username: "testuser", password: "Secure123!", active: true)
    assert admin.save, admin.errors.full_messages.to_s

    assert admin.authenticate("Secure123!"), "Expected authenticate to return the record"
    assert_equal false, admin.authenticate("wrongpassword")
  end

  test "does not store plaintext password" do
    admin = AdminUser.create!(username: "noplainstorage", password: "Secure123!", active: true)
    assert_not_equal "Secure123!", admin.password_digest
    assert admin.password_digest.start_with?("$2a$"), "Expected BCrypt digest"
  end

  # ---------------------------------------------------------------------------
  # active scope
  # ---------------------------------------------------------------------------

  test "active scope returns only active accounts" do
    active   = admin_users(:benjamin)
    inactive = admin_users(:inactive_admin)

    assert_includes AdminUser.active, active
    assert_not_includes AdminUser.active, inactive
  end

  # ---------------------------------------------------------------------------
  # Validations
  # ---------------------------------------------------------------------------

  test "requires username" do
    admin = AdminUser.new(username: "", password: "Secure123!", active: true)
    assert_not admin.valid?
    assert_includes admin.errors[:username], "can't be blank"
  end

  test "requires unique username" do
    AdminUser.create!(username: "duplicate", password: "Secure123!", active: true)
    second = AdminUser.new(username: "duplicate", password: "OtherPass1!", active: true)
    assert_not second.valid?
    assert_includes second.errors[:username], "has already been taken"
  end

  test "unique username check is case-insensitive" do
    AdminUser.create!(username: "casetest", password: "Secure123!", active: true)
    second = AdminUser.new(username: "CASETEST", password: "OtherPass1!", active: true)
    assert_not second.valid?
  end

  test "rejects usernames with spaces" do
    admin = AdminUser.new(username: "bad name", password: "Secure123!", active: true)
    assert_not admin.valid?
    assert admin.errors[:username].any?
  end

  # ---------------------------------------------------------------------------
  # Username normalization
  # ---------------------------------------------------------------------------

  test "downcases username before save" do
    admin = AdminUser.create!(username: "UPPERCASE", password: "Secure123!", active: true)
    assert_equal "uppercase", admin.username
  end

  test "strips whitespace from username before save" do
    admin = AdminUser.create!(username: "  spaced  ", password: "Secure123!", active: true)
    assert_equal "spaced", admin.username
  end

  # ---------------------------------------------------------------------------
  # Associations
  # ---------------------------------------------------------------------------

  test "has many admin_sessions" do
    admin = admin_users(:benjamin)
    assert_respond_to admin, :admin_sessions
  end

  test "destroying admin_user destroys associated sessions" do
    admin = AdminUser.create!(username: "towipe", password: "Secure123!", active: true)
    session = admin.admin_sessions.build
    session.generate_token
    session.save!

    assert_difference "AdminSession.count", -1 do
      admin.destroy
    end
  end
end
