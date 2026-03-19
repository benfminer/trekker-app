class AddFlaggedToSubmissions < ActiveRecord::Migration[8.1]
  def change
    add_column :submissions, :flagged, :boolean, null: false, default: false
    add_index :submissions, :flagged, name: "idx_submissions_flagged"
  end
end
