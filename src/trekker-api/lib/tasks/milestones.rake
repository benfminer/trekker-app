namespace :milestones do
  desc <<~DESC
    Upsert milestone data for the 32.72°N circumnavigation route.

    Safe to run in production at any time — never touches submissions or admin
    users. Uses find_or_initialize_by so existing records are updated in place
    and triggered/triggered_at state is preserved on already-triggered records.

    Usage:
      bin/rails milestones:seed
  DESC
  task seed: :environment do
    # Mile markers calculated at 56.35 miles per degree of longitude at 32.72°N
    # (20,286 miles / 360°). Every city/landmark is on or within ~1° of 32.72°N.
    milestones_data = [
      {
        name:           "Phoenix, AZ",
        mile_marker:    290,
        milestone_type: "city",
        description:    "First major city east of San Diego — the Valley of the Sun.",
        fun_fact:       "Phoenix is the hottest major city in the US, averaging 299 sunny days a year.",
        display_order:  1,
      },
      {
        name:           "El Paso, TX",
        mile_marker:    600,
        milestone_type: "city",
        description:    "On the Rio Grande — half the city is in Mexico (Ciudad Juárez).",
        fun_fact:       "El Paso is closer to LA than it is to Houston.",
        display_order:  2,
      },
      {
        name:           "Dallas, TX",
        mile_marker:    1_150,
        milestone_type: "city",
        description:    "Big D — sitting almost exactly at 32.78°N, just north of our line.",
        fun_fact:       "Dallas has more restaurants per capita than NYC.",
        display_order:  3,
      },
      {
        name:           "Savannah, GA",
        mile_marker:    2_030,
        milestone_type: "city",
        description:    "The US East Coast — the Atlantic begins here.",
        fun_fact:       "Savannah's historic district has 22 park squares laid out in 1733.",
        display_order:  4,
      },
      {
        name:           "Bermuda",
        mile_marker:    2_950,
        milestone_type: "country",
        description:    "A British territory sitting at 32.3°N in the Atlantic.",
        fun_fact:       "Bermuda has no rivers or lakes — drinking water comes from rain.",
        display_order:  5,
      },
      {
        name:           "Mid-Atlantic Ocean",
        mile_marker:    4_000,
        milestone_type: "ocean",
        description:    "Halfway across the Atlantic — nothing but ocean in every direction.",
        fun_fact:       "The Atlantic Ocean is widening by about 2.5 cm every year.",
        display_order:  6,
      },
      {
        name:           "Casablanca, Morocco",
        mile_marker:    6_175,
        milestone_type: "city",
        description:    "First landfall in Africa — the largest city in Morocco.",
        fun_fact:       "The Hassan II Mosque in Casablanca has the world's tallest minaret.",
        display_order:  7,
      },
      {
        name:           "Tripoli, Libya",
        mile_marker:    7_350,
        milestone_type: "city",
        description:    "Tripoli sits at 32.9°N — almost exactly on our line.",
        fun_fact:       "Tripoli has been continuously inhabited for over 2,700 years.",
        display_order:  8,
      },
      {
        name:           "Alexandria, Egypt",
        mile_marker:    8_300,
        milestone_type: "city",
        description:    "Founded by Alexander the Great in 331 BC.",
        fun_fact:       "The ancient Library of Alexandria was the largest library in the world.",
        display_order:  9,
      },
      {
        name:           "Baghdad, Iraq",
        mile_marker:    9_100,
        milestone_type: "city",
        description:    "One of the oldest continuously inhabited cities on Earth.",
        fun_fact:       "At its peak, Baghdad was the largest city in the world.",
        display_order:  10,
      },
      {
        name:           "Isfahan, Iran",
        mile_marker:    9_515,
        milestone_type: "city",
        description:    "Isfahan sits at 32.67°N — right on our latitude.",
        fun_fact:       "Isfahan's Naqsh-e Jahan Square is one of the largest in the world.",
        display_order:  11,
      },
      {
        name:           "Islamabad, Pakistan",
        mile_marker:    10_720,
        milestone_type: "city",
        description:    "One of the youngest capital cities in the world, founded in 1960.",
        fun_fact:       "Islamabad was purpose-built as a capital — it replaced Karachi.",
        display_order:  12,
      },
      {
        name:           "Tibetan Plateau",
        mile_marker:    11_730,
        milestone_type: "continent",
        description:    "The 'Roof of the World' — average elevation over 14,000 ft.",
        fun_fact:       "The Tibetan Plateau is so high it affects global wind patterns.",
        display_order:  13,
      },
      {
        name:           "Xi'an, China",
        mile_marker:    12_745,
        milestone_type: "city",
        description:    "Ancient capital of China and eastern end of the Silk Road.",
        fun_fact:       "Xi'an is home to the Terracotta Army — 8,000 life-size clay soldiers.",
        display_order:  14,
      },
      {
        name:           "Nanjing, China",
        mile_marker:    13_300,
        milestone_type: "city",
        description:    "Former capital of China, on the Yangtze River.",
        fun_fact:       "Nanjing's city wall, built in 1368, is the longest ancient city wall in the world.",
        display_order:  15,
      },
      {
        name:           "Nagasaki, Japan",
        mile_marker:    13_920,
        milestone_type: "city",
        description:    "Nagasaki sits at 32.75°N — almost exactly our latitude.",
        fun_fact:       "Nagasaki was Japan's only open port to the outside world for 200 years.",
        display_order:  16,
      },
      {
        name:           "Pacific Ocean crossing",
        mile_marker:    14_500,
        milestone_type: "ocean",
        description:    "The longest stretch — 5,800 miles of open Pacific ahead.",
        fun_fact:       "The Pacific Ocean is larger than all of Earth's land combined.",
        display_order:  17,
      },
      {
        name:           "International Date Line",
        mile_marker:    16_745,
        milestone_type: "country",
        description:    "You've crossed the date line — technically time-traveled.",
        fun_fact:       "The date line zigzags to avoid splitting countries and island groups.",
        display_order:  18,
      },
      {
        name:           "Pacific Coast in sight",
        mile_marker:    19_500,
        milestone_type: "city",
        description:    "The California coast is close — nearly home.",
        fun_fact:       "The California coastline stretches 840 miles from Oregon to Mexico.",
        display_order:  19,
      },
      {
        name:           "Back in San Diego!",
        mile_marker:    20_286,
        milestone_type: "city",
        description:    "You made it all the way around the world at San Diego's latitude.",
        fun_fact:       "San Diego averages 266 sunny days per year. Perfect place to start and end.",
        display_order:  20,
      },
    ]

    total_miles = Submission.total_miles.to_f
    created    = 0
    updated    = 0

    milestones_data.each do |attrs|
      record = Milestone.find_or_initialize_by(name: attrs[:name])
      new_record = record.new_record?

      record.assign_attributes(
        mile_marker:    attrs[:mile_marker],
        milestone_type: attrs[:milestone_type],
        description:    attrs[:description],
        fun_fact:       attrs[:fun_fact],
        display_order:  attrs[:display_order],
      )

      # Only set triggered state on new records — never revert an already-triggered
      # milestone, and never re-trigger one that was manually reset.
      if new_record
        already_passed = total_miles >= attrs[:mile_marker]
        record.triggered    = already_passed
        record.triggered_at = already_passed ? Time.current : nil
      end

      record.save!
      new_record ? created += 1 : updated += 1
    end

    puts "milestones:seed complete — #{created} created, #{updated} updated (#{Milestone.count} total)"
    puts "  Current total miles: #{total_miles.round(1)}"
    puts "  Triggered: #{Milestone.where(triggered: true).count} / #{Milestone.count}"

    next_m = Milestone.next_untriggered
    if next_m
      puts "  Next milestone: #{next_m.name} at #{next_m.mile_marker} miles " \
           "(#{(next_m.mile_marker.to_f - total_miles).round(1)} miles away)"
    else
      puts "  All milestones triggered — goal complete!"
    end
  end
end
