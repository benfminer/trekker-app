# EOD Note — 2026-03-26

## Where Things Stand

Production deployment is in progress. Real data (283 submissions, milestones, admin accounts) has been committed as a SQL import file but has NOT yet been loaded into the production database — that step is still pending.

## Completed Today

- Fixed step conversion: `STEPS_PER_MILE` changed from 2500 → 2250 to match historical spreadsheet rate
- Updated step conversion test and submission controller comment
- Revised launch announcement email (stronger CTA, real production URLs, Campus Trail references)
- Generated `db/import_real_data.sql` — 283 real submissions + milestones + admin accounts (bminer, wamo)
- Committed and pushed import SQL to repo

## In Progress

- **Loading real data into production** — Render external DB connections are blocked from local (port 5432 refused despite 0.0.0.0/0 ACL). Import SQL is in the deployed repo and ready to run.

## Pick Up Here Tomorrow

Run the import from the Render Shell. In Render dashboard → `trekker-api` → Shell:

```bash
psql $DATABASE_URL -f db/import_real_data.sql
```

Then verify: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM submissions;"` should return 283.

## Open Questions

- Why is Render's external DB port 5432 blocked? (Status shows Available, ACL allows 0.0.0.0/0 — may be a network/ISP issue on Ben's side)
- `local_dump.sql` is sitting untracked in the repo root — delete it or add to `.gitignore`
- `IPHONE_APP_EXPLORATION.md` is untracked — commit or delete?

## Reminders

- Re-index if new files were added: `mlx-server index`
- Server needs to be started: `mlx-server start`
- Activate venv if needed: `source ~/Developer/mlx-agent-system/.venv/bin/activate`
