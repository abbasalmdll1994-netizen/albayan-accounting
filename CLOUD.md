# Account cloud snapshots

Open `cloud.html`, create and confirm an email/password account, sign in, then enable saving on the primary device. On another device sign into the same account and explicitly restore. Sessions stay in sessionStorage and refresh through Supabase Auth; passwords are never stored by cloud-sync.js.

The existing local application remains usable. Cloud authentication controls access to cloud copies; it does not lock the local application or encrypt browser storage. Each account owns one complete snapshot. This is not a shared multi-user ledger or a role-based representative/admin system. Work on one device at a time and restore before switching devices. Different cloud accounts cannot access each other's snapshots.

Automatic uploads run every 15 seconds while an authenticated page is visible and online. Use Save now and wait for success before closing. No background service or automatic cloud download is provided. A revision compare-and-swap rejects stale writes. Restore requires confirmation and stores a rollback copy before replacing local keys. Backups exclude local PIN/password and login flags.

Database DDL is recorded in database/cloud-snapshots.sql and was applied via Supabase migrations albayan_private_cloud_snapshots and restrict_internal_rls_trigger. Only the publishable key is included in the client. RLS enforces account ownership; the RPC uses SECURITY INVOKER.

Validation: live transaction tests passed for insert, update, stale revision rejection, cross-user read/write isolation, and anonymous access denial; fixtures rolled back. Security advisors returned zero findings. `node test-cloud-unit.cjs` covers auth, saves, no-op saves, conflicts, restores, rollback-copy creation, account binding, offline preservation and exclusion of passwords. Auth/network responses are mocked for these client tests. An actual signup/login with the user's email is still required. Browser rendering could not be tested because no Chromium executable was available.
