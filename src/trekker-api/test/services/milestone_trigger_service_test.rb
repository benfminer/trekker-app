require "test_helper"

class MilestoneTriggerServiceTest < ActiveSupport::TestCase
  # Fixture submission total = 2042 miles.
  # near_milestone is at 100.0 miles — should be triggered by .call.
  # far_milestone is at 5000.0 miles — should not be triggered.

  test "triggers all milestones crossed by the current total" do
    triggered = MilestoneTriggerService.call

    assert triggered.any? { |m| m.name == "Mexico" },
           "Expected Mexico milestone to be triggered"
  end

  test "does not trigger milestones beyond the current total" do
    MilestoneTriggerService.call

    pacific = milestones(:far_milestone)
    pacific.reload
    assert_not pacific.triggered
  end

  test "sets triggered = true and triggered_at on crossed milestones" do
    MilestoneTriggerService.call

    mexico = milestones(:near_milestone)
    mexico.reload
    assert mexico.triggered
    assert_not_nil mexico.triggered_at
  end

  test "does not re-trigger already-triggered milestones" do
    # San Diego Start (already_triggered fixture) has triggered = true
    original_triggered_at = milestones(:already_triggered).triggered_at

    MilestoneTriggerService.call

    milestones(:already_triggered).reload
    assert_equal original_triggered_at, milestones(:already_triggered).triggered_at,
                 "triggered_at should not change for already-triggered milestones"
  end

  test "returns an empty array when no milestones are newly crossed" do
    # Mark near_milestone as already triggered so nothing new should fire
    milestones(:near_milestone).update!(triggered: true, triggered_at: Time.current)

    result = MilestoneTriggerService.call
    assert_empty result
  end

  test "returns an empty array when there are no submissions at all" do
    Submission.delete_all

    result = MilestoneTriggerService.call
    assert_empty result
  end

  test "can trigger multiple milestones in a single call" do
    # Push far_milestone marker below the current total so both should trigger
    milestones(:far_milestone).update!(mile_marker: 50.0)

    triggered = MilestoneTriggerService.call

    assert triggered.length >= 2,
           "Expected at least 2 milestones to trigger when two are crossed"
  end
end
