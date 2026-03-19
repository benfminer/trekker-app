# Rails Migration Setup Reference
> For use once the Rails app is scaffolded (task 1.2 in PROJECT_PLAN.md)

The four migration files have been pre-written and are ready at
`src/db/migrate/`. Once the Rails app is scaffolded, copy them in and run:

```bash
rails db:migrate
```

---

## If you need to recreate from scratch

These are the equivalent `rails generate migration` commands. The generated
files will be empty shells — the actual column definitions are in the
pre-written files above.

```bash
rails generate migration CreateSubmissions
rails generate migration CreateMilestones
rails generate migration CreateAdminUsers
rails generate migration CreateAdminSessions
```

Then copy the content from `src/db/migrate/` into the generated files.

---

## Rails app scaffold command (for reference)

```bash
rails new src --api --database=postgresql --skip-test --skip-action-mailer \
  --skip-action-mailbox --skip-action-text --skip-active-storage \
  --skip-action-cable
```

Flags:
- `--api` — API-only mode, no view layer
- `--database=postgresql` — sets up pg gem and database.yml
- `--skip-*` — removes unused Rails subsystems to keep the app lean

---

## database.yml (template — fill in credentials)

```yaml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  username: <%= ENV["DATABASE_USERNAME"] %>
  password: <%= ENV["DATABASE_PASSWORD"] %>
  host: <%= ENV.fetch("DATABASE_HOST") { "localhost" } %>

development:
  <<: *default
  database: trekker_development

test:
  <<: *default
  database: trekker_test

production:
  <<: *default
  database: trekker_production
```

---

## Required gems (add to Gemfile)

```ruby
# Authentication
gem "bcrypt", "~> 3.1"   # for has_secure_password on AdminUser

# For CSV import script
# (CSV is in Ruby stdlib — no extra gem needed)
```

---

## Creating the first admin user (after migrate)

```ruby
# rails console
AdminUser.create!(
  username: "benjamin",
  password: "your-secure-password-here",
  password_confirmation: "your-secure-password-here",
  display_name: "Benjamin"
)
```

---

## Running the historical data import

```bash
# Dry run first — no writes, shows what would be imported
rails runner db/seeds/import_historical_csv.rb -- --dry-run

# Live import
rails runner db/seeds/import_historical_csv.rb
```

The script is idempotent. Re-running it will not create duplicate records.
