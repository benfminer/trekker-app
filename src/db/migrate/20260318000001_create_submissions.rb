# Migration: create_submissions
#
# Creates the core submissions table. This is the heart of the data model —
# every mile and step logged by the TRACE community lands here.
#
# No authentication is required to submit. The table records both the raw
# input (type + value the user entered) and the computed miles value so we
# can always recalculate without losing the original data.
#
# The `submitted_at` column is distinct from `created_at`:
#   - submitted_at = the date the user claims the activity happened (user-entered)
#   - created_at   = when the record was inserted into the database
# This distinction matters for historical CSV imports, where created_at will
# reflect the import time, not the original activity date.

class CreateSubmissions < ActiveRecord::Migration[7.2]
  def change
    create_table :submissions do |t|
      # Who logged this entry. May be an individual name or a class/group name.
      # Not a foreign key — no accounts in this app.
      t.string :name, null: false

      # The date the participant claims the activity happened.
      # Stored as date (no time component) since users pick a calendar date.
      t.date :activity_date, null: false

      # "miles" or "steps" — what unit the user entered.
      # Using a string rather than a DB enum to keep the migration simple;
      # the model enforces the allowed values via inclusion validation.
      t.string :input_type, null: false

      # The raw number the user entered (miles or steps, unmodified).
      t.decimal :input_value, precision: 10, scale: 4, null: false

      # Computed miles. If input_type is "miles", this equals input_value.
      # If input_type is "steps", this equals input_value / 2500.0.
      # Stored here so aggregate queries are a simple SUM without needing
      # inline CASE expressions everywhere.
      t.decimal :converted_miles, precision: 10, scale: 4, null: false

      # Whether this record was imported from a CSV file rather than
      # submitted through the live form. Useful for admin auditing.
      t.boolean :imported, null: false, default: false

      t.timestamps
    end

    # Index for fast aggregate queries (the total miles calculation hits
    # every row in this table on every map load).
    add_index :submissions, :converted_miles, name: "idx_submissions_converted_miles"

    # Index for admin filtering and date-range queries.
    add_index :submissions, :activity_date, name: "idx_submissions_activity_date"

    # Index for the admin dashboard sorting by submission time.
    add_index :submissions, :created_at, name: "idx_submissions_created_at"

    # Index to support filtering imported vs. live submissions in the admin UI.
    add_index :submissions, :imported, name: "idx_submissions_imported"
  end
end
