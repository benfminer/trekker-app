# CampusTrailController — public endpoint for the Campus Trail page.
#
# Returns per-site mileage totals and geographic narrative milestones for each
# of the four TRACE campuses. No authentication required.
#
# Only submissions with a non-null site value contribute to these totals.
# All four sites are always present in the response even when a site has 0 miles,
# so the frontend never needs to handle a missing site.
class CampusTrailController < ApplicationController
  # GET /campus_trail
  #
  # Returns:
  #   200 {
  #     campus_trail: [
  #       {
  #         site:               String,  # display name, e.g. "Trace North"
  #         miles:              Float,   # total converted_miles for this site
  #         milestone:          String,  # narrative, e.g. "Trace North has walked as far as Tokyo, Japan"
  #         milestone_location: String,  # place name only, e.g. "Tokyo, Japan"
  #         coordinates: {
  #           lat: Float,
  #           lng: Float
  #         }
  #       },
  #       ...                            # always 4 entries, sorted alphabetically by site name
  #     ]
  #   }
  def show
    render json: { campus_trail: CampusTrailService.call }, status: :ok
  rescue => e
    Rails.logger.error("[CampusTrailController#show] Unexpected error: #{e.class} #{e.message}")
    render json: { error: "Something went wrong. Please try again." }, status: :internal_server_error
  end
end
