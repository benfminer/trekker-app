# Migration: add_site_to_submissions
#
# Adds an optional site attribution column to submissions so that miles can
# be associated with one of the four TRACE campuses for the leaderboard.
#
# Design decisions:
#   - Nullable — site is optional on the submission form. Null means "no site
#     selected." These submissions still count toward the global map total but
#     are excluded from leaderboard aggregation.
#   - String, not a DB enum — keeps the migration and admin tooling simple.
#     The model enforces the allowed values via inclusion validation.
#   - Historical imported records keep site = NULL. The leaderboard starts
#     fresh from launch — there is no backfill plan for CSV data.
#
# Valid site values (enforced in Submission model):
#   "trace_north", "trace_south", "trace_east", "trace_west"

class AddSiteToSubmissions < ActiveRecord::Migration[7.2]
  def change
    add_column :submissions, :site, :string, null: true, default: nil

    # Index for the leaderboard query: SELECT site, SUM(converted_miles)
    # FROM submissions WHERE site IS NOT NULL GROUP BY site.
    # Also used for admin filtering by site.
    add_index :submissions, :site, name: "idx_submissions_site"
  end
end
