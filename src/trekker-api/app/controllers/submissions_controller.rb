# SubmissionsController — open-access endpoint for logging activity.
#
# No authentication required. Anyone with the app URL can submit.
#
# POST /submissions
#   Accepts name, activity_date, input_type ("miles" | "steps"), input_value.
#   Converts steps → miles at 2500 steps/mile (handled by Submission model).
#   After a successful save, runs MilestoneTriggerService to check for newly
#   crossed milestones.
#   Returns 201 with the submission record, or 422 with validation errors.
class SubmissionsController < ApplicationController
  # POST /submissions
  #
  # Params:
  #   name          [String]  required — individual or class name
  #   activity_date [String]  required — ISO date (YYYY-MM-DD)
  #   input_type    [String]  required — "miles" or "steps"
  #   input_value   [Decimal] required — positive number
  #
  # Returns:
  #   201 { submission: { id, name, activity_date, input_type, input_value,
  #                       converted_miles, imported, flagged, created_at } }
  #   422 { errors: { field: ["message", ...] } }
  def create
    submission = Submission.new(submission_params)
    submission.imported = false

    if submission.save
      triggered_milestones = MilestoneTriggerService.call

      render json: {
        submission: submission_json(submission),
        triggered_milestones: triggered_milestones.map { |m| milestone_json(m) }
      }, status: :created
    else
      render json: { errors: submission.errors.messages }, status: :unprocessable_entity
    end
  rescue => e
    Rails.logger.error("[SubmissionsController#create] Unexpected error: #{e.class} #{e.message}")
    render json: { error: "Something went wrong. Please try again." }, status: :internal_server_error
  end

  private

  def submission_params
    params.require(:submission).permit(:name, :activity_date, :input_type, :input_value)
  end

  # Serializes a Submission to a plain hash for JSON responses.
  # Consistent shape used by both this controller and Admin::SubmissionsController.
  def submission_json(submission)
    {
      id:              submission.id,
      name:            submission.name,
      activity_date:   submission.activity_date,
      input_type:      submission.input_type,
      input_value:     submission.input_value.to_f,
      converted_miles: submission.converted_miles.to_f,
      imported:        submission.imported,
      flagged:         submission.flagged,
      created_at:      submission.created_at
    }
  end

  def milestone_json(milestone)
    {
      id:             milestone.id,
      name:           milestone.name,
      milestone_type: milestone.milestone_type,
      mile_marker:    milestone.mile_marker.to_f,
      description:    milestone.description,
      triggered_at:   milestone.triggered_at
    }
  end
end
