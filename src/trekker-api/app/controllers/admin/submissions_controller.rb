module Admin
  # Admin::SubmissionsController — protected admin endpoints for managing submissions.
  #
  # All actions require a valid Bearer token (authenticate_admin! before_action).
  #
  # GET    /admin/submissions         — paginated list with optional imported filter
  # PATCH  /admin/submissions/:id     — edit a submission; recalculates converted_miles
  # DELETE /admin/submissions/:id     — hard delete
  # POST   /admin/submissions/:id/flag — toggle flagged status
  class SubmissionsController < ApplicationController
    before_action :authenticate_admin!
    before_action :set_submission, only: [:update, :destroy, :flag]

    # GET /admin/submissions
    #
    # Params:
    #   page     [Integer] 1-based page number (default: 1)
    #   per_page [Integer] records per page (default: 50, max: 200)
    #   imported [String]  "true" or "false" to filter by imported status
    #
    # Returns:
    #   200 {
    #     submissions: [...],
    #     meta: { page, per_page, total_count, total_pages }
    #   }
    def index
      scope = Submission.by_date_desc

      # Filter by imported status when the param is explicitly provided.
      # Absent param = no filter (return all).
      if params.key?(:imported)
        imported_val = ActiveModel::Type::Boolean.new.cast(params[:imported])
        scope = scope.where(imported: imported_val)
      end

      per_page    = [[params.fetch(:per_page, 50).to_i, 1].max, 200].min
      page        = [params.fetch(:page, 1).to_i, 1].max
      offset      = (page - 1) * per_page
      total_count = scope.count

      submissions = scope.limit(per_page).offset(offset)

      render json: {
        submissions: submissions.map { |s| submission_json(s) },
        meta: {
          page:        page,
          per_page:    per_page,
          total_count: total_count,
          total_pages: (total_count.to_f / per_page).ceil
        }
      }, status: :ok
    rescue => e
      Rails.logger.error("[Admin::SubmissionsController#index] error=#{e.class} #{e.message} admin_id=#{current_admin&.id}")
      render json: { error: "Something went wrong." }, status: :internal_server_error
    end

    # PATCH /admin/submissions/:id
    #
    # Editable fields: name, activity_date, input_type, input_value.
    # converted_miles is always recalculated — callers must not send it directly.
    # After a successful save, runs MilestoneTriggerService if converted_miles changed.
    #
    # Returns:
    #   200 { submission: { ... } }
    #   422 { errors: { field: ["message"] } }
    #   404 { error: "Not found" }
    def update
      miles_before = @submission.converted_miles

      if @submission.update(submission_update_params)
        if @submission.converted_miles != miles_before
          MilestoneTriggerService.call
        end

        render json: { submission: submission_json(@submission) }, status: :ok
      else
        render json: { errors: @submission.errors.messages }, status: :unprocessable_entity
      end
    rescue => e
      Rails.logger.error("[Admin::SubmissionsController#update] error=#{e.class} #{e.message} submission_id=#{params[:id]} admin_id=#{current_admin&.id}")
      render json: { error: "Something went wrong." }, status: :internal_server_error
    end

    # DELETE /admin/submissions/:id
    #
    # Hard delete — no soft delete, no recovery.
    #
    # Returns:
    #   204 (no body)
    #   404 { error: "Not found" }
    def destroy
      @submission.destroy!
      head :no_content
    rescue => e
      Rails.logger.error("[Admin::SubmissionsController#destroy] error=#{e.class} #{e.message} submission_id=#{params[:id]} admin_id=#{current_admin&.id}")
      render json: { error: "Something went wrong." }, status: :internal_server_error
    end

    # POST /admin/submissions/:id/flag
    #
    # Toggles the flagged boolean. Calling it on a flagged submission un-flags it;
    # calling it on an unflagged submission flags it.
    #
    # Returns:
    #   200 { submission: { ... } }
    #   404 { error: "Not found" }
    def flag
      @submission.update!(flagged: !@submission.flagged)
      render json: { submission: submission_json(@submission) }, status: :ok
    rescue => e
      Rails.logger.error("[Admin::SubmissionsController#flag] error=#{e.class} #{e.message} submission_id=#{params[:id]} admin_id=#{current_admin&.id}")
      render json: { error: "Something went wrong." }, status: :internal_server_error
    end

    private

    def set_submission
      @submission = Submission.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Not found" }, status: :not_found
    end

    def submission_update_params
      params.require(:submission).permit(:name, :activity_date, :input_type, :input_value)
    end

    # Consistent serialization shape shared across all admin submission responses.
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
        created_at:      submission.created_at,
        updated_at:      submission.updated_at
      }
    end
  end
end
