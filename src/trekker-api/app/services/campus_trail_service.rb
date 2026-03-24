# CampusTrailService — computes per-site miles and geographic narrative milestones
# for the Campus Trail public endpoint.
#
# Milestone logic:
#   Each site's total converted_miles is looked up against WAYPOINTS — a sorted
#   array of { miles:, name:, lat:, lng: } hashes covering the full ~20,286-mile
#   circumnavigation route at roughly 32°N latitude (San Diego eastward around
#   the world and back). The last waypoint whose :miles value is <= the site's
#   total is the site's current milestone.
#
# Sites with zero miles return the starting waypoint (San Diego).
class CampusTrailService
  # Waypoints along the great circle route at ~32°N, San Diego eastward.
  # ~25 markers spaced to ensure no campus sits in a geographic dead zone.
  # Mile values are cumulative from San Diego.
  WAYPOINTS = [
    { miles:      0, name: "San Diego, CA",        lat:  32.7157, lng: -117.1611 },
    { miles:    140, name: "Phoenix, AZ",           lat:  33.4484, lng: -112.0740 },
    { miles:    350, name: "Albuquerque, NM",       lat:  35.0844, lng: -106.6504 },
    { miles:    600, name: "Amarillo, TX",          lat:  35.2220, lng: -101.8313 },
    { miles:    900, name: "Oklahoma City, OK",     lat:  35.4676, lng:  -97.5164 },
    { miles:   1150, name: "Memphis, TN",           lat:  35.1495, lng:  -90.0490 },
    { miles:   1400, name: "Atlanta, GA",           lat:  33.7490, lng:  -84.3880 },
    { miles:   1650, name: "Charlotte, NC",         lat:  35.2271, lng:  -80.8431 },
    { miles:   1850, name: "Virginia Beach, VA",    lat:  36.8529, lng:  -75.9780 },
    { miles:   2300, name: "the Bermuda Triangle",  lat:  32.3078, lng:  -64.7505 },
    { miles:   2900, name: "the Azores",            lat:  37.7412, lng:  -25.6756 },
    { miles:   3500, name: "Lisbon, Portugal",      lat:  38.7223, lng:   -9.1393 },
    { miles:   3750, name: "Madrid, Spain",         lat:  40.4168, lng:   -3.7038 },
    { miles:   4100, name: "Rome, Italy",           lat:  41.9028, lng:   12.4964 },
    { miles:   4500, name: "Athens, Greece",        lat:  37.9838, lng:   23.7275 },
    { miles:   4900, name: "Istanbul, Turkey",      lat:  41.0082, lng:   28.9784 },
    { miles:   5400, name: "Beirut, Lebanon",       lat:  33.8938, lng:   35.5018 },
    { miles:   5900, name: "Baghdad, Iraq",         lat:  33.3152, lng:   44.3661 },
    { miles:   6500, name: "Karachi, Pakistan",     lat:  24.8607, lng:   67.0011 },
    { miles:   7200, name: "New Delhi, India",      lat:  28.6139, lng:   77.2090 },
    { miles:   8100, name: "Kolkata, India",        lat:  22.5726, lng:   88.3639 },
    { miles:   8900, name: "Chiang Mai, Thailand",  lat:  18.7883, lng:   98.9853 },
    { miles:   9600, name: "Hanoi, Vietnam",        lat:  21.0285, lng:  105.8542 },
    { miles:  10200, name: "Hong Kong",             lat:  22.3193, lng:  114.1694 },
    { miles:  10800, name: "Shanghai, China",       lat:  31.2304, lng:  121.4737 },
    { miles:  11400, name: "Tokyo, Japan",          lat:  35.6762, lng:  139.6503 },
    { miles:  12200, name: "the North Pacific",     lat:  35.0000, lng:  170.0000 },
    { miles:  13200, name: "Honolulu, HI",          lat:  21.3069, lng: -157.8583 },
    { miles:  14000, name: "the open Pacific",      lat:  32.0000, lng: -145.0000 },
    { miles:  15000, name: "halfway home",          lat:  32.0000, lng: -130.0000 },
    { miles:  16000, name: "the California coast",  lat:  32.8000, lng: -120.0000 },
    { miles:  16500, name: "San Diego, CA",         lat:  32.7157, lng: -117.1611 }
  ].freeze

  SITE_DISPLAY_NAMES = {
    "trace_north" => "Trace North",
    "trace_south" => "Trace South",
    "trace_east"  => "Trace East",
    "trace_west"  => "Trace West"
  }.freeze

  # Returns the campus trail payload: one entry per site, sorted alphabetically
  # by display name.
  #
  # @return [Array<Hash>] array of campus trail entries, always 4 elements
  def self.call
    site_totals = Submission.with_site
                             .group(:site)
                             .sum(:converted_miles)

    Submission::VALID_SITES.map do |site|
      miles     = (site_totals[site] || 0).to_f
      waypoint  = milestone_for(miles)
      site_name = SITE_DISPLAY_NAMES[site]

      {
        site:               site_name,
        miles:              miles.round(4),
        milestone:          narrative(site_name, waypoint[:name]),
        milestone_location: waypoint[:name],
        coordinates:        { lat: waypoint[:lat], lng: waypoint[:lng] }
      }
    end.sort_by { |entry| entry[:site] }
  end

  # Finds the waypoint the site has "reached" based on its total miles.
  # Returns the last waypoint whose :miles is <= the site total.
  # Always returns the starting waypoint (index 0) when miles == 0.
  #
  # @param total_miles [Float]
  # @return [Hash] a single waypoint hash
  def self.milestone_for(total_miles)
    WAYPOINTS.select { |wp| wp[:miles] <= total_miles }.last || WAYPOINTS.first
  end

  # Builds the human-readable narrative string for a campus card.
  #
  # @param site_name [String] e.g. "Trace North"
  # @param location  [String] e.g. "Tokyo, Japan"
  # @return [String]
  def self.narrative(site_name, location)
    "#{site_name} has walked as far as #{location}"
  end

  private_class_method :milestone_for, :narrative
end
