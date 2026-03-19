# lib/tasks/import_csv.rake
#
# Imports historical submission data from a CSV export into the submissions table.
#
# Usage:
#   rails import:csv                              # imports previous_data/responses.csv
#   rails import:csv CSV=path/to/other.csv        # imports a specific file
#   rails import:csv DRY_RUN=true                 # parses and validates without writing
#
# Notes:
#   - Sets imported: true on every record so admin can filter historical vs. live data
#   - Skips rows that fail validation and reports them at the end
#   - Safe to inspect with DRY_RUN=true before committing
#   - NOT idempotent — running twice will create duplicates. Check before re-running.
#
# CSV column mapping:
#   Timestamp             -> ignored (not the activity date; reflects form submission time)
#   Name/Class Name       -> name
#   Date                  -> activity_date (parsed from M/D/YYYY)
#   Miles or Steps        -> input_type (downcased to "miles" or "steps")
#   Number of Steps/Miles -> input_value
#   Conversion            -> ignored (model computes converted_miles from input_value)
#   Columns 7-8           -> ignored (spreadsheet artifacts)
#
# Step conversion note:
#   The original CSV pre-computed conversions at ~2,250 steps/mile. This app uses
#   2,500 steps/mile (Submission::STEPS_PER_MILE). The model recomputes converted_miles
#   automatically, so historical step entries will reflect the app's standard rate.
#   Impact is small — most entries are miles, not steps.

require "csv"

namespace :import do
  desc "Import historical submissions from CSV (default: previous_data/responses.csv)"
  task csv: :environment do
    csv_path = ENV.fetch("CSV", Rails.root.join("../../previous_data/responses.csv").to_s)
    dry_run   = ENV["DRY_RUN"] == "true"

    unless File.exist?(csv_path)
      abort "CSV file not found: #{csv_path}"
    end

    puts dry_run ? "DRY RUN — no records will be written." : "Importing from #{csv_path}..."
    puts

    imported_count = 0
    skipped_count  = 0
    errors         = []

    CSV.foreach(csv_path, headers: true) do |row|
      row_number = $. # current line number

      name         = row["Name/Class Name"]&.strip
      date_raw     = row["Date"]&.strip
      input_type   = row["Miles or Steps"]&.strip&.downcase
      input_value  = row["Number of Steps or Miles"]&.strip

      # Skip rows missing required fields (e.g., trailing spreadsheet rows)
      if name.blank? || date_raw.blank? || input_type.blank? || input_value.blank?
        skipped_count += 1
        next
      end

      # Parse M/D/YYYY date format
      begin
        activity_date = Date.strptime(date_raw, "%m/%d/%Y")
      rescue Date::Error
        errors << "Row #{row_number}: unparseable date '#{date_raw}' for '#{name}' — skipped"
        skipped_count += 1
        next
      end

      # Coerce input_value to float — strip trailing non-numeric text (e.g. "1.36 miles")
      input_value_f = Float(input_value.gsub(/[^\d.]/, "")) rescue nil
      if input_value_f.nil?
        errors << "Row #{row_number}: non-numeric value '#{input_value}' for '#{name}' — skipped"
        skipped_count += 1
        next
      end

      submission = Submission.new(
        name:          name,
        activity_date: activity_date,
        input_type:    input_type,
        input_value:   input_value_f,
        imported:      true
      )

      if submission.valid?
        unless dry_run
          submission.save!
        end
        imported_count += 1
      else
        errors << "Row #{row_number}: validation failed for '#{name}' — #{submission.errors.full_messages.join(", ")}"
        skipped_count += 1
      end
    end

    # Summary
    puts "Results:"
    puts "  Imported : #{imported_count}"
    puts "  Skipped  : #{skipped_count}"

    if errors.any?
      puts
      puts "Errors (#{errors.count}):"
      errors.each { |e| puts "  #{e}" }
    end

    unless dry_run
      total = Submission.total_miles.to_f.round(2)
      puts
      puts "Total miles in DB now: #{total}"
    end

    puts
    puts dry_run ? "Dry run complete. Run without DRY_RUN=true to write." : "Done."
  end
end
