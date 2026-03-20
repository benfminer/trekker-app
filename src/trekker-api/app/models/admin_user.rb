require "uri"

# AdminUser — credentials for admin dashboard access.
#
# Authentication is handled by Rails has_secure_password, which wraps BCrypt.
# Call `admin_user.authenticate("plaintext")` to verify a password — it returns
# the record on success and false on failure.
#
# Accounts are never deleted. Set active: false to revoke access without
# touching session history or losing the audit trail.
class AdminUser < ApplicationRecord
  has_secure_password

  has_many :admin_sessions,        dependent: :destroy
  has_many :password_reset_tokens, dependent: :destroy

  # Normalize username and email before validation.
  before_validation :normalize_username
  before_validation :normalize_email

  validates :username,
            presence: true,
            uniqueness: { case_sensitive: false },
            format: {
              with: /\A[a-z0-9_\-]+\z/i,
              message: "can only contain letters, numbers, underscores, and hyphens"
            },
            length: { maximum: 64 }

  validates :email,
            uniqueness: { case_sensitive: false },
            format: { with: URI::MailTo::EMAIL_REGEXP },
            allow_nil: true

  # Enforce a minimum password length when a password is being set or changed.
  # allow_nil allows updates to other fields without requiring the password to
  # be re-supplied.
  validates :password, length: { minimum: 8 }, allow_nil: true

  validates :active, inclusion: { in: [true, false] }

  # Returns only accounts that are permitted to log in.
  scope :active, -> { where(active: true) }

  private

  def normalize_username
    self.username = username.downcase.strip if username.present?
  end

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end
