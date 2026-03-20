# LeaderboardController — public endpoint for the site-based leaderboard.
#
# No authentication required. This endpoint is polled by the leaderboard
# page to show each campus's cumulative miles.
#
# Only submissions with a non-null site value contribute to the leaderboard.
# All four sites are always present in the response even with 0 miles,
# so the frontend never has to handle a missing site.
class LeaderboardController < ApplicationController
  # Maps stored snake_case site slugs to display names shown in the UI.
  SITE_DISPLAY_NAMES = {
    "trace_north" => "Trace North",
    "trace_south" => "Trace South",
    "trace_east"  => "Trace East",
    "trace_west"  => "Trace West"
  }.freeze

  # GET /leaderboard
  #
  # Returns:
  #   200 {
  #     leaderboard: [
  #       {
  #         rank:         Integer,  # 1-based position, ties share the same rank
  #         site:         String,   # slug e.g. "trace_north"
  #         display_name: String,   # e.g. "Trace North"
  #         total_miles:  Float
  #       },
  #       ...                       # always 4 entries, ordered by total_miles desc
  #     ],
  #     total_site_miles: Float,    # sum of all site-attributed miles
  #     updated_at:       String    # ISO8601 timestamp of the most recent tagged submission
  #   }
  def show
    raw = Submission.leaderboard  # [{ site:, total_miles: }] ordered desc

    ranked = assign_ranks(raw).map do |entry|
      {
        rank:         entry[:rank],
        site:         entry[:site],
        display_name: SITE_DISPLAY_NAMES[entry[:site]],
        total_miles:  entry[:total_miles].round(4)
      }
    end

    total_site_miles = raw.sum { |e| e[:total_miles] }
    last_submission  = Submission.with_site.order(created_at: :desc).first

    render json: {
      leaderboard:      ranked,
      total_site_miles: total_site_miles.round(4),
      updated_at:       last_submission&.created_at
    }, status: :ok
  rescue => e
    Rails.logger.error("[LeaderboardController#show] Unexpected error: #{e.class} #{e.message}")
    render json: { error: "Something went wrong. Please try again." }, status: :internal_server_error
  end

  private

  # Assigns 1-based ranks to the leaderboard entries.
  # Sites with equal total_miles share the same rank (standard competition ranking).
  #
  # @param entries [Array<Hash>] sorted desc by total_miles
  # @return [Array<Hash>] same entries with :rank added
  def assign_ranks(entries)
    ranked = []
    rank   = 1

    entries.each_with_index do |entry, index|
      current_rank = if index > 0 && entry[:total_miles] == ranked[index - 1][:total_miles]
                       ranked[index - 1][:rank]
                     else
                       rank
                     end
      ranked << entry.merge(rank: current_rank)
      rank += 1
    end

    ranked
  end
end
