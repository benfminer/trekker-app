# Migration: create_password_reset_tokens
#
# Creates the password_reset_tokens table for the admin forgot-password flow.
#
# Token security model mirrors admin_sessions exactly:
#   - A raw 32-byte hex token is generated and emailed to the admin once.
#   - Only the SHA-256 digest is stored — a database leak cannot expose live tokens.
#   - Tokens expire after 1 hour (TOKEN_DURATION in the model).
#   - The used_at column marks a token as consumed on first use, preventing
#     replay attacks without deleting the record (preserves the audit trail).
#
# Flow:
#   1. Admin requests a password reset → token generated, digest stored, email sent.
#   2. Admin clicks the link (contains raw token) → looked up by digest.
#   3. Token is valid if: digest matches AND expires_at > NOW AND used_at IS NULL.
#   4. On successful reset → used_at is set to Time.current.
#
# Only one active token per admin is needed. The auth-agent is responsible for
# invalidating (setting used_at) or deleting old tokens when a new one is issued.

class CreatePasswordResetTokens < ActiveRecord::Migration[7.2]
  def change
    create_table :password_reset_tokens do |t|
      t.references :admin_user, null: false, foreign_key: true,
                   index: { name: "idx_password_reset_tokens_admin_user_id" }

      # SHA-256 digest of the raw reset token. The raw token is emailed to
      # the admin and never stored server-side in readable form.
      t.string :token_digest, null: false

      # When this token expires. Default: 1 hour from creation.
      t.datetime :expires_at, null: false

      # Set to the redemption time when the token is used successfully.
      # NULL means the token has not been used yet.
      # A non-null value means the token has already been consumed — reject it.
      t.datetime :used_at, null: true, default: nil

      t.timestamps
    end

    # Token lookup is the hot path on reset — hash the raw token, query by digest.
    add_index :password_reset_tokens, :token_digest, unique: true,
              name: "uq_password_reset_tokens_token_digest"

    # Used to skip expired tokens quickly without fetching and checking in Ruby.
    add_index :password_reset_tokens, :expires_at,
              name: "idx_password_reset_tokens_expires_at"
  end
end
