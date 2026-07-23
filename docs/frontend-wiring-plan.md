PROJECT CONTEXT

I'm wiring the frontend for "iFix RepairTrack" to an already-built, tested,
and deployed backend API. This is the ifix-repairtrack-app repo (React +
Vite, deployed to app.ifixexpress.com.my via Cloudflare Pages). The backend
is a separate repo, ifix-repairtrack-api (Hono + Cloudflare Workers + D1 +
R2), deployed to api.ifixexpress.com.my — 16 endpoints, fully built and
tested in production.

The repo currently contains a bare Vite scaffold. The Figma Make components
live in a separate reference repo (see above) and need to be ported in —
find and replace all mock/hardcoded data with real API calls once ported.


CLOUD SESSION — HOW TO WORK IN THIS ENVIRONMENT

- You're likely running in an isolated cloud sandbox with its own ephemeral
  filesystem, working against GitHub rather than my local machine. Expect
  to deliver changes as commits/PRs against ifix-repairtrack-app rather
  than editing files I can see directly — that's fine, just make each
  phase below its own reviewable commit or PR so I can check it before the
  next phase starts.
- DO NOT test against the live production API (api.ifixexpress.com.my) for
  anything that writes data — no test job creation, no test staff accounts,
  no test reviews. Production currently has real branches and real staff
  accounts and I don't want it polluted with phantom test records.
  - For read-only checks (GET requests), production is fine.
  - For anything that creates/modifies data (POST /api/jobs, PATCH status,
    POST /api/staff, POST /api/reviews), spin up the backend in your own
    sandbox instead: clone ifix-repairtrack-api, run it locally with
    `wrangler dev --local` (local D1, no remote binding, no production
    secrets needed) and test wiring against that instead.
  - If your sandbox can't run wrangler locally for some reason (network
    restrictions, missing Cloudflare login), tell me rather than falling
    back to testing writes against production.
- You should not need any Cloudflare API tokens or account secrets to
  complete this task — local D1 dev mode doesn't require them. If you find
  yourself needing a real secret to proceed, stop and ask me rather than
  trying to source or guess one.


STEP 0 — GET ORIENTED, THEN SPOT-CHECK WHAT'S DOCUMENTED BELOW

Most of the API contract has already been verified directly against the
deployed backend source, so you're not starting from zero — but the
backend can evolve after this was written, so don't treat the summary
below as gospel without a quick sanity check. Concretely:

1. Read the Figma-exported reference repo (link/access provided separately)
   and identify every page/component relevant to RepairTrack: TrackPage,
   RepairStatusPage (Repair Card), WarrantyPage, ReviewsPage,
   AdminJobDashboard, AdminNewJob, AdminJobDetailPage, staff login, and the
   staff management screen if one exists there.
2. Skim ifix-repairtrack-api's API.md — it's short and matches what's
   summarized in the CONFIRMED API CONTRACT section below almost exactly.
   Spot-check two or three routes against the actual route source in
   src/routes/ if anything looks off; don't re-derive the whole contract
   from scratch.
3. If you need to double-check any exact visual detail the exported code
   doesn't make obvious (a color, spacing, an icon, or a screen that wasn't
   part of the GitHub export), use the connected Figma MCP server against
   the Figma Make design link I'll share, rather than guessing.
4. Reconcile Figma Make's component data shapes against the real API
   shapes before wiring — if a component expects `photoUrl` but the API
   returns `photo_url`, fix it at the wiring layer, and flag the mismatch
   to me.
5. Port the identified components from the reference repo into
   `ifix-repairtrack-app`'s actual structure (src/pages, src/components, or
   whatever convention already exists in the Vite scaffold) — preserve
   Tailwind styling and layout as-is, don't restyle anything unless it's
   broken.
6. Show me a short summary of what you found (anything that differs from
   the CONFIRMED API CONTRACT section below, and which components you
   ported from where) before proceeding to Phase 1.


SYSTEM ARCHITECTURE — WHAT MUST BE TRUE IN THIS APP

- API base URL comes from import.meta.env.VITE_API_BASE_URL — NEVER
  hardcode api.ifixexpress.com.my or localhost anywhere in component code
- Local dev: VITE_API_BASE_URL=http://localhost:8787 (or wherever wrangler
  dev serves the API locally)
- Production: VITE_API_BASE_URL=https://api.ifixexpress.com.my
- Photo URLs are ALREADY COMPLETE, ready-to-use URLs as returned by the
  API — the R2 bucket has a custom domain (repair-media.ifixexpress.com.my)
  in production. Use `photo_url` directly as an <img src>. Do NOT construct
  or prefix anything, and do NOT route through GET /api/media/* — that
  route exists in the backend but is unused in production (local-dev-only
  fallback). In local dev the returned photo_url will itself point at
  http://127.0.0.1:8787/api/media/... — still just use it as-is; the
  backend bakes the full URL in either way, at write time.
- There is NO QR code functionality anywhere in this app. Do not add QR
  generation, QR scanning, or QR-related UI of any kind.
- Customers only ever receive ONE link from iFix Express — the Repair Card
  link (app.ifixexpress.com.my/track/{jobId}). The invoice is reached via a
  button INSIDE the Repair Card page, linking to niagawan_invoice_url —
  customers never receive a raw Niagawan link directly.
- The Repair Card link reaches the customer via a staff-triggered
  "Share on WhatsApp" button on the New Job success screen — NOT
  automatically, NOT via Alia. This is a wa.me deep link built entirely
  in this frontend (see Phase 5). Alia's automatic notifications only ever
  fire later, from staff-triggered status updates. See the CONFIRMED API
  CONTRACT section for exactly what that response looks like, including a
  currently-disabled fallback path that needs an explicit decision from me
  before you build anything against it.


CONFIRMED API CONTRACT — READ THIS BEFORE WIRING EACH PAGE

Verified directly against the deployed source. Error format everywhere:
{ "error": "...", "code": "MACHINE_CODE" }, with a "fields" object on 400s.
Status labels (current_status_label / status_label) are always provided by
the API — never build a duplicate label map in the frontend.

--- Public (no auth) ---

GET /api/track/:jobId
  -> { job_id, customer_name, device_brand, device_model, issue_summary,
       technician_name, estimated_completion_date, current_status,
       current_status_label, created_at, updated_at,
       branch: { id, name, city, address, whatsapp_number },
       niagawan_invoice_url,
       photos: [{ photo_url, sort_order, uploaded_at }],
       status_history: [{ status, status_label, note, photo_url,
                           updated_by_name, timestamp }] }
  NO warranty info here at all. NO customer_whatsapp either (privacy).
  404 JOB_NOT_FOUND if the job_id doesn't exist.

GET /api/warranty/:jobId
  -> { job_id, customer_name, customer_whatsapp (UNMASKED — mask on
       frontend only), device_brand, device_model, branch_name,
       current_status,
       warranty: { status, expiry_date, days_remaining, expiry_soon,
                   warranty_days, warranty_start_date,
                   claim: { claimed_at, claimed_by, note } | null },
       repair_card_url, repair_card_path }
  warranty.status is one of: not_started | active | expired | claimed.
  claim is non-null only once claimed; a claim outranks date arithmetic
  (stays "claimed" even if the date window has since lapsed).
  expiry_soon is only ever true when active AND days_remaining <= 14.
  repair_card_path is the internal route ("/track/IFX-00001") for
  React Router navigation; repair_card_url is the absolute version.

GET /api/reviews?branch_id=&stars=&limit=&offset=
  -> { reviews: [{ id, job_id, branch_id, branch_name, device_type,
                    stars, comment, created_at, device_photo_url }],
       meta: { total, average_rating, limit, offset } }
  limit max 100. average_rating is null when there are zero reviews.
  NO job_id filter exists, and NO device_type or date-range filter either
  — only branch_id and stars are supported. See the flagged decision below
  about what this means for the Repair Card's review form.

POST /api/reviews
  Body: { job_id (required), stars 1-5 (required), comment, device_type }
  branch_id is derived from the job — ignored if sent.
  UPSERT: one review per job. First submission -> 201. Re-posting the same
  job_id edits it -> 200 with edited: true in the response. created_at is
  preserved on edit.

--- Auth ---

POST /api/auth/login
  Body: { email, password }
  -> { token, token_type: "Bearer", expires_at,
       staff: { id, name, email, role, branch_id, branch_name } }
  8h default session (server-configurable, 1-24h). All failures (unknown
  email, wrong password, deactivated account) return an identical 401 —
  don't try to distinguish them in the UI.
  No signup route exists, by design — don't build one.

GET /api/auth/me  (auth required)
  -> { id, name, role, branch_id }
  NOTABLY NARROWER than login's staff object — no email, no branch_name.
  Session-restore-on-refresh needs to tolerate this; look up branch_name
  from GET /api/branches if the UI needs it after a refresh.

Logout: there is no endpoint, by design (JWTs are stateless). Logging out
is purely a frontend action: clear the token and redirect to /admin/login.
Recommended localStorage key, matching the backend's own documented
convention: "repairtrack_token".

--- Staff (auth required; non-admins scoped to their own branch_id) ---

GET /api/jobs?status=&search=&limit=&offset=&branch_id=(admin only)
  -> { jobs: [{ job_id, customer_name, customer_whatsapp, device_brand,
                device_model, issue_summary, branch_id, technician_name,
                current_status, current_status_label,
                estimated_completion_date, created_at, updated_at,
                branch_name }],
       meta: { total, limit, offset } }
  List view does NOT include photos, niagawan_invoice_url, or warranty —
  those only come from the detail route below. search matches customer
  name / device model / job ID. There is no backend-computed "stuck in
  this status too long" flag — that's frontend-only logic comparing
  updated_at to now, if wanted.

POST /api/jobs  (multipart/form-data or JSON)
  Required: customer_name, customer_whatsapp, device_brand, device_model,
  issue_summary. Optional: technician_name, warranty_days (default 30),
  estimated_completion_date (YYYY-MM-DD), niagawan_invoice_url,
  photos (up to 3 files, JPEG/PNG/WebP, 8MB each each — send as repeated
  "photos" fields or "photos[0]"/"photos[1]"/"photos[2]"; either works).
  branch_id comes from the JWT, not the body. customer_whatsapp is
  normalized to 60XXXXXXXXX server-side before storage; an unnormalizable
  number returns 400.
  Does NOT notify Alia. Response (201):
  { job_id, customer_name, customer_whatsapp (normalized), device_brand,
    device_model, issue_summary, branch_id, branch_name, technician_name,
    niagawan_invoice_url, warranty_days, estimated_completion_date,
    current_status: "received", current_status_label, photos, repair_card_url }
  This response is exactly what Phase 5's wa.me share button needs.

GET /api/jobs/:jobId
  -> everything from the list view PLUS niagawan_invoice_url,
     warranty_days, warranty_start_date, warranty_claimed_at/_by/_note,
     warranty: { ...same nested shape as the public warranty route... },
     photos: [...], status_history: [...with status_label added],
     repair_card_url

PATCH /api/jobs/:jobId
  Body: { niagawan_invoice_url: string | null }
  This is the ONLY field this route edits — used to attach the invoice
  link after the fact when staff didn't have it yet at intake.
  -> { job_id, niagawan_invoice_url }

PATCH /api/jobs/:jobId/status  (multipart or JSON)
  Fields: status (required), note, photo (SINGLE file, field name
  literally "photo" — not "photos"), notify_customer (default true),
  allow_backward (default false).
  Forward jumps are always allowed. Same-status -> 400. Backwards ->
  409 STATUS_REGRESSION unless allow_backward=true is explicitly sent.
  status: "collected" starts the warranty countdown (once only).
  This is the ONLY place Alia gets notified. Response:
  { job_id, current_status, current_status_label, warranty_start_date,
    status_history_entry: { status, status_label, note, photo_url,
                             updated_by_name },
    notified: boolean, warning?: string }
  A failed notify never fails this request — check `notified === false`
  and surface `warning` as a non-blocking toast.
  >>> SEE FLAGGED DECISION BELOW about a disabled manual-share fallback
  >>> for this exact endpoint before building the status-update UI.

PATCH /api/jobs/:jobId/warranty-claim
  Body (all optional): { note, allow_expired }
  Marks a warranty as claimed. Rejects: already claimed
  (409 WARRANTY_ALREADY_CLAIMED), not yet collected
  (409 WARRANTY_NOT_STARTED), expired without allow_expired=true
  (409 WARRANTY_EXPIRED, for goodwill claims). Response:
  { job_id, warranty: { ...same nested shape... } }
  THIS ENDPOINT HAS NO UI YET — it's a real, deployed feature this
  frontend needs to add a home for, most likely a "Mark Warranty as
  Claimed" action on the staff Job Detail page (staff-only; the public
  Warranty page has no auth, so the action can't live there).

GET /api/branches  (auth required)
  -> { branches: [{ id, name, city, address, whatsapp_number }] }
  Active branches only, for dropdowns.

--- Admin-only staff management (role: "admin"; others get 403) ---

GET /api/staff?branch_id=&role=&include_inactive=
  -> { staff: [{ id, name, email, role, branch_id, is_active,
                 created_at, branch_name }],
       meta: { count, filters: { branch_id, role, include_inactive } } }
  Deactivated accounts hidden by default (include_inactive=true to show).
  password_hash is never returned by any staff route.

POST /api/staff
  Body: { name, email, password (min 10 chars), role, branch_id } — all
  required. Duplicate email -> 409 EMAIL_TAKEN. Unknown branch_id -> 400.
  -> created staff row + branch_name, 201.

PATCH /api/staff/:id
  Body: any of { name, role, branch_id, is_active, password }.
  Setting password is the ONLY password-reset path — there's no email
  recovery anywhere in this system.
  Guards (build these into the UI, don't just rely on the backend 400):
    - changing your own role -> 400
    - deactivating your own account -> 400
    - deactivating the last active admin -> 409 LAST_ADMIN
  -> updated staff row.


FLAGGED DECISION 1 — Review form pre-population

Since GET /api/reviews has no job_id filter, the Repair Card cannot check
in advance whether a review already exists for a job before rendering the
form. Default behavior to build: always show a blank star + comment form;
after POST, use the response's edited: true/false to shape the success
message ("Thanks for your review!" vs "Your review has been updated!").
This means a customer who already reviewed will see a blank form again on
a later visit rather than their previous rating pre-filled — a real UX
gap, not a bug. Don't silently work around this some other way (e.g. by
fetching all reviews and filtering client-side, which is inefficient and
still wouldn't reliably surface one job's review without pagination
gymnastics) — flag it back to me if it matters enough to warrant asking
for a job_id filter on GET /api/reviews.


FLAGGED DECISION 2 — Manual WhatsApp fallback for status updates

The backend has a commented-out block in the status-update route that
would return a whatsapp_share object (same shape as the intake response:
job_id, customer_name, customer_whatsapp, device_model, branch_name,
status, status_label, staff_note, repair_card_url) specifically so the
frontend could offer a "Share update on WhatsApp" button — mirroring
Phase 5's intake button — for when Alia's automatic notify fails. This
matters because Alia currently can't reliably deliver a message outside
Meta's 24-hour customer-messaging window without an approved template, so
notified: false may be the common case for a while, not a rare edge case.

Right now this field does NOT exist in the live response. Do not build UI
that assumes whatsapp_share is present. Build Phase 4's status update flow
against the CURRENT contract only (toast on notified: false), and tell me
this decision needs making: either leave it as a toast-only experience for
now, or flag that the backend's disabled block should be re-enabled
together with a small frontend addition. Don't decide this one yourself.


BUILD THIS IN PHASES — STOP AFTER EACH PHASE AND WAIT FOR MY REVIEW BEFORE
CONTINUING (open a PR or commit checkpoint per phase if that fits your
workflow better than one giant PR at the end)

=== PHASE 1: Foundation ===

1. API client: create a single fetch/axios wrapper (e.g. src/lib/api.js)
   that:
   - Reads base URL from import.meta.env.VITE_API_BASE_URL
   - Attaches "Authorization: Bearer {token}" automatically for staff
     routes when a token exists
   - Handles 401 responses by clearing the stored session and redirecting
     to /admin/login
   - Returns parsed JSON, throws a consistent { error, code, fields? }
     shape on failure, matching the real error contract above

2. Auth context (src/context/AuthContext.jsx or similar):
   - Holds current staff user (id, name, branchId, role — and email,
     branchName when freshly logged in, but treat those two as
     possibly-absent after a session restore, per GET /api/auth/me's
     narrower shape) and the JWT token in React state
   - On app load, if a token exists in storage, call GET /api/auth/me to
     validate and restore the session (don't just trust a stored token
     blindly — confirm it's still valid)
   - login(email, password) -> calls POST /api/auth/login, stores token +
     full staff object from the response
   - logout() -> clears everything, redirects to /admin/login (there's no
     backend logout endpoint by design — this is purely a frontend action)
   - Persist the token under the key "repairtrack_token" in localStorage
     (matches the backend's own documented convention) so a page refresh
     doesn't force re-login
   - If the UI needs branch_name after a session restore and /me didn't
     provide it, look it up from GET /api/branches by branch_id rather
     than leaving it blank

3. Routing (React Router v6) — set up all routes as stubs first:
   Public: /track, /track/:jobId, /warranty, /warranty/:jobId, /reviews
   Staff: /admin/login, /admin/jobs, /admin/jobs/new, /admin/jobs/:jobId,
          /admin/staff (admin-only — hide the nav link for non-admins AND
          don't rely on that alone; the backend already 403s non-admins,
          but don't render a broken page if a non-admin navigates there
          directly)
   Protect all /admin/* routes except /admin/login behind the auth context
   — redirect to /admin/login if no valid session.

4. Two distinct layout shells:
   - Public layout: minimal, matches the main iFix Express website branding,
     no staff navigation visible anywhere
   - Staff/admin layout: sidebar nav (Jobs, New Job, Staff for admins only),
     shows logged-in staff name + branch + role, logout button

STOP HERE — show me the routing structure and auth context before
continuing, so I can confirm session handling behaves the way I expect.


=== PHASE 2: Public Customer Pages ===

Wire each Figma-Make-exported page to real data. Keep all existing Tailwind
styling and layout from the Figma export — only replace mock data and add
real data-fetching logic.

TrackPage (/track):
- Single input for Job ID, on submit navigate to /track/{jobId}
- No QR tab (already removed per earlier Figma update — confirm it's gone)

RepairStatusPage / Repair Card (/track/:jobId):
- Fetch GET /api/track/:jobId on mount for job summary, photos, timeline
- Fetch GET /api/warranty/:jobId SEPARATELY (can run in parallel) —
  warranty is NOT part of the track response at all. Use the nested
  warranty.status to decide what to render: "not_started" -> a simple
  "Warranty begins once your device is collected" note; "active" /
  "expired" / "claimed" -> the full warranty summary card with the
  appropriate badge and (for expiry_soon) a visible warning style
- Render: job summary (customer_name, device, branch, technician,
  estimated_completion_date, Job ID), 3-photo gallery with lightbox
  (photo_url used directly, no construction needed), status timeline
  (status_history, each entry may include a photo_url), Job ID prominent
  in monospace, current_status_label used directly for the active stage
- Invoice section: only render "View Invoice" button if niagawan_invoice_url
  is present — hide it entirely if null, don't show a broken/disabled state
- Rating section: comment textarea always visible (not gated behind star
  selection). Per FLAGGED DECISION 1 above, always render a blank
  submission form (there's no way to know in advance if one exists) — on
  successful POST, use the response's edited field to show either "Thanks
  for your review!" or "Your review has been updated!"
- Handle loading and 404 (JOB_NOT_FOUND) states clearly — a wrong/mistyped
  Job ID should show a friendly "we couldn't find that job" message

WarrantyPage (/warranty and /warranty/:jobId):
- Single-field lookup (no QR tab)
- Warranty card built from the nested warranty{} object: status badge
  (not_started / active / expired / claimed — four states, not three),
  expiry_date, days_remaining, expiry_soon warning styling, and — only
  when status is "claimed" — the claim{claimed_at, claimed_by, note}
  details
- Mask customer_whatsapp ON THE FRONTEND ONLY (e.g. 0112*****68) — the
  API returns it unmasked by design
- "View Repair Card" button using repair_card_path for internal
  navigation (no need to re-parse repair_card_url)

ReviewsPage (/reviews):
- Fetch GET /api/reviews — only branch_id and stars are real filters;
  don't build UI controls for a device_type or date-range filter, since
  neither exists on the backend
- Aggregate stats header from meta.average_rating (null-safe — show a
  sensible empty state when there are zero reviews yet) and meta.total
- device_photo_url per review card, used directly; placeholder icon when
  null

STOP HERE — show me these four pages wired up (tested against your local
sandbox instance of the API, per the cloud session guidelines above) before
moving to staff-side work.


=== PHASE 3: Staff Login ===

- Login page (/admin/login): clean, centered card, email + password,
  wired to POST /api/auth/login via the auth context
- On success redirect to /admin/jobs
- On failure show a generic "invalid credentials" message — the backend
  deliberately makes unknown-email, wrong-password, and deactivated-account
  indistinguishable; don't try to differentiate them in the UI either
- No self-registration link anywhere on this screen — there is no signup
  route, by design


=== PHASE 4: Staff Job Dashboard & Detail ===

AdminJobDashboard (/admin/jobs):
- Fetch GET /api/jobs (branch-scoped automatically server-side based on
  the JWT for non-admins; admins can pass branch_id to filter)
- Search bar (matches customer name / device model / job ID), status
  filter, "Create New Job" button prominent
- List view has no photos, invoice link, or warranty info — don't try to
  show any of that here, it's not in this response
- "Stuck in this status too long" flagging, if wanted, is frontend-only
  logic (compare updated_at to now) — the backend doesn't compute this

AdminJobDetailPage (/admin/jobs/:jobId):
- Fetch GET /api/jobs/:jobId — full detail, photos, full status_history,
  nested warranty{}
- niagawan_invoice_url shown as a subtle secondary link, NOT a primary
  button — label it clearly as opening Niagawan, e.g. "View Invoice
  (opens Niagawan) ↗". If missing, show an inline way to add it, wired to
  PATCH /api/jobs/:jobId with { niagawan_invoice_url }
- "Mark Warranty as Claimed" action — new feature this frontend needs to
  add a home for, since PATCH /api/jobs/:jobId/warranty-claim exists but
  has no UI yet. Only show/enable it when warranty.status is "active" or
  "expired" (with an explicit "allow goodwill claim on expired warranty"
  confirmation step for the expired case, matching allow_expired=true).
  Hide it entirely once already "claimed". On success, refresh the
  warranty display from the response.
- "Update Status" button opens a modal:
  - Status dropdown: forward-progression values only by default (the
    backend allows any forward jump but rejects same-status with 400 and
    backwards with 409 STATUS_REGRESSION unless allow_backward=true) —
    hide or clearly separate backward options behind an explicit
    confirmation that sets allow_backward=true, don't offer them casually
    in the main dropdown
  - Optional note field
  - Optional single photo upload — multipart field name is literally
    "photo" (singular), NOT "photos" — using the wrong name silently drops
    the upload rather than erroring
  - "Notify customer via Alia" toggle, default ON (maps to notify_customer)
  - On submit, PATCH /api/jobs/:jobId/status
  - Check notified === false in the response and surface warning as a
    non-blocking toast — the status update itself must still show as
    successful; never conflate the two. Per FLAGGED DECISION 2 above, do
    NOT build a "share on WhatsApp" fallback button here yet — that field
    doesn't exist in the live response. Just the toast, for now.
- Status history displayed as a timeline with staff name, note, and photo
  (if present) per entry, using status_label directly

STOP HERE before building the New Job intake screen — this is the most
detail-sensitive page in the whole app.


=== PHASE 5: New Job Intake — THE WHATSAPP SHARE BUTTON ===

AdminNewJob (/admin/jobs/new):
- Form fields: customer_name, customer_whatsapp, device_brand,
  device_model, issue_summary (all required); technician_name,
  warranty_days (default 30), estimated_completion_date,
  niagawan_invoice_url (optional at this stage — staff often attach it
  later via the Job Detail page once Niagawan generates it), up to 3
  photos
- On submit, POST /api/jobs as multipart/form-data. Send photos as
  repeated "photos" fields or "photos[0]"/"photos[1]"/"photos[2]" — either
  naming works against the real backend
- On success, show a success screen with:

  PRIMARY: "Share on WhatsApp" button
  - Green, WhatsApp-branded (#25D366), prominent
  - Constructs a wa.me link CLIENT-SIDE using data returned from the
    create-job response: job_id, repair_card_url, customer_name,
    customer_whatsapp (already normalized server-side to 60XXXXXXXXX),
    and branch_name
  - Message template (confirm final wording with me before hardcoding,
    but a reasonable default):
    "Hi {customer_name}, your {device_model} repair (Job No: {job_id}) has
    been received at our {branch_name} branch. Track your repair status
    here: {repair_card_url}"
  - URL-encode the message properly:
    https://wa.me/{customer_whatsapp}?text={encodeURIComponent(message)}
  - Clicking it opens WhatsApp Web/Desktop with everything pre-filled —
    staff review and press Send themselves. This button must NEVER
    trigger any backend call — it's a pure client-side link, no API
    involved in the sending itself.
  - Small caption under the button: "Opens WhatsApp with the message
    ready — review before sending"

  SECONDARY: "Copy Repair Card Link" button (smaller, less prominent) —
  for staff who want to share via SMS or another channel instead

  Also show: Job ID, "View Repair Card" (opens the public page in a new
  tab so staff can preview what the customer sees), and a small note:
  "Remember to share the invoice separately via Niagawan's own WhatsApp
  share button, as usual — that stays unchanged."

- Do NOT call any Alia/notify endpoint from this screen. This screen is
  entirely about the client-side wa.me share button and nothing else on
  the notification front.

STOP HERE and let me test the actual wa.me link (using a job created in
your local sandbox, not production) against a real WhatsApp number before
moving on — getting the phone format and message right here matters more
than anything else in this phase.


=== PHASE 6: Staff Management ===

This is a real, deployed feature (not speculative) — GET/POST/PATCH
/api/staff all exist and require role: "admin" (others get 403).

- Admin-only route (/admin/staff) — hide the nav link entirely for
  non-admin roles, and don't just rely on hiding the link; render a
  graceful message (not a broken page) if a non-admin somehow navigates
  there directly, since the backend will 403 the actual data calls
- List staff (GET /api/staff, with branch_id/role/include_inactive
  filters — deactivated accounts hidden unless include_inactive=true is
  passed), create new staff account (POST /api/staff, password min 10
  characters, duplicate email -> 409 EMAIL_TAKEN shown clearly), edit
  role/branch/active status/reset password (PATCH /api/staff/:id)
- Build these guards into the UI directly rather than only surfacing the
  backend's error after the fact: disable "change my own role" and
  "deactivate my own account" controls for the logged-in admin's own row;
  show a clear message if deactivating would remove the last active admin
  (backend returns 409 LAST_ADMIN if attempted anyway)
- Setting a new password via PATCH is the only password-reset path in the
  whole system — there is no email recovery anywhere, worth reflecting in
  the UI copy so admins understand this is genuinely the only way


=== PHASE 7: Polish Pass ===

- Consistent loading states (skeletons or spinners) across every
  data-fetching page
- Consistent error states mapped to the real error codes where it matters
  — JOB_NOT_FOUND -> friendly "couldn't find that job" message,
  STATUS_REGRESSION -> surfaces the backward-override confirmation,
  WARRANTY_ALREADY_CLAIMED / WARRANTY_NOT_STARTED / WARRANTY_EXPIRED ->
  clear messages on the claim action, EMAIL_TAKEN / LAST_ADMIN -> clear
  messages on staff management
- Grep the codebase to confirm no component constructs or prefixes a photo
  URL, or references GET /api/media/ directly — every image src should use
  photo_url exactly as returned
- Confirm there is no QR code anywhere in the final app
- Confirm no hardcoded API URLs anywhere — grep for "api.ifixexpress" and
  "localhost:8787" to make sure everything routes through the env variable
- Mobile responsiveness check on all customer-facing pages (390px width),
  desktop-only acceptable for /admin/* pages


WHAT I NEED FROM YOU THROUGHOUT

1. Complete Step 0 first and show me what you actually found (both from
   the backend repo and the Figma reference repo) before writing any
   component code — flag anything that differs from the CONFIRMED API
   CONTRACT section above.
2. Flag any ported Figma Make component that still has mock/hardcoded data
   you haven't fully replaced yet — don't silently leave any of it in.
3. Stop at every point marked STOP HERE and wait for my review before
   continuing — deliver each phase as its own commit or PR rather than one
   large one at the end.
4. Never write test data to the production API (api.ifixexpress.com.my) —
   use your own local sandbox running the backend via `wrangler dev --local`
   for anything that creates or modifies data. Read-only GETs against
   production are fine.
5. Do not resolve FLAGGED DECISION 1 or FLAGGED DECISION 2 yourself —
   build to the documented default in each case and tell me explicitly
   that a decision is pending, rather than picking a workaround.
6. Never call any WhatsApp/notification endpoint from the New Job intake
   screen — that button is 100% client-side.

Start with Step 0 now.
