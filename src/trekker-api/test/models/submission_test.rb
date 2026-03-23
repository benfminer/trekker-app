require "test_helper"

class SubmissionTest < ActiveSupport::TestCase
  # ---------------------------------------------------------------------------
  # Validation — happy paths
  # ---------------------------------------------------------------------------

  test "valid miles submission saves successfully" do
    sub = Submission.new(
      name:          "Test User",
      activity_date: Date.today,
      input_type:    "miles",
      input_value:   10.0
    )
    assert sub.valid?, sub.errors.full_messages.inspect
  end

  test "valid steps submission saves successfully" do
    sub = Submission.new(
      name:          "Test Class",
      activity_date: Date.today,
      input_type:    "steps",
      input_value:   5000.0
    )
    assert sub.valid?, sub.errors.full_messages.inspect
  end

  # ---------------------------------------------------------------------------
  # Validation — failure cases
  # ---------------------------------------------------------------------------

  test "requires name" do
    sub = Submission.new(activity_date: Date.today, input_type: "miles", input_value: 5.0)
    assert_not sub.valid?
    assert_includes sub.errors[:name], "can't be blank"
  end

  test "requires activity_date" do
    sub = Submission.new(name: "Someone", input_type: "miles", input_value: 5.0)
    assert_not sub.valid?
    assert_includes sub.errors[:activity_date], "can't be blank"
  end

  test "requires input_type" do
    sub = Submission.new(name: "Someone", activity_date: Date.today, input_value: 5.0)
    assert_not sub.valid?
    assert_includes sub.errors[:input_type], "can't be blank"
  end

  test "rejects invalid input_type" do
    sub = Submission.new(name: "Someone", activity_date: Date.today,
                         input_type: "kilometers", input_value: 5.0)
    assert_not sub.valid?
    assert sub.errors[:input_type].any?
  end

  test "requires input_value" do
    sub = Submission.new(name: "Someone", activity_date: Date.today, input_type: "miles")
    assert_not sub.valid?
  end

  test "rejects input_value of zero" do
    sub = Submission.new(name: "Someone", activity_date: Date.today,
                         input_type: "miles", input_value: 0)
    assert_not sub.valid?
  end

  test "rejects negative input_value" do
    sub = Submission.new(name: "Someone", activity_date: Date.today,
                         input_type: "miles", input_value: -5.0)
    assert_not sub.valid?
  end

  test "rejects miles input_value above 500" do
    sub = Submission.new(name: "Someone", activity_date: Date.today,
                         input_type: "miles", input_value: 501.0)
    assert_not sub.valid?
    assert sub.errors[:input_value].any?
  end

  test "accepts miles input_value at the 500 limit" do
    sub = Submission.new(name: "Someone", activity_date: Date.today,
                         input_type: "miles", input_value: 500.0)
    assert sub.valid?, sub.errors.full_messages.inspect
  end

  test "rejects steps input_value above 1_250_000" do
    sub = Submission.new(name: "Someone", activity_date: Date.today,
                         input_type: "steps", input_value: 1_250_001.0)
    assert_not sub.valid?
    assert sub.errors[:input_value].any?
  end

  test "accepts steps input_value at the 1_250_000 limit" do
    sub = Submission.new(name: "Someone", activity_date: Date.today,
                         input_type: "steps", input_value: 1_250_000.0)
    assert sub.valid?, sub.errors.full_messages.inspect
  end

  # ---------------------------------------------------------------------------
  # Step conversion
  # ---------------------------------------------------------------------------

  test "converts steps to miles at 2500 steps per mile" do
    sub = Submission.new(
      name:          "Runner",
      activity_date: Date.today,
      input_type:    "steps",
      input_value:   2500.0
    )
    sub.valid?
    assert_equal 1.0, sub.converted_miles.to_f
  end

  test "converted_miles equals input_value for miles input" do
    sub = Submission.new(
      name:          "Runner",
      activity_date: Date.today,
      input_type:    "miles",
      input_value:   7.5
    )
    sub.valid?
    assert_equal 7.5, sub.converted_miles.to_f
  end

  test "handles fractional steps conversion" do
    sub = Submission.new(
      name:          "Runner",
      activity_date: Date.today,
      input_type:    "steps",
      input_value:   1000.0
    )
    sub.valid?
    assert_in_delta 0.4, sub.converted_miles.to_f, 0.001
  end

  # ---------------------------------------------------------------------------
  # total_miles class method
  # ---------------------------------------------------------------------------

  test "total_miles returns the sum of all converted_miles" do
    # Fixture total: miles_submission(10) + steps_submission(2) +
    #                imported_submission(5) + flagged_submission(2025) +
    #                north_submission(20) + south_submission(10) = 2072
    assert_equal 2072.0, Submission.total_miles.to_f
  end

  # ---------------------------------------------------------------------------
  # Scopes
  # ---------------------------------------------------------------------------

  test "imported scope returns only imported records" do
    assert Submission.imported.all? { |s| s.imported == true }
    assert_equal 2, Submission.imported.count  # imported + flagged fixtures
  end

  test "not_imported scope excludes imported records" do
    assert Submission.not_imported.none? { |s| s.imported == true }
  end

  test "flagged scope returns only flagged records" do
    assert Submission.flagged.all? { |s| s.flagged == true }
  end
end
