# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_18_000005) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "admin_sessions", force: :cascade do |t|
    t.bigint "admin_user_id", null: false
    t.datetime "created_at", null: false
    t.string "created_from_ip"
    t.datetime "expires_at", null: false
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["admin_user_id"], name: "idx_admin_sessions_admin_user_id"
    t.index ["expires_at"], name: "idx_admin_sessions_expires_at"
    t.index ["token_digest"], name: "uq_admin_sessions_token_digest", unique: true
  end

  create_table "admin_users", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.string "display_name"
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.string "username", null: false
    t.index ["username"], name: "uq_admin_users_username", unique: true
  end

  create_table "milestones", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "display_order"
    t.text "fun_fact"
    t.decimal "mile_marker", precision: 10, scale: 4, null: false
    t.string "milestone_type", null: false
    t.string "name", null: false
    t.boolean "triggered", default: false, null: false
    t.datetime "triggered_at"
    t.datetime "updated_at", null: false
    t.index ["mile_marker"], name: "idx_milestones_mile_marker"
    t.index ["milestone_type"], name: "idx_milestones_type"
    t.index ["triggered", "mile_marker"], name: "idx_milestones_triggered_mile_marker"
    t.index ["triggered"], name: "idx_milestones_triggered"
  end

  create_table "submissions", force: :cascade do |t|
    t.date "activity_date", null: false
    t.decimal "converted_miles", precision: 10, scale: 4, null: false
    t.datetime "created_at", null: false
    t.boolean "flagged", default: false, null: false
    t.boolean "imported", default: false, null: false
    t.string "input_type", null: false
    t.decimal "input_value", precision: 10, scale: 4, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["activity_date"], name: "idx_submissions_activity_date"
    t.index ["converted_miles"], name: "idx_submissions_converted_miles"
    t.index ["created_at"], name: "idx_submissions_created_at"
    t.index ["flagged"], name: "idx_submissions_flagged"
    t.index ["imported"], name: "idx_submissions_imported"
  end

  add_foreign_key "admin_sessions", "admin_users"
end
