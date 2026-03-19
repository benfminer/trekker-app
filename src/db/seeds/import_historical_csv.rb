# db/seeds/import_historical_csv.rb
#
# Imports historical submission data from the TRACE Trekkers Google Form CSV export.
#
# Usage:
#   rails runner db/seeds/import_historical_csv.rb
#   rails runner db/seeds/import_historical_csv.rb -- --dry-run
#   rails runner db/seeds/import_historical_csv.rb -- --file path/to/other.csv
#
# CSV column layout (0-indexed):
#   0: Timestamp          — when the form was submitted (MM/DD/YYYY H:MM:SS)
#   1: Name/Class Name    — submitter name or class name
#   2: Date               — activity date (MM/DD/YYYY)
#   3: Miles or Steps     — "Miles" or "Steps" (case-insensitive)
#   4: Number of Steps or Miles — raw numeric value (may have garbage like "1.36 miles")
#   5: Conversion         — pre-computed converted miles from the spreadsheet
#   6-7: Extra columns    — totals annotation in row 1, empty everywhere else; ignored
#
# Step conversion rate: 2,500 steps per mile (per PROJECT_VISION.md).
#
# Data quality notes from CSV audit (2026-03-18):
#   - Row 185 (Ecc, 12/5/2025): input_value = 2025 miles. Almost certainly a
#     typo (user typed the year). Imported as-is; admin should review and delete.
#   - Row 179 (Ecc, 12/4/2025): steps = "5.062" — likely meant 5,062.
#     The script treats this as 5.062 steps → 0.002 miles (negligible). Flagged.
#   - Row 279 (Marco, 3/18/2026): input_value = "1.36 miles" — units string
#     embedded. The script strips non-numeric characters before parsing.
#   - responses.csv and "TRACE Trekkers (Responses) - Form Responses 1.csv"
#     are byte-for-byte identical. Only import one.
#   - The script is idempotent: re-running it will not create duplicate records.
#     Deduplication key: (name, activity_date, input_type, input_value).

require "csv"

STEPS_PER_MILE = 2_500.0

# Parse command-line flags passed after --
dry_run = ARGV.include?("--dry-run")
file_flag_index = ARGV.index("--file")
csv_path = if file_flag_index && ARGV[file_flag_index + 1]
  ARGV[file_flag_index + 1]
else
  File.expand_path(
    "../../../previous_data/responses.csv",
    __dir__
  )
end

unless File.exist?(csv_path)
  puts "ERROR: CSV file not found at #{csv_path}"
  exit 1
end

puts "=" * 60
puts "TRACE Trekkers — Historical CSV Import"
puts "File:    #{csv_path}"
puts "Mode:    #{dry_run ? "DRY RUN (no writes)" : "LIVE"}"
puts "=" * 60
puts

# Counters
imported_count  = 0
skipped_count   = 0
duplicate_count = 0
error_rows      = []
flagged_rows    = []

# ---------------------------------------------------------------------------
# Helper: parse a potentially messy numeric string into a Float.
# Handles:
#   "1.36 miles"  → 1.36   (strip trailing text)
#   "5.062"       → 5.062  (a suspiciously small step count — imported as-is)
#   "1,040,000"   → 1040000.0 (commas in large numbers)
#   ""            → nil
# ---------------------------------------------------------------------------
def parse_number(raw)
  return nil if raw.nil? || raw.strip.empty?
  # Remove everything that isn't a digit, period, or leading minus sign
  cleaned = raw.strip.gsub(/[^\d.\-]/, "")
  cleaned.empty? ? nil : cleaned.to_f
end

# ---------------------------------------------------------------------------
# Helper: parse a date string in MM/DD/YYYY format.
# Returns a Date or nil on failure.
# ---------------------------------------------------------------------------
def parse_date(raw)
  return nil if raw.nil? || raw.strip.empty?
  Date.strptime(raw.strip, "%m/%d/%Y")
rescue Date::Error
  nil
end

# ---------------------------------------------------------------------------
# Helper: parse the timestamp column (MM/DD/YYYY H:MM:SS).
# Returns a Time or nil on failure.
# ---------------------------------------------------------------------------
def parse_timestamp(raw)
  return nil if raw.nil? || raw.strip.empty?
  Time.strptime(raw.strip, "%m/%d/%Y %H:%M:%S")
rescue ArgumentError
  nil
end

# ---------------------------------------------------------------------------
# Main import loop
# ---------------------------------------------------------------------------
CSV.foreach(csv_path, headers: true) do |row|
  row_number = $. # current line number in the file

  raw_timestamp   = row["Timestamp"]
  raw_name        = row["Name/Class Name"]
  raw_date        = row["Date"]
  raw_input_type  = row["Miles or Steps"]
  raw_input_value = row["Number of Steps or Miles"]
  raw_conversion  = row["Conversion"]

  # --- Validate required fields -----------------------------------------

  if raw_name.nil? || raw_name.strip.empty?
    error_rows << { row: row_number, reason: "Missing name", data: row.to_h }
    next
  end

  activity_date = parse_date(raw_date)
  if activity_date.nil?
    error_rows << { row: row_number, reason: "Cannot parse date: #{raw_date.inspect}", data: row.to_h }
    next
  end

  input_type = raw_input_type&.strip&.downcase
  unless %w[miles steps].include?(input_type)
    error_rows << { row: row_number, reason: "Unknown input type: #{raw_input_type.inspect}", data: row.to_h }
    next
  end

  input_value = parse_number(raw_input_value)
  if input_value.nil? || input_value <= 0
    error_rows << { row: row_number, reason: "Invalid input value: #{raw_input_value.inspect}", data: row.to_h }
    next
  end

  # --- Flag suspicious values -------------------------------------------

  if input_type == "miles" && input_value > 200
    flagged_rows << {
      row: row_number,
      reason: "Unusually large miles value: #{input_value}",
      name: raw_name.strip,
      date: raw_date
    }
  end

  if input_type == "steps" && input_value < 10
    flagged_rows << {
      row: row_number,
      reason: "Suspiciously small steps value: #{input_value} (possible decimal entry error)",
      name: raw_name.strip,
      date: raw_date
    }
  end

  # --- Compute converted miles ------------------------------------------
  #
  # Strategy: use the CSV's pre-computed Conversion column if it's a clean
  # number. Otherwise recompute from scratch. This handles rows where the
  # original spreadsheet had a formula error or left the field blank.

  conversion_from_csv = parse_number(raw_conversion)

  converted_miles = if conversion_from_csv && conversion_from_csv > 0
    conversion_from_csv.round(4)
  elsif input_type == "miles"
    input_value.round(4)
  else
    (input_value / STEPS_PER_MILE).round(4)
  end

  # --- Idempotency check ------------------------------------------------
  #
  # Deduplication key: name + activity_date + input_type + input_value.
  # We do not use the timestamp column as a key because some rows have
  # identical timestamps (batch entries submitted at midnight).

  name = raw_name.strip

  exists = Submission.exists?(
    name: name,
    activity_date: activity_date,
    input_type: input_type,
    input_value: input_value
  )

  if exists
    duplicate_count += 1
    next
  end

  # --- Parse original submitted_at timestamp for the record -------------
  #
  # The CSV timestamp reflects when the Google Form was submitted, not when
  # we're importing. We store this as created_at via a manual assignment
  # so the admin UI shows historically accurate submission times.

  original_timestamp = parse_timestamp(raw_timestamp)

  # --- Build the record -------------------------------------------------

  submission = Submission.new(
    name: name,
    activity_date: activity_date,
    input_type: input_type,
    input_value: input_value,
    converted_miles: converted_miles,
    imported: true
  )

  # Backfill the original form submission timestamp.
  # We override created_at after save to preserve historical accuracy.
  unless dry_run
    if submission.save
      # Override timestamps to reflect the original form submission time.
      if original_timestamp
        submission.update_columns(
          created_at: original_timestamp,
          updated_at: original_timestamp
        )
      end
      imported_count += 1
    else
      error_rows << {
        row: row_number,
        reason: "Model validation failed: #{submission.errors.full_messages.join(", ")}",
        data: row.to_h
      }
    end
  else
    # Dry run: just count what would be imported
    imported_count += 1
    puts "  [DRY RUN] Would import: #{name} | #{activity_date} | #{input_type} | #{input_value} → #{converted_miles} mi"
  end
end

# ---------------------------------------------------------------------------
# Summary report
# ---------------------------------------------------------------------------

puts
puts "=" * 60
puts "Import complete#{dry_run ? " (DRY RUN)" : ""}"
puts "-" * 60
puts "  Imported:   #{imported_count}"
puts "  Duplicates: #{duplicate_count} (skipped)"
puts "  Errors:     #{error_rows.size}"
puts "  Flagged:    #{flagged_rows.size}"
puts

if flagged_rows.any?
  puts "FLAGGED ROWS (review in admin dashboard):"
  flagged_rows.each do |f|
    puts "  Row #{f[:row]}: #{f[:reason]} — #{f[:name]} on #{f[:date]}"
  end
  puts
end

if error_rows.any?
  puts "ERROR ROWS (not imported):"
  error_rows.each do |e|
    puts "  Row #{e[:row]}: #{e[:reason]}"
    puts "    Data: #{e[:data].inspect}" if e[:data]
  end
  puts
end

unless dry_run
  total_miles = Submission.sum(:converted_miles)
  puts "Current total miles in database: #{total_miles.round(2)}"
  puts "Total submission records:        #{Submission.count}"
end

puts "=" * 60
