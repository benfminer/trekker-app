# Migration: add_email_to_admin_users
#
# Adds a nullable email column to admin_users to support the forgot-password
# email flow. Email is optional — existing accounts continue to work without it.
#
# When an admin requests a password reset, the system looks up the account by
# username and sends the reset link to this email address. If email is nil,
# the reset request silently succeeds (no email sent) to avoid revealing
# whether an account exists.
#
# Email is validated for format in the model when present, but not required.
# Admins set their email when created or via a future profile update.

class AddEmailToAdminUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :admin_users, :email, :string, null: true, default: nil

    # Unique index — two admin accounts cannot share an email.
    # Partial index on non-null values only (standard PostgreSQL approach).
    add_index :admin_users, :email, unique: true,
              where: "email IS NOT NULL",
              name: "uq_admin_users_email"
  end
end
