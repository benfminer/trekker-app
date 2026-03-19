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

  has_many :admin_sessions, dependent: :destroy

  # Normalize username before validation so format/uniqueness checks run on
  # the canonical value — not the raw input with mixed case or stray whitespace.
  before_validation :normalize_username

  validates :username,
            presence: true,
            uniqueness: { case_sensitive: false },
            format: {
              with: /\A[a-z0-9_\-]+\z/i,
              message: "can only contain letters, numbers, underscores, and hyphens"
            },
            length: { maximum: 64 }

  validates :active, inclusion: { in: [true, false] }

  # Returns only accounts that are permitted to log in.
  scope :active, -> { where(active: true) }

  private

  def normalize_username
    self.username = username.downcase.strip if username.present?
  end
end
