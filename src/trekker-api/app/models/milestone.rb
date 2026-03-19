# Milestone — a pre-seeded checkpoint along the circumnavigation route.
#
# Milestones are triggered automatically when the group's cumulative miles
# crosses a mile_marker. Once triggered they are never un-triggered, even
# if later admin edits would drop the total below the marker.
#
# The MilestoneTriggerService handles the trigger logic so it can be called
# from multiple entry points (submission create, admin edit).
class Milestone < ApplicationRecord
  VALID_TYPES = %w[country continent ocean city].freeze

  validates :name,           presence: true
  validates :milestone_type, presence: true, inclusion: { in: VALID_TYPES }
  validates :mile_marker,    presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :untriggered,          -> { where(triggered: false) }
  scope :by_mile_marker,       -> { order(mile_marker: :asc) }
  scope :crossed_by,           ->(total) { untriggered.where("mile_marker <= ?", total) }

  # Returns the next milestone the group has not yet reached.
  # Used by the stats endpoint to show progress toward the next marker.
  #
  # @return [Milestone, nil]
  def self.next_untriggered
    untriggered.by_mile_marker.first
  end
end
