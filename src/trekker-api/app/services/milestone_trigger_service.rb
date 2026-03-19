# MilestoneTriggerService — checks and triggers newly-crossed milestones.
#
# Call after any operation that changes the cumulative mileage total:
#   - POST /submissions (new public submission)
#   - PATCH /admin/submissions/:id (admin edit that changes converted_miles)
#
# A milestone triggers when total_miles >= milestone.mile_marker AND
# milestone.triggered == false. Multiple milestones can trigger in a single
# call (e.g., a large imported batch may jump several markers at once).
# All newly-crossed milestones are updated in one pass.
#
# Milestones are NEVER un-triggered. Once the celebration has occurred,
# removing a submission that drops the total below a marker does not revert it.
#
# Usage:
#   triggered = MilestoneTriggerService.call
#   # => Array of Milestone records that were just triggered (may be empty)
class MilestoneTriggerService
  # Checks the current total miles and triggers all newly-crossed milestones.
  #
  # @return [Array<Milestone>] milestones triggered during this call (may be empty)
  def self.call
    new.call
  end

  def call
    total = Submission.total_miles
    newly_triggered = Milestone.crossed_by(total).to_a

    return [] if newly_triggered.empty?

    now = Time.current

    # Bulk update for efficiency — avoids N individual UPDATE calls.
    # We still return the records for callers that want to surface
    # celebration data in the API response.
    Milestone.where(id: newly_triggered.map(&:id))
             .update_all(triggered: true, triggered_at: now, updated_at: now)

    # Reload to get the updated attributes on the returned objects.
    Milestone.where(id: newly_triggered.map(&:id)).order(mile_marker: :asc).to_a
  end
end
