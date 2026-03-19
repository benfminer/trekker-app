# Migration: create_admin_sessions
#
# Creates the admin_sessions table for token-based admin authentication.
#
# Rather than using cookies (which require CSRF handling in API mode) or
# HTTP basic auth (which can't be revoked), we issue a session token on
# login. The admin stores the token in localStorage and sends it as a
# Bearer token on every admin request.
#
# Tokens expire after 24 hours. The `expires_at` column allows a simple
# WHERE expires_at > NOW() check in the authentication middleware.
#
# Design note: we do not store the token in plaintext. We store a SHA-256
# digest so that a database leak doesn't hand an attacker active sessions.
# The raw token is returned to the client once on login and never stored
# server-side in readable form.

class CreateAdminSessions < ActiveRecord::Migration[7.2]
  def change
    create_table :admin_sessions do |t|
      t.references :admin_user, null: false, foreign_key: true,
                   index: { name: "idx_admin_sessions_admin_user_id" }

      # SHA-256 digest of the session token. The raw token goes to the client.
      t.string :token_digest, null: false

      # When this session expires. Default: 24 hours from creation.
      t.datetime :expires_at, null: false

      # Optional: track which IP address created the session.
      t.string :created_from_ip

      t.timestamps
    end

    # Token lookup is the hot path on every admin API request.
    add_index :admin_sessions, :token_digest, unique: true,
              name: "uq_admin_sessions_token_digest"

    # Used to efficiently clean up expired sessions.
    add_index :admin_sessions, :expires_at, name: "idx_admin_sessions_expires_at"
  end
end
