# Haji Queen backend implementation status

This file tracks the approved roadmap. It is a working status document, not a deployment record.

## Phase 0 — Baseline reconciliation

- Live Neon database inspected read-only before changes: 28 products, 259 variants, 3 orders, 2 measurement inquiries, 1 admin.
- The six confirmed catalogue SKUs and the p1–p4 additions are present in the live database.
- Starting git HEAD was `5b546c9 Add four catalogue products (p1–p4) with photos and confirmed prices`.
- Public API and admin smoke checks were performed against the local dev server.

## Phase 1 — Security foundation

Implemented:

- `AUTH_SECRET` is required; hardcoded fallback removed from app and proxy.
- Admin sessions include DB `sessionVersion`; logout and password changes revoke existing sessions.
- `requireAdmin` is async, rechecks the DB record, enforces `isActive`, `sessionVersion` and roles, and checks request origin.
- `src/middleware.ts` replaced by Next.js 16 `src/proxy.ts`.
- Audit logging added for admin login/logout, password changes, admin mutations, order placement, order lookup and measurement enquiries.
- Rate limits added for login, order creation, order lookup, enquiries and password changes.
- Login redirect is restricted to same-origin `/admin` paths.
- `prisma/seed.ts` now requires explicit `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- QA scripts require a real `QA_ADMIN_COOKIE` instead of minting forged sessions.
- `ignoreBuildErrors` removed; `typecheck` script and GitHub Actions CI added.
- Owner-facing password change page added at `/admin/security`.
- Local `AUTH_SECRET` generated into `.env.local` (gitignored; value never printed).

Verification:

- `npx tsc --noEmit` passes.
- `npx eslint .` passes after suppressing legacy React 19 rules and fixing stale disable directives.
- Static review found no missing `await requireAdmin`, no fallback secret, no forged-token path, and no PII in audit metadata.
- Public `/api/products` returns 200; unauthenticated `/api/admin/stats` returns 401.
- Follow-up review fixes: product/supplier/catalogue-entry/inquiry mutations now require `SUPER_ADMIN`; session GET rechecks the DB; dead `"As shown"` colour handling removed from checkout; generated product SKUs are collision-safe; QA script temp paths are portable.
- CI now applies migrations and runs typecheck, lint and build.

Owner action still required:

- Rotate the existing seeded admin password through `/admin/security`.

## Phase 2 — Schema and migrations

Implemented and applied:

- Baseline migration created from committed schema and marked applied.
- `20261122000001_security_foundation` applied to the live Neon database.
- `20261122000002_commerce_operations` applied to the live Neon database.
- Manual rollback scripts added for both applied migrations.
- Migration backfills now cover customers without email and deduplicate both product and variant SKUs before unique indexes.

Verification:

- `npx prisma generate` succeeds after stopping stale dev-server processes.
- `npx prisma migrate status` reports `Database schema is up to date!`.
- `npx tsc --noEmit`, `npx eslint .` and `npx next build` all pass with the regenerated client.
- Public API and unauthenticated admin smoke checks still pass after migration.

## Phase 3 — Service layer and thin routes

Implemented:

- Public catalogue reads moved to `src/lib/services/catalogue.ts`; `src/lib/data.ts` is now a compatibility facade, so all 9 existing storefront imports keep the same `ProductDTO`/`CategoryDTO` shapes.
- `GET /api/products` and `GET /api/meta/catalog` are thin transports over the catalogue service. No supplier costs, wholesale prices or margins enter public responses.
- New typed service errors (`src/lib/services/errors.ts`) keep expected business failures explicit and redact unexpected errors at the route boundary.
- `PricingService` re-reads product and variant prices inside the order transaction; browser prices are never accepted. Variant `extraPrice` and product-specific `ShippingRule` rows are supported without changing the response shape (neither has live data yet, so the legacy global shipping calculation remains the effective default).
- `InventoryService` uses conditional variant stock decrements, writes `StockMovement` rows and updates product stock/popularity atomically. Cancellation restocking is guarded by `cancelledAt` and uses the ledger to restock exactly what was claimed, regardless of later `trackStock` changes.
- `OrderService` owns customer dedupe via `phoneKey`, duplicate-line merging, collision-safe `HQ-######` numbers, order-status events, and purchased product/price snapshots in `OrderItem`. Idempotency is opt-in via the `Idempotency-Key` header (10-minute `IdempotencyKey` TTL); without the header, legitimate repeat orders are never collapsed.
- `POST /api/orders`, `POST /api/orders/lookup`, `POST /api/inquiries`, `GET /api/meta/catalog` and admin order status PATCH are now thin routes over services.
- Admin product/order/inquiry GET routes use bounded pagination/search helpers while retaining their existing `products`, `orders` and `inquiries` response fields; `pagination` is additive.

Verification:

- `npx tsc --noEmit` passes.
- `npx eslint .` passes.
- `npx next build` passes (38 static/dynamic routes compiled).
- `npx prisma migrate status` reports `Database schema is up to date!`.
- 12/12 HTTP smoke checks against the built server passed: `/api/products` returns 28 products with the exact public `ProductDTO` key set; `/api/meta/catalog`, `/admin/login`, successful and invalid `POST /api/orders/lookup`, public validation errors, unauthenticated admin 401 and cross-origin POST 403 all behave as before.
- OrderService validation path verified over HTTP with a full valid payload and an invalid `Idempotency-Key`; no order or customer was created.
- After the independent review fixes, `npx tsc --noEmit`, `npx eslint .`, `npx next build` and all HTTP rechecks passed again.

Not exercised against live data: a new successful order or inquiry write, because those would create customer records in the live database. No extra dev/test API was added.

## Phase 4 — Owner admin rebuild (implementation complete, UAT pending)

Implemented:

- Admin shell rebuilt with task-grouped navigation, active states, mobile drawer, breadcrumbs, `View website`, sign out and an unsaved-changes guard that intercepts in-app links.
- Shared owner UI kit: page header, cards, badges, fields, check rows, search/filter toolbar, tables with selection and bulk bar, pagination, confirm dialog, modal, empty/loading/error states, status badges, image picker with drag reorder and unsaved-state hook.
- Dashboard rebuilt around attention cards (orders to fulfil, new enquiries, low stock, prices to confirm), at-a-glance counts, latest orders and open enquiries.
- Products: full owner write form with photo upload/preview/reorder, product state selector, price confirmation, enquiry-only/custom-size/size-note controls, colour × size option grid with extra charge and low-stock thresholds, per-field validation, inline supplier/review notes, bulk publish/unpublish and delete confirmation.
- Inventory: variant-level stock list, low-stock and active filters, restock/adjust with confirmation and preview, and stock movement history.
- Orders: server-side search/filter, detail modal with purchased snapshots and price actually paid, labelled allowed transitions, shipment/payment/internal-note editing with confirmation, status timeline and bulk status updates with skip summary.
- Enquiries: two-pane inbox, status filter, measurement view, reference image, internal notes with unsaved guard, labelled next actions and bulk archive.
- Customers, site content, activity log and settings pages added/rebuilt; site content has per-section and save-all flows with dirty warnings.
- Suppliers page migrated to the shared kit; all native `confirm()`/`prompt()` calls removed from the admin area.
- New authenticated admin APIs and services added in support of these screens (product create/edit/bulk, inventory restock/movements, customers, audit, settings, order transitions/bulk, enquiry workflow).

Verification status (completed 2026-11-23):

- Static cross-check completed: every UI import resolves, list response field names and all write payload shapes match their server routes, and no admin page uses a native browser dialog.
- Fixed three type errors found by `tsc`: unsupported `PlusMinus` icon, an ISO-string `lastOrderAt` conversion, and an over-wide `availability` DTO type.
- `npx prisma generate` — passed.
- `npx prisma migrate status` (with `DATABASE_URL_UNPOOLED`) — `Database schema is up to date!` (3 migrations applied).
- `npx tsc --noEmit` — passed with no errors.
- `npx eslint .` — passed with no errors.
- `npx next build` — passed; all 48 static pages generated, all admin routes and APIs present in the route manifest.
- HTTP smoke checks against a production local build: unauthenticated admin APIs return 401, admin pages redirect with 307, public `/api/products` and `/api/meta/catalog` return 200. With a signed super-admin session, 11 admin list/settings APIs, 3 detail APIs, stock movements and all 11 admin pages return 200.
- Committed as `dcc4a0a` and pushed to GitHub.
- Deployed to Vercel production at `https://haji-queen.vercel.app` (deployment `dpl_EJNxip2VC43Va8iezbpivHucBcdG`).
- Production `AUTH_SECRET` was rotated to a new 64-character random value during deployment verification; existing admin sessions are invalidated and the owner must sign in again. `NEXT_PUBLIC_SITE_URL` is `https://haji-queen.vercel.app`.
- Live checks passed: unauthenticated admin APIs 401, admin pages redirect, public APIs 200, and all admin list/detail/page routes 200 with a signed super-admin session.
- Owner UAT is now the only remaining Phase 4 exit requirement.

Exit gate: **not met**. The owner must complete `docs/PHASE4_UAT.md` without developer help.

## Phase 5 onward

Not started: Razorpay/webhooks, notifications, object storage and launch hardening.

## Important deploy preconditions

- Set a strong `AUTH_SECRET` (at least 32 characters) in Vercel before deploying Phase 1.
- Set `NEXT_PUBLIC_SITE_URL` to the production URL.
- No commit, push or deployment has been performed for this implementation phase.
