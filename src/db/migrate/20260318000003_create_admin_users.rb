# Migration: create_admin_users
#
# Creates the admin_users table for protecting the admin dashboard.
#
# This is a minimal auth table — not a full user management system.
# The intent is 1-2 admin accounts (Benjamin, maybe one other) that
# can review, edit, and delete submissions.
#
# Password storage uses BCrypt digest (password_digest column),
# compatible with Rails has_secure_password. Never store plaintext.
#
# Design decision — why not HTTP basic auth or a single hardcoded password?
#   A dedicated table costs almost nothing and gives us the ability to:
#   - Add a second admin without a code deploy
#   - Revoke access for a specific person without affecting others
#   - Audit which admin took which action (if we add admin_user_id to
#     submissions later)
#   The PROJECT_VISION.md listed this as an open question; we're resolving
#   it in favor of has_secure_password for minimal overhead and real security.

class CreateAdminUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :admin_users do |t|
      # Login username. Downcased and stripped in the model before save.
      t.string :username, null: false

      # BCrypt digest of the password. Set via has_secure_password in the model.
      # Never query on this column directly — Rails handles comparison.
      t.string :password_digest, null: false

      # Display name for the admin UI ("Benjamin", "TRACE Admin", etc.)
      t.string :display_name

      # Soft-disable an account without deleting it.
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    # Usernames must be unique. Used for login lookup.
    add_index :admin_users, :username, unique: true, name: "uq_admin_users_username"
  end
end
