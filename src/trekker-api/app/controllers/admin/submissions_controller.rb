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
    #   page      [Integer] 1-based page number (default: 1)
    #   per_page  [Integer] records per page (default: 50, max: 100)
    #   imported  [String]  "true" or "false" to filter by imported status
    #   flagged   [String]  "true" or "false" to filter by flagged status
    #   site      [String]  one of the four campus slugs, or "none" for untagged
    #   search    [String]  case-insensitive substring match on name
    #   sort_by   [String]  "date" (default) or "miles"
    #   sort_dir  [String]  "desc" (default) or "asc"
    #   date_from [String]  ISO8601 date — filter activity_date >= this value
    #   date_to   [String]  ISO8601 date — filter activity_date <= this value
    #   miles_min [Float]   filter converted_miles >= this value
    #   miles_max [Float]   filter converted_miles <= this value
    #
    # Returns:
    #   200 {
    #     submissions: [...],
    #     meta: { page, per_page, total_count, total_pages }
    #   }
    def index
      scope = Submission.all

      # Filter by imported status when the param is explicitly provided.
      # Absent param = no filter (return all).
      if params.key?(:imported)
        imported_val = ActiveModel::Type::Boolean.new.cast(params[:imported])
        scope = scope.where(imported: imported_val)
      end

      # Filter by flagged status when the param is explicitly provided.
      if params.key?(:flagged)
        flagged_val = ActiveModel::Type::Boolean.new.cast(params[:flagged])
        scope = scope.where(flagged: flagged_val)
      end

      # Filter by site. "none" returns submissions with no site set.
      if params[:site].present?
        if params[:site] == "none"
          scope = scope.where(site: nil)
        elsif Submission::VALID_SITES.include?(params[:site])
          scope = scope.for_site(params[:site])
        end
      end

      # Case-insensitive substring search on name.
      if params[:search].present?
        scope = scope.where("name ILIKE ?", "%#{params[:search].strip}%")
      end

      # Date range filter on activity_date.
      # rescue nil silently ignores malformed date strings instead of raising.
      if params[:date_from].present?
        date_from = Date.parse(params[:date_from]) rescue nil
        scope = scope.where("activity_date >= ?", date_from) if date_from
      end

      if params[:date_to].present?
        date_to = Date.parse(params[:date_to]) rescue nil
        scope = scope.where("activity_date <= ?", date_to) if date_to
      end

      # Miles range filter on the stored converted_miles column.
      if params[:miles_min].present?
        scope = scope.where("converted_miles >= ?", params[:miles_min].to_f)
      end

      if params[:miles_max].present?
        scope = scope.where("converted_miles <= ?", params[:miles_max].to_f)
      end

      # Sort — WHITELIST the column name to prevent SQL injection.
      # Never interpolate params[:sort_by] directly into .order().
      sort_column = case params[:sort_by]
                    when "miles" then :converted_miles
                    else :activity_date  # "date" or anything unknown → activity_date
                    end

      sort_direction = case params[:sort_dir]
                       when "asc" then :asc
                       else :desc  # "desc" or anything unknown → desc
                       end

      scope = scope.order(sort_column => sort_direction)

      per_page    = [[params.fetch(:per_page, 50).to_i, 1].max, 100].min
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
      params.require(:submission).permit(:name, :activity_date, :input_type, :input_value, :site)
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
        site:            submission.site,
        imported:        submission.imported,
        flagged:         submission.flagged,
        created_at:      submission.created_at,
        updated_at:      submission.updated_at
      }
    end
  end
end
