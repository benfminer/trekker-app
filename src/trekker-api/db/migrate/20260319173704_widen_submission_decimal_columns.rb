# Widen input_value and converted_miles from precision 10 to 12.
# Original precision(10,4) caps at ~999,999 — insufficient for large group step
# submissions (e.g. 60 students x 80min walk = 1,040,000 steps on a single row).
# precision(12,4) supports up to ~99,999,999, which is safe for any realistic entry.
class WidenSubmissionDecimalColumns < ActiveRecord::Migration[8.1]
  def change
    change_column :submissions, :input_value,      :decimal, precision: 12, scale: 4, null: false
    change_column :submissions, :converted_miles,  :decimal, precision: 12, scale: 4, null: false
  end
end
