# Migration: create_milestones
#
# Creates the milestones table. Milestones are pre-seeded records representing
# notable points along the circumnavigation route — country borders, continent
# crossings, ocean/sea crossings, and major cities or capitals.
#
# Each milestone has a `mile_marker`: the cumulative distance from San Diego
# at which this milestone is reached. When the group's total miles crosses
# a mile_marker, the milestone is marked triggered.
#
# Design note on `triggered` + `triggered_at`:
#   Milestones are never retroactively un-triggered. Once the group crosses
#   a threshold, that celebration has happened. The admin cannot un-trigger
#   a milestone — they can only delete submissions that reduce the total.
#   If that happens, the triggered flag stays true (we already celebrated).
#
# Design note on `milestone_type`:
#   Values: "country", "continent", "ocean", "city"
#   Stored as a string. The frontend uses this to determine the celebration
#   style (continent crossings get bigger treatment than city arrivals).

class CreateMilestones < ActiveRecord::Migration[7.2]
  def change
    create_table :milestones do |t|
      # Human-readable name: "Morocco", "Atlantic Ocean", "Africa",
      # "Dakar, Senegal", etc.
      t.string :name, null: false

      # Category of this milestone. Drives celebration UI intensity.
      # Allowed values: "country", "continent", "ocean", "city"
      t.string :milestone_type, null: false

      # Cumulative miles from San Diego at which this milestone triggers.
      # Precision matches submissions.converted_miles for consistent comparison.
      t.decimal :mile_marker, precision: 10, scale: 4, null: false

      # Optional short description for the celebration UI.
      # e.g. "You've crossed into Africa!" or "Halfway around the world!"
      t.text :description

      # Optional fun fact or flavor text for the celebration card.
      t.text :fun_fact

      # True once the group's cumulative total has crossed this mile_marker.
      t.boolean :triggered, null: false, default: false

      # When the milestone was first triggered. Null until triggered = true.
      t.datetime :triggered_at

      # Display order within a milestone_type group, if needed for the UI.
      t.integer :display_order

      t.timestamps
    end

    # The primary query for the milestone check: find all untriggered
    # milestones with a mile_marker <= current total miles.
    add_index :milestones, :mile_marker, name: "idx_milestones_mile_marker"
    add_index :milestones, :triggered, name: "idx_milestones_triggered"
    add_index :milestones, :milestone_type, name: "idx_milestones_type"

    # Composite index for the trigger check query:
    # WHERE triggered = false AND mile_marker <= :total
    add_index :milestones, [:triggered, :mile_marker],
              name: "idx_milestones_triggered_mile_marker"
  end
end
