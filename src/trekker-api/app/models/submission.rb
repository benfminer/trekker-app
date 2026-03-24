# Submission — a single activity entry logged by a TRACE community member.
#
# Submitters can be individuals or class/group names. No account or login
# required — the form is fully open. `imported: true` marks records that
# were loaded from historical CSV exports rather than submitted live.
#
# Step conversion: when input_type == "steps", converted_miles = input_value / 2500.
# When input_type == "miles", converted_miles = input_value exactly.
# converted_miles is always stored explicitly so SUM queries stay simple.
#
# `site` is optional. When present, the submission is attributed to a TRACE
# campus and included in leaderboard aggregation. When nil (including all
# historical imported records), it counts toward the global map total only.
class Submission < ApplicationRecord
  STEPS_PER_MILE = 2500.0
  VALID_INPUT_TYPES = %w[miles steps].freeze
  VALID_SITES = %w[trace_north trace_south trace_east trace_west].freeze

  validates :name,          presence: true
  validates :activity_date, presence: true
  validates :input_type,    presence: true, inclusion: { in: VALID_INPUT_TYPES }
  validates :input_value,   presence: true,
                            numericality: { greater_than: 0 }
  validates :site,          inclusion: { in: VALID_SITES }, allow_nil: true

  validate :input_value_within_bounds

  # converted_miles is computed before validation so the presence check always
  # passes on a valid record — callers should never set it directly.
  before_validation :compute_converted_miles

  scope :by_date_desc, -> { order(activity_date: :desc) }

  # Filters for the admin list endpoint.
  scope :imported,     -> { where(imported: true) }
  scope :not_imported, -> { where(imported: false) }
  scope :flagged,      -> { where(flagged: true) }
  scope :not_flagged,  -> { where(flagged: false) }

  # Filters for site-based leaderboard queries.
  scope :with_site,    -> { where.not(site: nil) }
  scope :for_site,     ->(site) { where(site: site) }

  # Returns the sum of all converted_miles across every submission.
  # Called on every map load — backed by idx_submissions_converted_miles.
  #
  # @return [BigDecimal]
  def self.total_miles
    sum(:converted_miles)
  end

  # Returns leaderboard data: miles per site, ordered by total descending.
  # Only includes submissions with a non-null site value.
  #
  # Returns an array of hashes: [{ site: "trace_north", total_miles: 123.4 }, ...]
  # All four sites are always present even if a site has no submissions yet.
  #
  # @return [Array<Hash>]
  def self.leaderboard
    site_totals = with_site
                    .group(:site)
                    .sum(:converted_miles)

    VALID_SITES.map do |site|
      { site: site, total_miles: (site_totals[site] || 0).to_f }
    end.sort_by { |entry| -entry[:total_miles] }
  end

  private

  # Rejects absurdly large single-entry submissions that would distort the map
  # or campus trail. Max: 500 miles or 1,250,000 steps per entry.
  # Imported records (historical CSV data) are exempt — they may exceed these limits.
  def input_value_within_bounds
    return unless input_value.present? && input_type.present?
    return if imported?

    max = input_type == "steps" ? 1_250_000 : 500
    if input_value > max
      errors.add(:input_value, "is too large (max #{max} #{input_type} per entry)")
    end
  end

  # Sets converted_miles from input_type and input_value.
  # Called before_validation so computed_miles is always in sync.
  def compute_converted_miles
    return unless input_type.present? && input_value.present?

    self.converted_miles =
      if input_type == "steps"
        input_value / STEPS_PER_MILE
      else
        input_value
      end
  end
end
