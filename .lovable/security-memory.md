# Security Memory

## App
Public-facing prop-firm news/reviews site with auth, user payout submissions, admin tools, and AI blog generation.

## Invariants (must never happen)
- No anon SELECT on `payout_submissions.notes`, `rejection_reason`, or `proof_url`. Anon must only see `(id, amount_usd, status, created_at, firm_id)` via column-level grants.
- No public SELECT policy on `rss_sources` (admin-only).
- No `EXECUTE` for `anon`/`PUBLIC` on `SECURITY DEFINER` functions in `public`.
- No `WITH CHECK (true)` on INSERT/UPDATE/DELETE policies. Validate inputs (e.g. email format on `subscribers`).

## Scanner guidance — known accepted findings
- `has_role(uuid, app_role)` SECURITY DEFINER is intentionally EXECUTE-able by `authenticated`. RLS policies depend on it. Do not flag.
- `pg_net` extension lives in `public` schema. Moving it is unsupported by the extension (`ALTER EXTENSION ... SET SCHEMA` errors). Do not flag.
