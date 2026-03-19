# StatsController — public endpoint for the map and progress display.
#
# No authentication required. This endpoint is polled by the frontend map
# and progress counter to reflect the group's current collective position.
#
# GET /stats
#   Returns the cumulative total miles, the current position (same value),
#   and the next untriggered milestone with miles remaining until it triggers.
class StatsController < ApplicationController
  # GET /stats
  #
  # Returns:
  #   200 {
  #     total_miles:      Float,
  #     current_position: Float,   # same as total_miles; named for map clarity
  #     next_milestone: {
  #       id:             Integer,
  #       name:           String,
  #       milestone_type: String,
  #       mile_marker:    Float,
  #       miles_remaining: Float   # mile_marker - total_miles, floored at 0
  #     } | null                   # null when all milestones are triggered
  #   }
  def show
    total_miles = Submission.total_miles.to_f
    next_milestone = Milestone.next_untriggered

    render json: {
      total_miles:      total_miles,
      current_position: total_miles,
      next_milestone:   next_milestone_json(next_milestone, total_miles)
    }, status: :ok
  rescue => e
    Rails.logger.error("[StatsController#show] Unexpected error: #{e.class} #{e.message}")
    render json: { error: "Something went wrong. Please try again." }, status: :internal_server_error
  end

  private

  # @param milestone [Milestone, nil]
  # @param total_miles [Float]
  # @return [Hash, nil]
  def next_milestone_json(milestone, total_miles)
    return nil if milestone.nil?

    miles_remaining = [milestone.mile_marker.to_f - total_miles, 0.0].max

    {
      id:              milestone.id,
      name:            milestone.name,
      milestone_type:  milestone.milestone_type,
      mile_marker:     milestone.mile_marker.to_f,
      miles_remaining: miles_remaining.round(4)
    }
  end
end
