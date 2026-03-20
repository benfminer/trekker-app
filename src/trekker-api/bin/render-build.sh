#!/usr/bin/env bash
# Render build script for trekker-api (Rails).
# Runs during every deploy. Migrations run here so they complete before
# the new web process starts taking traffic.
set -o errexit

bundle install
bundle exec rails db:migrate
