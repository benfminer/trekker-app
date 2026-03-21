# Seeds — development fake data for TRACE Trekkers
#
# Run with: rails db:seed
# Safe to re-run: uses find_or_initialize_by for admin users, destroys and
# recreates submissions and milestones so counts stay predictable.
#
# What gets seeded:
#   - 2 admin users (benjamin, admin)
#   - ~165 individual submissions + ~110 class-event submissions + site-tagged data
#     targeting ~10,000 total miles (halfway to the 20,286 mile goal)
#   - 20 milestones along the route from San Diego (20,286 mile goal)

puts "Seeding development data..."

# ---------------------------------------------------------------------------
# Admin users
# ---------------------------------------------------------------------------

admins = [
  { username: "benjamin", password: "password", display_name: "Benjamin" },
  { username: "admin",    password: "password", display_name: "TRACE Admin" }
]

admins.each do |attrs|
  user = AdminUser.find_or_initialize_by(username: attrs[:username])
  user.assign_attributes(
    password:     attrs[:password],
    display_name: attrs[:display_name],
    active:       true
  )
  user.save!
  puts "  Admin: #{attrs[:username]}"
end

# ---------------------------------------------------------------------------
# Submissions
# ---------------------------------------------------------------------------

Submission.destroy_all
puts "  Cleared existing submissions"

names = [
  "Ms. Rodriguez's Class", "Mr. Chen's Class", "Coach Williams",
  "Benjamin", "Maya T.", "Jordan K.", "Sam P.", "Alex R.",
  "Mrs. Patel's Class", "7th Grade PE", "8th Grade PE",
  "Coach Davis", "Lila M.", "Noah F.", "Priya S.", "Marcus O.",
  "Ms. Kim's Class", "Cross Country Team", "Zoe W.", "Ethan B."
]

school_year_start = Date.new(2025, 9, 1)
today = Date.today
days_in_year = (today - school_year_start).to_i

submissions_data = 150.times.map do
  input_type = rand < 0.6 ? "miles" : "steps"
  input_value = if input_type == "miles"
    (rand * 8 + 0.5).round(2)      # 0.5 – 8.5 miles
  else
    (rand * 15_000 + 2_000).round  # 2,000 – 17,000 steps
  end

  {
    name:          names.sample,
    activity_date: school_year_start + rand(days_in_year),
    input_type:    input_type,
    input_value:   input_value,
    flagged:       rand < 0.05,
    imported:      false
  }
end

# Handful of imported (historical) records
15.times do
  submissions_data << {
    name:          names.sample,
    activity_date: school_year_start + rand(60),
    input_type:    "miles",
    input_value:   (rand * 5 + 0.5).round(2),
    flagged:       false,
    imported:      true
  }
end

submissions_data.each { |attrs| Submission.create!(attrs) }

# ---------------------------------------------------------------------------
# Class-event submissions — whole PE classes / group challenge days
# These are the bulk of the mileage, targeting ~10,000 total miles.
# Individual submissions above give ~1,200 miles; class events add ~7,500.
# ---------------------------------------------------------------------------

class_names = [
  "Ms. Rodriguez's 2nd Period PE", "Mr. Chen's 3rd Period PE",
  "Coach Williams — Morning Run", "7th Grade PE — Block 1",
  "7th Grade PE — Block 2", "8th Grade PE — Block 1",
  "8th Grade PE — Block 2", "Cross Country Team",
  "Ms. Kim's Advisory Challenge", "Mrs. Patel's Homeroom",
  "Staff Walking Group", "Coach Davis — Track Team",
  "6th Grade Step Challenge", "Lunch Miles Club",
  "After School Run Club", "Parent & Staff 5K Day",
]

# Small class events: 40–80 miles (one class period, 20–30 students)
80.times do
  Submission.create!(
    name:          class_names.sample,
    activity_date: school_year_start + rand(days_in_year),
    input_type:    "miles",
    input_value:   (rand * 40 + 40).round(1),
    flagged:       false,
    imported:      false
  )
end

# Large class events: 80–150 miles (multi-class or challenge day)
30.times do
  Submission.create!(
    name:          class_names.sample,
    activity_date: school_year_start + rand(days_in_year),
    input_type:    "miles",
    input_value:   (rand * 70 + 80).round(1),
    flagged:       false,
    imported:      false
  )
end

puts "  Added class-event submissions"

# ---------------------------------------------------------------------------
# Site-tagged submissions — gives the leaderboard a realistic spread
# ---------------------------------------------------------------------------
#
# Trace North leads, Trace South is competitive, East is behind, West is new.
# These are added on top of the untagged bulk data above.

site_submissions = [
  # Trace North — the leader (~1,400 miles)
  *60.times.map {
    input_type = rand < 0.55 ? "miles" : "steps"
    { name: names.sample, activity_date: school_year_start + rand(days_in_year),
      input_type: input_type,
      input_value: input_type == "miles" ? (rand * 20 + 5).round(2) : (rand * 12_000 + 3_000).round,
      site: "trace_north", flagged: false, imported: false }
  },

  # Trace South — close second (~1,100 miles)
  *55.times.map {
    input_type = rand < 0.5 ? "miles" : "steps"
    { name: names.sample, activity_date: school_year_start + rand(days_in_year),
      input_type: input_type,
      input_value: input_type == "miles" ? (rand * 16 + 4).round(2) : (rand * 10_000 + 2_500).round,
      site: "trace_south", flagged: false, imported: false }
  },

  # Trace East — a fair bit behind (~700 miles)
  *35.times.map {
    input_type = rand < 0.6 ? "miles" : "steps"
    { name: names.sample, activity_date: school_year_start + rand(days_in_year),
      input_type: input_type,
      input_value: input_type == "miles" ? (rand * 14 + 3).round(2) : (rand * 8_000 + 2_000).round,
      site: "trace_east", flagged: false, imported: false }
  },

  # Trace West — newest campus (~350 miles)
  *20.times.map {
    { name: names.sample, activity_date: school_year_start + rand(days_in_year),
      input_type: "miles",
      input_value: (rand * 12 + 3).round(2),
      site: "trace_west", flagged: false, imported: false }
  }
]

site_submissions.each { |attrs| Submission.create!(attrs) }
puts "  Added #{site_submissions.length} site-tagged submissions"

total_miles = Submission.total_miles.to_f.round(1)
puts "  Created #{Submission.count} submissions — #{total_miles} total miles"

# ---------------------------------------------------------------------------
# Milestones
# ---------------------------------------------------------------------------

Milestone.destroy_all
puts "  Cleared existing milestones"

# Mile markers calculated at 56.35 miles per degree of longitude at 32.72°N.
# All cities/landmarks are on or very near 32.72°N — the same latitude as San Diego.
milestones_data = [
  { name: "Phoenix, AZ",             mile_marker: 290,    milestone_type: "city",      description: "First major city east of San Diego — the Valley of the Sun.", fun_fact: "Phoenix is the hottest major city in the US, averaging 299 sunny days a year.", display_order: 1  },
  { name: "El Paso, TX",             mile_marker: 600,    milestone_type: "city",      description: "On the Rio Grande — half the city is in Mexico (Ciudad Juárez).", fun_fact: "El Paso is closer to LA than it is to Houston.",                    display_order: 2  },
  { name: "Dallas, TX",              mile_marker: 1_150,  milestone_type: "city",      description: "Big D — sitting almost exactly at 32.78°N, just north of our line.", fun_fact: "Dallas has more restaurants per capita than NYC.",                  display_order: 3  },
  { name: "Savannah, GA",            mile_marker: 2_030,  milestone_type: "city",      description: "The US East Coast — the Atlantic begins here.",              fun_fact: "Savannah's historic district has 22 park squares laid out in 1733.", display_order: 4  },
  { name: "Bermuda",                 mile_marker: 2_950,  milestone_type: "country",   description: "A British territory sitting at 32.3°N in the Atlantic.",    fun_fact: "Bermuda has no rivers or lakes — drinking water comes from rain.",   display_order: 5  },
  { name: "Mid-Atlantic Ocean",      mile_marker: 4_000,  milestone_type: "ocean",     description: "Halfway across the Atlantic — nothing but ocean in every direction.", fun_fact: "The Atlantic Ocean is widening by about 2.5 cm every year.",        display_order: 6  },
  { name: "Casablanca, Morocco",     mile_marker: 6_175,  milestone_type: "city",      description: "First landfall in Africa — the largest city in Morocco.",   fun_fact: "The Hassan II Mosque in Casablanca has the world's tallest minaret.", display_order: 7  },
  { name: "Tripoli, Libya",          mile_marker: 7_350,  milestone_type: "city",      description: "Tripoli sits at 32.9°N — almost exactly on our line.",      fun_fact: "Tripoli has been continuously inhabited for over 2,700 years.",     display_order: 8  },
  { name: "Alexandria, Egypt",       mile_marker: 8_300,  milestone_type: "city",      description: "Founded by Alexander the Great in 331 BC.",                 fun_fact: "The ancient Library of Alexandria was the largest library in the world.", display_order: 9  },
  { name: "Baghdad, Iraq",           mile_marker: 9_100,  milestone_type: "city",      description: "One of the oldest continuously inhabited cities on Earth.", fun_fact: "At its peak, Baghdad was the largest city in the world.",           display_order: 10 },
  { name: "Isfahan, Iran",           mile_marker: 9_515,  milestone_type: "city",      description: "Isfahan sits at 32.67°N — right on our latitude.",          fun_fact: "Isfahan's Naqsh-e Jahan Square is one of the largest in the world.", display_order: 11 },
  { name: "Islamabad, Pakistan",     mile_marker: 10_720, milestone_type: "city",      description: "One of the youngest capital cities in the world, founded in 1960.", fun_fact: "Islamabad was purpose-built as a capital — it replaced Karachi.",   display_order: 12 },
  { name: "Tibetan Plateau",         mile_marker: 11_730, milestone_type: "continent", description: "The 'Roof of the World' — average elevation over 14,000 ft.", fun_fact: "The Tibetan Plateau is so high it affects global wind patterns.",    display_order: 13 },
  { name: "Xi'an, China",            mile_marker: 12_745, milestone_type: "city",      description: "Ancient capital of China and eastern end of the Silk Road.", fun_fact: "Xi'an is home to the Terracotta Army — 8,000 life-size clay soldiers.", display_order: 14 },
  { name: "Nanjing, China",          mile_marker: 13_300, milestone_type: "city",      description: "Former capital of China, on the Yangtze River.",            fun_fact: "Nanjing's city wall, built in 1368, is the longest ancient city wall in the world.", display_order: 15 },
  { name: "Nagasaki, Japan",         mile_marker: 13_920, milestone_type: "city",      description: "Nagasaki sits at 32.75°N — almost exactly our latitude.",   fun_fact: "Nagasaki was Japan's only open port to the outside world for 200 years.", display_order: 16 },
  { name: "Pacific Ocean crossing",  mile_marker: 14_500, milestone_type: "ocean",     description: "The longest stretch — 5,800 miles of open Pacific ahead.",  fun_fact: "The Pacific Ocean is larger than all of Earth's land combined.",    display_order: 17 },
  { name: "International Date Line", mile_marker: 16_745, milestone_type: "country",   description: "You've crossed the date line — technically time-traveled.", fun_fact: "The date line zigzags to avoid splitting countries and island groups.", display_order: 18 },
  { name: "Pacific Coast in sight",  mile_marker: 19_500, milestone_type: "city",      description: "The California coast is close — nearly home.",              fun_fact: "The California coastline stretches 840 miles from Oregon to Mexico.", display_order: 19 },
  { name: "Back in San Diego!",      mile_marker: 20_286, milestone_type: "city",      description: "You made it all the way around the world at San Diego's latitude.", fun_fact: "San Diego averages 266 sunny days per year. Perfect place to start and end.", display_order: 20 },
]

milestones_data.each do |attrs|
  triggered = Submission.total_miles >= attrs[:mile_marker]
  Milestone.create!(
    attrs.merge(
      triggered:    triggered,
      triggered_at: triggered ? Time.current : nil
    )
  )
end

puts "  Created #{Milestone.count} milestones"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

puts ""
puts "Done."
puts "  Admin users:  #{AdminUser.count}"
puts "  Submissions:  #{Submission.count} (#{Submission.total_miles.to_f.round(1)} miles)"
puts "  Milestones:   #{Milestone.count}"
puts "  Progress:     #{(Submission.total_miles / 20_286.0 * 100).round(1)}% of the 20,286 mile goal"
puts ""
puts "Admin logins:  benjamin / password  |  admin / password"
