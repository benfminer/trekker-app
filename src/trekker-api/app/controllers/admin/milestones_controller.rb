module Admin
  # Admin::MilestonesController — allows admins to add new milestones to the route.
  #
  # POST /admin/milestones
  #
  # After creation, MilestoneTriggerService runs so the new milestone is
  # immediately triggered if the current total already exceeds its mile_marker.
  class MilestonesController < ApplicationController
    before_action :authenticate_admin!

    # POST /admin/milestones
    #
    # Expects: { name: String, milestone_type: String, mile_marker: Decimal,
    #            description: String (optional), fun_fact: String (optional) }
    # Returns 201 with the created milestone on success.
    # Returns 422 with { errors: [...] } if validations fail.
    def create
      milestone = Milestone.new(milestone_params)

      if milestone.save
        # Run the trigger check in case the current total already exceeds
        # this new milestone's mile_marker (e.g. adding a missed waypoint).
        MilestoneTriggerService.call

        # Reload to pick up triggered/triggered_at if the service just fired it.
        milestone.reload

        Rails.logger.info("[Admin] Milestone created: id=#{milestone.id} name=#{milestone.name} mile_marker=#{milestone.mile_marker} by admin_user_id=#{current_admin.id}")
        render json: { milestone: serialize(milestone) }, status: :created
      else
        render json: { errors: milestone.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def milestone_params
      params.permit(:name, :milestone_type, :mile_marker, :description, :fun_fact)
    end

    def serialize(m)
      {
        id:             m.id,
        name:           m.name,
        milestone_type: m.milestone_type,
        mile_marker:    m.mile_marker.to_f,
        description:    m.description,
        fun_fact:       m.fun_fact,
        triggered:      m.triggered,
        triggered_at:   m.triggered_at,
        created_at:     m.created_at
      }
    end
  end
end
