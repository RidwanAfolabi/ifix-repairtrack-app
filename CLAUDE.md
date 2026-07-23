# iFix RepairTrack — Project Context

This file is auto-loaded by Claude Code at the start of every session
(cloud, local, or teleported). Keep it current as the project evolves.

## What this is

iFix RepairTrack — repair job tracking, warranty management, and customer
engagement system for iFix Express (phone repair, 5 branches, Kedah &
Penang, Malaysia). Phase 3 of a 7-phase digital transformation. This repo
(`ifix-repairtrack-app`) is the customer + staff frontend, React + Vite,
deployed to `app.ifixexpress.com.my` via Cloudflare Pages.

## The three repos

- **`ifix-repairtrack-app`** (this repo) — frontend, working repo
- **`ifix-repairtrack-api`** — backend, Hono + Cloudflare Workers + D1 + R2,
  deployed to `api.ifixexpress.com.my`. COMPLETE and deployed. 16 endpoints.
  Treat as reference only unless explicitly asked to touch it. Its `API.md`
  is the source of truth for the real contract — most of it has already
  been verified directly against source and is summarized below and in
  `docs/frontend-wiring-plan.md`, but spot-check anything that seems off,
  since the backend can evolve after this was written.
- **Figma-Make-exported design repo** — reference only. Holds the real
  `.tsx` components (TrackPage, RepairStatusPage, WarrantyPage,
  ReviewsPage, AdminJobDetailPage, AdminNewJob, etc.). Port components from
  here into this repo's structure; don't treat it as the working repo.

## Non-negotiable business rules

**The "one link" principle.** Customers only ever receive ONE link from
iFix Express: the Repair Card (`app.ifixexpress.com.my/track/{jobId}`).
The invoice is reached via a button *inside* that page, linking to
`niagawan_invoice_url`. Customers never get a raw Niagawan link directly.

**Niagawan boundary.** Niagawan (third-party invoicing/inventory, no API)
stays the source of truth for invoicing and inventory. Staff paste a
Niagawan-generated invoice link into RepairTrack at job creation. This app
never calls, parses, or replicates anything from Niagawan — just stores
and links to that URL.

**WhatsApp: two separate senders, don't conflate them.**
- At job intake: staff trigger a "Share on WhatsApp" button *in this app*
  — a client-side `wa.me` deep link, pre-filled with the Repair Card link.
  Staff review and press Send themselves. No backend call, no Alia
  involvement, nothing automatic.
- On status updates: Alia (the WhatsApp bot, separate Worker) sends
  automatic notifications, triggered by the backend when staff update a
  job's status, gated by a "Notify customer" toggle (default on).
- Staff separately share the actual Niagawan invoice via Niagawan's own
  WhatsApp share button, from the branch's own number — unrelated to this
  app, unchanged existing habit. Don't touch or reference this flow.

**No QR codes anywhere.** Removed from the design intentionally. Don't
reintroduce QR generation, scanning, or QR-related UI.

**Domains:**
- Frontend: `app.ifixexpress.com.my` (local dev: `localhost:5173`)
- API: `api.ifixexpress.com.my` (local dev: wherever `wrangler dev` serves)
- Main marketing site (separate repo, don't touch): `ifixexpress.com.my`
- All API calls use `import.meta.env.VITE_API_BASE_URL` — never hardcode
  either domain in component code.

## Media handling

R2 isn't publicly readable by default, but the bucket has a custom domain,
`repair-media.ifixexpress.com.my`, configured in front of it. Because of
this, `photo_url` values returned by the API (on jobs, job_photos, and
status_history entries) are already complete, ready-to-use URLs — e.g.
`https://repair-media.ifixexpress.com.my/photos/IFX-00001/0.jpg`. Use
`photo_url` directly as an `<img src>`. Do not construct or prefix
anything, and do not route photo requests through `GET /api/media/*` —
that route still exists in the backend but is unused in production; it's
there only as a local-dev fallback (since `wrangler dev --local`'s R2
simulator isn't reachable from the public custom domain) and as a manual
fallback if the custom domain is ever detached. In local dev the returned
`photo_url` will instead point at `http://127.0.0.1:8787/api/media/...`
— still just use it as-is either way; the backend always returns the full
URL, in both modes.

## Production data safety — read this before running anything

Production has real branches, real staff accounts, and (as of last check)
zero real jobs — keep it that way until real usage starts. Never create
test jobs, test staff accounts, or test reviews against
`api.ifixexpress.com.my`. For anything that writes data, run the backend
locally via `wrangler dev --local` (local D1, no production secrets
needed) and test against that instead. Read-only GETs against production
are fine. If you're unsure whether an action writes data, ask before
running it against production.

## API contract essentials (verified against source)

- **Error format:** every error is `{ error, code }`; 400s add a `fields`
  object keyed by field name. Codes worth branching UI on: `JOB_NOT_FOUND`
  (404), `FORBIDDEN` (403 — wrong branch or non-admin), `STATUS_REGRESSION`
  (409 — backwards status change), `WARRANTY_ALREADY_CLAIMED` /
  `WARRANTY_NOT_STARTED` / `WARRANTY_EXPIRED` (409), `EMAIL_TAKEN` /
  `LAST_ADMIN` (409, staff management).
- **Status labels are server-provided.** Every job/status response includes
  `current_status_label` / `status_label` already formatted for display
  (e.g. "Repair In Progress") — don't maintain a duplicate label map here.
- **Warranty is a separate call, not part of the Repair Card.**
  `GET /api/track/:jobId` carries no warranty info at all. Warranty data
  (`GET /api/warranty/:jobId`, and the `warranty{}` block on
  `GET /api/jobs/:jobId`) is nested: `warranty.status` is one of
  `not_started | active | expired | claimed`, with `expiry_date`,
  `days_remaining`, `expiry_soon`, and a `claim{claimed_at,claimed_by,note}`
  object present only once claimed.
- **A warranty-claim action exists** (`PATCH /api/jobs/:jobId/warranty-claim`,
  staff-only) but has no UI yet — needs a home, most likely a button on the
  staff Job Detail page.
- **Review upsert has a real gap:** `GET /api/reviews` has no `job_id`
  filter, so the Repair Card can't check in advance whether a review
  already exists before rendering the form. Default: always show a blank
  form; use the POST response's `edited: true/false` to shape the success
  message afterward. Revisit only if true pre-population is wanted later.
- **`GET /api/auth/me` is narrower than login's response** — returns
  `{id, name, role, branch_id}` only, no `email` or `branch_name`. Don't
  assume session-restore gives you everything login did; look up
  `branch_name` from `GET /api/branches` if the UI needs it post-refresh.
- **Photo field naming differs by endpoint:** job creation takes up to 3
  files under `photos` (repeated) or `photos[0]`/`photos[1]`/`photos[2]`;
  a status update takes a single file under `photo` (singular). Getting
  this wrong silently drops the upload rather than erroring.
- **A disabled manual WhatsApp fallback exists for status updates.** The
  backend has a commented-out block that would return a `whatsapp_share`
  object on `PATCH /api/jobs/:jobId/status` (mirroring the intake share)
  for when Alia's automatic notify fails — relevant because Alia currently
  can't reliably message outside Meta's 24h window without an approved
  template, so `notified: false` may be the common case for a while. It is
  NOT live — don't build UI against a `whatsapp_share` field yet. This is a
  real decision to make explicitly, not something to assume either way.
- Recommended `localStorage` key for the staff token: `repairtrack_token`
  — matches the convention already documented in the backend's `API.md`.
- JWTs can't be revoked before expiry (~8h session length). Deactivating a
  staff account blocks new logins immediately but doesn't invalidate an
  already-issued token.
- A failed Alia notify never fails the parent status-update request — the
  response carries `notified: false` and a `warning` string; surface this
  as a toast, never as an error state on the status update itself.

## Conventions

- Tailwind only, no external component libraries beyond what's already in
  the Figma export (e.g. if shadcn/ui is already in use there, keep using
  it — don't introduce a second library)
- React Router v6
- Mobile-first for all customer-facing pages (390px baseline); desktop-only
  is acceptable for `/admin/*` staff pages
- Staff routes live under `/admin/*`, protected by JWT-based auth context;
  public routes (`/track`, `/warranty`, `/reviews`) require no auth

## Where to find the detailed build plan

The full phased build plan (Phase 0 API/design reconciliation through
Phase 7 polish) lives in `docs/frontend-wiring-plan.md` in this repo —
read that for step-by-step detail beyond what's summarized here. Pull it
up when starting or resuming frontend wiring work; this file is
intentionally kept short so it doesn't eat context budget every session.
