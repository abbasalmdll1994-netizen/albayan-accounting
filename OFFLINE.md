# Offline operation

Open a page online once and wait for `جاهز للعمل بدون إنترنت`. All 12 pages,
their scripts, the manifest and icons are installed together. Existing localStorage
records remain the data source, including offline sales, collections and inventory.
Unsaved form drafts still need the normal Save action.

Cloud requests and authentication are never cached or queued by the worker.
The existing cloud uploader retries on the online event and every 15 seconds
while the page is visible, a cloud session exists and cloud saving is enabled.
Sessions currently use sessionStorage; a fresh session may require logging in
again online. This is snapshot backup with revision conflict protection, not
automatic two-way record merging. Concurrent changes on different devices can
require manual review. Local work does not depend on cloud login.

Closing the app does not perform background cloud synchronization. Reopen it
with internet and confirm the cloud save status. Clearing site data removes local
records and downloaded files; keep the existing backup workflow.

## Releasing updates

1. Bump `VERSION` in `sw.js` for **every** change to a precached page, script,
   manifest or icon. Keep `FILES` complete and use one atomic deployment.
2. Run `node test-offline.cjs`, `node test-release.cjs`, and `node test-cloud-unit.cjs`.
3. The new worker installs all assets before activation. It waits for all open
   app pages to close; there is no forced reload or skipWaiting during work.
4. Only app-owned shell caches for this path are removed on activation. No
   localStorage records, cloud data, or other applications' caches are touched.

Cache keys ignore query strings only for the explicit static-file allowlist.
The browser URL is unchanged, preserving cash-handover mode and other client-side
parameters. Cross-origin requests, unknown paths, and non-GET requests bypass
the worker completely.
