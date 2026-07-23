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


STEP 0 — GET ORIENTED BEFORE WIRING ANYTHING

Do this first, before writing any component code. I do not have perfect
certainty on every exact field name and response shape from memory, so:

1. Read the Figma-exported reference repo (link/access provided separately)
   and identify every page/component relevant to RepairTrack: TrackPage,
   RepairStatusPage (Repair Card), WarrantyPage, ReviewsPage,
   AdminJobDashboard, AdminNewJob, AdminJobDetailPage, staff login, and any
   staff management screen if one exists there.
2. Read ifix-repairtrack-api's API.md and/or openapi.yaml directly — these
   are the source of truth for exact endpoint paths, request bodies, and
   response shapes. Also skim the actual route files (routes/track.js,
   routes/warranty.js, routes/reviews.js, routes/jobs.js, routes/auth.js,
   routes/staff.js, routes/media.js, routes/branches.js) to confirm real
   field names — especially anything added beyond the original plan:
   GET /api/media/*, GET /api/auth/me, the staff management endpoints, the
   review upsert behavior, and the warranty "claimed" status columns. Do
   not guess these — my description of them below may not perfectly match
   final field names, since they were added after the original spec.
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
6. Show me a short summary of what you found (exact endpoints, key field
   names, and which components you ported from where) before proceeding to
   Phase 1, so I can correct anything wrong in my description below.


SYSTEM ARCHITECTURE — WHAT MUST BE TRUE IN THIS APP

- API base URL comes from import.meta.env.VITE_API_BASE_URL — NEVER
  hardcode api.ifixexpress.com.my or localhost anywhere in component code
- Local dev: VITE_API_BASE_URL=http://localhost:8787 (or wherever wrangler
  dev serves the API locally)
- Production: VITE_API_BASE_URL=https://api.ifixexpress.com.my
- Device/status photos are NOT served directly from R2 — R2 isn't publicly
  readable. All photo URLs must go through the backend's GET /api/media/*
  route. Confirm the exact path pattern from the real route file in Step 0
  before hardcoding any image src construction.
- There is NO QR code functionality anywhere in this app. Do not add QR
  generation, QR scanning, or QR-related UI of any kind.
- Customers only ever receive ONE link from iFix Express — the Repair Card
  link (app.ifixexpress.com.my/track/{jobId}). The invoice is reached via a
  button INSIDE the Repair Card page, linking to niagawan_invoice_url —
  customers never receive a raw Niagawan link directly.
- The Repair Card link reaches the customer via a staff-triggered
  "Share on WhatsApp" button on the New Job success screen — NOT
  automatically, NOT via Alia. This is a `wa.me` deep link built entirely
  in this frontend (see Phase 5). Alia's automatic notifications only ever
  fire later, from staff-triggered status updates (backend already handles
  this — this frontend just needs the "Notify customer via Alia" toggle
  on the status update UI, and to gracefully surface if a notify attempt
  failed, since Alia's own /notify endpoint may not be fully wired yet on
  the bot side — a failed notify should never look like the status update
  itself failed).


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
   - Returns parsed JSON, throws a consistent error shape on failure
     (matching whatever error contract Step 0 confirmed)

2. Auth context (src/context/AuthContext.jsx or similar):
   - Holds current staff user (name, branchId, role) and JWT token in
     React state
   - On app load, if a token exists in storage, call GET /api/auth/me to
     validate and restore the session (don't just trust a stored token
     blindly — confirm it's still valid)
   - login(email, password) → calls POST /api/auth/login, stores token +
     user info
   - logout() → clears everything, redirects to /admin/login
   - Persist the token itself (not the full user object) in localStorage
     so a page refresh doesn't force re-login — the /api/auth/me call on
     load re-derives fresh user info rather than trusting stale cached data

3. Routing (React Router v6) — set up all routes as stubs first:
   Public: /track, /track/:jobId, /warranty, /warranty/:jobId, /reviews
   Staff: /admin/login, /admin/jobs, /admin/jobs/new, /admin/jobs/:jobId,
          /admin/staff (only if the staff management screen exists in the
          Figma export — confirm in Step 0)
   Protect all /admin/* routes except /admin/login behind the auth context
   — redirect to /admin/login if no valid session.

4. Two distinct layout shells:
   - Public layout: minimal, matches the main iFix Express website branding,
     no staff navigation visible anywhere
   - Staff/admin layout: sidebar nav (Jobs, New Job, Staff if applicable),
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
- Fetch GET /api/track/:jobId on mount
- Render: job summary (customer first name, device, branch, technician,
  estimated completion, Job ID), 3-photo gallery with lightbox (images via
  the media route, not raw R2 URLs), status timeline (ordered
  status_history entries, each may include a photo), Job ID prominent in
  monospace
- Invoice section: only render "View Invoice" button if niagawan_invoice_url
  is present on the response — hide it entirely if null, don't show a
  broken/disabled state
- Warranty summary card: only meaningful once warranty_start_date exists
  (i.e. job has reached 'collected') — otherwise show a simple "Warranty
  begins once your device is collected" note instead of guessing dates
- Rating section: comment textarea always visible (not gated behind star
  selection, per earlier design correction). Before rendering the
  submission form, check whether a review already exists for this job — if
  the backend supports review upsert (confirm exact mechanism in Step 0:
  likely GET reviews filtered by job_id, or the POST endpoint itself
  returning existing review state), show an "edit your review" state
  instead of a fresh blank form when one already exists
- Handle loading and 404 states clearly — a wrong/mistyped Job ID should
  show a friendly "we couldn't find that job" message, not a blank screen

WarrantyPage (/warranty and /warranty/:jobId):
- Single-field lookup (no QR tab, per earlier design correction)
- Warranty card: expiry_date, days_remaining, expiry_soon (show a visible
  warning styling when true), and status badge — confirm in Step 0 whether
  status values are exactly active/expired/claimed or something the
  backend developer changed when adding the "claimed" columns
- Mask the phone number ON THE FRONTEND ONLY (e.g. 0112*****68) — the API
  returns the full number, masking is purely a display concern here
- "View Repair Card" button linking to /track/:jobId

ReviewsPage (/reviews):
- Fetch GET /api/reviews with whatever filter/pagination params Step 0
  confirms exist
- Aggregate stats header (average rating, total count) — confirm whether
  this comes back in the same response payload or a separate call
- Device thumbnail per review card via the media route, placeholder icon
  when none exists

STOP HERE — show me these four pages wired up (tested against your local
sandbox instance of the API, per the cloud session guidelines above) before
moving to staff-side work.


=== PHASE 3: Staff Login ===

- Login page (/admin/login): clean, centered card, email + password,
  wired to POST /api/auth/login via the auth context
- On success redirect to /admin/jobs
- On failure show a generic "invalid credentials" message — don't leak
  whether the email exists
- No self-registration link anywhere on this screen


=== PHASE 4: Staff Job Dashboard & Detail ===

AdminJobDashboard (/admin/jobs):
- Fetch GET /api/jobs (branch-scoped automatically server-side based on
  the JWT — this page doesn't need to pass branch_id itself unless role
  is admin and a branch filter UI is wanted)
- Search bar, status filter, "Create New Job" button prominent
- Flag visually any job that's been in the same status too long (confirm
  if the backend already computes this or if it's frontend-side logic
  comparing updated_at to now)

AdminJobDetailPage (/admin/jobs/:jobId):
- Fetch GET /api/jobs/:jobId — full detail, photos, full status_history
- niagawan_invoice_url shown as a subtle secondary link, NOT a primary
  button — label it clearly as opening Niagawan, e.g. "View Invoice
  (opens Niagawan) ↗"
- If niagawan_invoice_url is missing, show an inline way to add it (wired
  to whatever PATCH endpoint the backend exposes for this — confirm exact
  route in Step 0)
- "Update Status" button opens a modal:
  - Status dropdown (only forward-progression values, or confirm the
    backend's actual validation rule from Step 0)
  - Optional note field
  - Optional photo upload (confirm exact field name/multipart shape from
    real route)
  - "Notify customer via Alia" toggle, default ON
  - On submit, PATCH /api/jobs/:jobId/status
  - If the response includes any kind of notify-failure warning, surface
    it as a non-blocking toast/banner — e.g. "Status updated. Customer
    notification may not have gone through." The status update itself
    must still show as successful; never conflate the two.
- Status history displayed as a timeline with staff name, note, and photo
  (if present) per entry

STOP HERE before building the New Job intake screen — this is the most
detail-sensitive page in the whole app.


=== PHASE 5: New Job Intake — THE WHATSAPP SHARE BUTTON ===

AdminNewJob (/admin/jobs/new):
- Form fields per Step 0's confirmed POST /api/jobs contract — expect at
  minimum: customer_name, customer_whatsapp, device_brand, device_model,
  issue_summary, technician_name, warranty_days, estimated_completion_date,
  niagawan_invoice_url (optional), up to 3 photos
- On submit, POST /api/jobs (multipart for photos)
- On success, show a success screen with:

  PRIMARY: "Share on WhatsApp" button
  - Green, WhatsApp-branded (#25D366), prominent
  - Constructs a wa.me link CLIENT-SIDE using data returned from the
    create-job response: job_id, repair_card_url, customer_name,
    customer_whatsapp (already normalized server-side, per the backend
    build), and the branch name
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


=== PHASE 6: Staff Management (if applicable) ===

Confirm in Step 0 whether GET/POST/PATCH /api/staff exist and are wired
for an actual UI, or were only meant to be called ad hoc. If a UI is
expected:
- Admin-only route (/admin/staff) — hide the nav link entirely for
  non-admin roles, and don't just rely on hiding the link; the backend
  should already reject non-admin calls, but the frontend should also not
  render a broken page for a technician who navigates there directly
- List staff, create new staff account, edit role/branch/active status
- Never allow an admin to deactivate themselves or remove the last
  remaining admin from the frontend side (confirm if the backend already
  guards this — if so, just handle the resulting error message gracefully
  rather than duplicating the guard, but ask me if you're not sure)


=== PHASE 7: Polish Pass ===

- Consistent loading states (skeletons or spinners) across every
  data-fetching page
- Consistent error states — a failed fetch should never show a blank
  white screen
- Confirm every image src goes through the media route, never a raw R2 URL
- Confirm there is no QR code anywhere in the final app
- Confirm no hardcoded API URLs anywhere — grep the codebase for
  "api.ifixexpress" and "localhost:8787" to make sure everything routes
  through the env variable
- Mobile responsiveness check on all customer-facing pages (390px width),
  desktop-only acceptable for /admin/* pages


WHAT I NEED FROM YOU THROUGHOUT

1. Complete Step 0 first and show me what you actually found (both from the
   backend repo and the Figma reference repo) before writing any component
   code — correct my assumptions above wherever reality differs.
2. Flag any ported Figma Make component that still has mock/hardcoded data
   you haven't fully replaced yet — don't silently leave any of it in.
3. Stop at every point marked STOP HERE and wait for my review before
   continuing — deliver each phase as its own commit or PR rather than one
   large one at the end.
4. Never write test data to the production API (api.ifixexpress.com.my) —
   use your own local sandbox running the backend via `wrangler dev --local`
   for anything that creates or modifies data. Read-only GETs against
   production are fine.
5. If you're ever unsure whether something is a frontend concern or should
   be handled backend-side (e.g. forward-status validation, review upsert
   logic), ask rather than guessing and implementing a workaround.
6. Never call any WhatsApp/notification endpoint from the New Job intake
   screen — that button is 100% client-side.

Start with Step 0 now.
