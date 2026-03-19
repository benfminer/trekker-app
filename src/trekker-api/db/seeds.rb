# Seeds — development fake data for TRACE Trekkers
#
# Run with: rails db:seed
# Safe to re-run: uses find_or_initialize_by for admin users, destroys and
# recreates submissions and milestones so counts stay predictable.
#
# What gets seeded:
#   - 2 admin users (benjamin, admin)
#   - ~165 submissions spread over the current school year, mix of miles/steps,
#     individual and class names, giving ~7,000 total miles
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

total_miles = Submission.total_miles.to_f.round(1)
puts "  Created #{Submission.count} submissions — #{total_miles} total miles"

# ---------------------------------------------------------------------------
# Milestones
# ---------------------------------------------------------------------------

Milestone.destroy_all
puts "  Cleared existing milestones"

milestones_data = [
  { name: "Los Angeles, CA",         mile_marker: 120,    milestone_type: "city",     description: "First major city — LA is just up the coast.",              fun_fact: "LA has more cars than people.",                                               display_order: 1  },
  { name: "Pacific Ocean begins",    mile_marker: 500,    milestone_type: "ocean",    description: "You've left the US coast. Open Pacific ahead.",             fun_fact: "The Pacific covers more than 30% of Earth's surface.",                display_order: 2  },
  { name: "Hawaii",                  mile_marker: 2_550,  milestone_type: "city",     description: "Halfway across the Pacific — the Hawaiian Islands.",         fun_fact: "Hawaii is the only US state that grows coffee commercially.",         display_order: 3  },
  { name: "International Date Line", mile_marker: 5_100,  milestone_type: "country",  description: "Cross the date line — you just time-traveled.",             fun_fact: "Crossing means skipping or repeating a calendar day.",                display_order: 4  },
  { name: "Tokyo, Japan",            mile_marker: 5_470,  milestone_type: "city",     description: "Welcome to Japan.",                                         fun_fact: "Tokyo has more Michelin-starred restaurants than any other city.",    display_order: 5  },
  { name: "Beijing, China",          mile_marker: 6_250,  milestone_type: "city",     description: "The capital of China.",                                     fun_fact: "The Great Wall of China stretches over 13,000 miles.",               display_order: 6  },
  { name: "Himalayas",               mile_marker: 7_200,  milestone_type: "continent", description: "The world's highest mountain range.",                      fun_fact: "Mount Everest grows about 4mm taller every year.",                   display_order: 7  },
  { name: "New Delhi, India",        mile_marker: 7_800,  milestone_type: "city",     description: "Capital of India.",                                         fun_fact: "India has more vegetarians than any other country.",                 display_order: 8  },
  { name: "Tehran, Iran",            mile_marker: 9_100,  milestone_type: "city",     description: "Capital of Iran, in the heart of Central Asia.",            fun_fact: "Iran is home to one of the world's oldest civilizations.",           display_order: 9  },
  { name: "Athens, Greece",          mile_marker: 10_500, milestone_type: "city",     description: "Birthplace of democracy.",                                  fun_fact: "Athens has been continuously inhabited for over 3,000 years.",       display_order: 10 },
  { name: "Rome, Italy",             mile_marker: 11_100, milestone_type: "city",     description: "The Eternal City.",                                         fun_fact: "Rome has more fountains than any other city in the world.",          display_order: 11 },
  { name: "Paris, France",           mile_marker: 11_700, milestone_type: "city",     description: "The City of Light.",                                        fun_fact: "The Eiffel Tower grows 6 inches taller in summer due to heat expansion.", display_order: 12 },
  { name: "London, UK",              mile_marker: 12_100, milestone_type: "city",     description: "One of the world's great capitals.",                        fun_fact: "London has over 170 museums.",                                       display_order: 13 },
  { name: "Atlantic Ocean begins",   mile_marker: 12_600, milestone_type: "ocean",    description: "Leaving Europe — the Atlantic stretches ahead.",            fun_fact: "The Atlantic widens about 2.5 cm every year.",                      display_order: 14 },
  { name: "Azores Islands",          mile_marker: 13_700, milestone_type: "country",  description: "A Portuguese archipelago in the mid-Atlantic.",             fun_fact: "The Azores sit on the Mid-Atlantic Ridge — geologically active.",    display_order: 15 },
  { name: "New York City, NY",       mile_marker: 15_500, milestone_type: "city",     description: "The Big Apple — you've crossed the Atlantic.",              fun_fact: "NYC is home to people from more than 200 countries.",                display_order: 16 },
  { name: "Chicago, IL",             mile_marker: 16_800, milestone_type: "city",     description: "The Windy City.",                                           fun_fact: "Chicago invented the skyscraper.",                                   display_order: 17 },
  { name: "Denver, CO",              mile_marker: 18_200, milestone_type: "city",     description: "Mile High City — almost home.",                             fun_fact: "Denver has 300+ days of sunshine per year.",                        display_order: 18 },
  { name: "Las Vegas, NV",           mile_marker: 19_500, milestone_type: "city",     description: "The Nevada desert — San Diego is close.",                   fun_fact: "Las Vegas uses 3 billion gallons of water per year in the desert.",  display_order: 19 },
  { name: "Back in San Diego!",      mile_marker: 20_286, milestone_type: "city",     description: "You made it around the world at San Diego's latitude.",     fun_fact: "San Diego averages 266 sunny days per year. Good place to start and end.", display_order: 20 },
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
