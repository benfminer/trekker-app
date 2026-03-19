# StatsController — public endpoint for the map and progress display.
#
# No authentication required. This endpoint is polled by the frontend map
# and progress counter to reflect the group's current collective position.
#
# GET /api/stats
#   Returns cumulative totals, goal progress, and milestone state.
class StatsController < ApplicationController
  GOAL_MILES = 20_286.0

  # GET /stats
  #
  # Returns:
  #   200 {
  #     total_miles:          Float,
  #     submission_count:     Integer,
  #     goal_miles:           Float,    # 20286 — circumference at San Diego's latitude
  #     percent_complete:     Float,    # (total_miles / goal_miles * 100).round(2)
  #     current_position:     Float,    # same as total_miles; named for map clarity
  #     next_milestone: {
  #       id:              Integer,
  #       name:            String,
  #       milestone_type:  String,
  #       mile_marker:     Float,
  #       miles_away:      Float        # mile_marker - total_miles, floored at 0
  #     } | null,                       # null when all milestones are triggered
  #     triggered_milestones: [
  #       { id, name, milestone_type, mile_marker, triggered_at }
  #     ]
  #   }
  def show
    total_miles      = Submission.total_miles.to_f
    submission_count = Submission.count
    next_milestone   = Milestone.next_untriggered
    triggered        = Milestone.triggered_ordered.to_a

    render json: {
      total_miles:          total_miles,
      submission_count:     submission_count,
      goal_miles:           GOAL_MILES,
      percent_complete:     (total_miles / GOAL_MILES * 100).round(2),
      current_position:     total_miles,
      next_milestone:       next_milestone_json(next_milestone, total_miles),
      triggered_milestones: triggered.map { |m| triggered_milestone_json(m) }
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

    miles_away = [milestone.mile_marker.to_f - total_miles, 0.0].max

    {
      id:             milestone.id,
      name:           milestone.name,
      milestone_type: milestone.milestone_type,
      mile_marker:    milestone.mile_marker.to_f,
      miles_away:     miles_away.round(4)
    }
  end

  # @param milestone [Milestone]
  # @return [Hash]
  def triggered_milestone_json(milestone)
    {
      id:             milestone.id,
      name:           milestone.name,
      milestone_type: milestone.milestone_type,
      mile_marker:    milestone.mile_marker.to_f,
      triggered_at:   milestone.triggered_at
    }
  end
end
