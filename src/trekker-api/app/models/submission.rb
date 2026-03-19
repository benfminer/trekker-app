# Submission — a single activity entry logged by a TRACE community member.
#
# Submitters can be individuals or class/group names. No account or login
# required — the form is fully open. `imported: true` marks records that
# were loaded from historical CSV exports rather than submitted live.
#
# Step conversion: when input_type == "steps", converted_miles = input_value / 2500.
# When input_type == "miles", converted_miles = input_value exactly.
# converted_miles is always stored explicitly so SUM queries stay simple.
class Submission < ApplicationRecord
  STEPS_PER_MILE = 2500.0
  VALID_INPUT_TYPES = %w[miles steps].freeze

  validates :name,          presence: true
  validates :activity_date, presence: true
  validates :input_type,    presence: true, inclusion: { in: VALID_INPUT_TYPES }
  validates :input_value,   presence: true,
                            numericality: { greater_than: 0 }

  # converted_miles is computed before validation so the presence check always
  # passes on a valid record — callers should never set it directly.
  before_validation :compute_converted_miles

  scope :by_date_desc, -> { order(activity_date: :desc) }

  # Filters for the admin list endpoint.
  scope :imported,     -> { where(imported: true) }
  scope :not_imported, -> { where(imported: false) }
  scope :flagged,      -> { where(flagged: true) }
  scope :not_flagged,  -> { where(flagged: false) }

  # Returns the sum of all converted_miles across every submission.
  # Called on every map load — backed by idx_submissions_converted_miles.
  #
  # @return [BigDecimal]
  def self.total_miles
    sum(:converted_miles)
  end

  private

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
