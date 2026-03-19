require "test_helper"

class MilestoneTest < ActiveSupport::TestCase
  # ---------------------------------------------------------------------------
  # Validation
  # ---------------------------------------------------------------------------

  test "valid milestone saves successfully" do
    m = Milestone.new(
      name:           "Morocco",
      milestone_type: "country",
      mile_marker:    1500.0
    )
    assert m.valid?, m.errors.full_messages.inspect
  end

  test "requires name" do
    m = Milestone.new(milestone_type: "country", mile_marker: 100.0)
    assert_not m.valid?
    assert_includes m.errors[:name], "can't be blank"
  end

  test "requires milestone_type" do
    m = Milestone.new(name: "Morocco", mile_marker: 100.0)
    assert_not m.valid?
    assert m.errors[:milestone_type].any?
  end

  test "rejects invalid milestone_type" do
    m = Milestone.new(name: "Morocco", milestone_type: "landmark", mile_marker: 100.0)
    assert_not m.valid?
  end

  test "requires mile_marker" do
    m = Milestone.new(name: "Morocco", milestone_type: "country")
    assert_not m.valid?
  end

  test "accepts mile_marker of zero" do
    m = Milestone.new(name: "Start", milestone_type: "city", mile_marker: 0.0)
    assert m.valid?, m.errors.full_messages.inspect
  end

  # ---------------------------------------------------------------------------
  # Scopes
  # ---------------------------------------------------------------------------

  test "untriggered scope excludes triggered milestones" do
    assert Milestone.untriggered.none? { |m| m.triggered == true }
  end

  test "crossed_by returns untriggered milestones at or below the given total" do
    # near_milestone (100 miles) should be returned when total >= 100
    crossed = Milestone.crossed_by(2042.0)
    assert crossed.any? { |m| m.name == "Mexico" }
    assert crossed.none? { |m| m.name == "Pacific Ocean" }  # 5000 miles
    assert crossed.none? { |m| m.triggered == true }
  end

  test "crossed_by returns nothing when total is below all markers" do
    assert_empty Milestone.crossed_by(0.0001)
  end

  test "next_untriggered returns the lowest untriggered milestone by mile_marker" do
    next_m = Milestone.next_untriggered
    assert_not_nil next_m
    # near_milestone (100.0) is lower than far_milestone (5000.0)
    assert_equal "Mexico", next_m.name
  end
end
