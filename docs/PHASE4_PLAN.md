# Phase 4 implementation plan — owner admin rebuild

## Gate

Phase 4 is complete only when `docs/PHASE4_UAT.md` is passed by the owner without developer help.

## Design rules

- Keep the existing public API/DTO contract untouched. No storefront redesign.
- Keep one authoritative Prisma/Neon backend. No second admin backend.
- All admin writes continue through authenticated/authorised server routes that call Phase 3 services. No browser prices, no direct client DB access.
- Reuse the existing Tailwind design language and the Phase 1 auth/audit controls.
- Prefer plain-language labels, inline validation, previews, confirmation dialogs and reversible actions over native `prompt`/`confirm`.
- Every list is searchable/filterable and paginated; every destructive or status-changing action is confirmed and audited.

## Workstreams

1. **Admin shell**
   - Task-based sidebar grouped by Owner daily tasks / Catalogue / Business.
   - Active-route state, mobile navigation, consistent page headers, breadcrumbs and empty states.
   - Keep `View Website`, logout and the security page reachable.

2. **Shared owner UI kit**
   - Page header, card/section, status badge, field wrapper with hint/error, data table with selection and bulk-action bar, search/filter bar, confirm dialog, toast, image picker with preview/reorder, variant stock grid.

3. **Dashboard**
   - Attention cards: orders to fulfil, new enquiries, low stock, pending prices.
   - Recent orders and enquiries with direct links.
   - Quick actions: add product, review enquiries, open orders.

4. **Catalogue / products**
   - Product form with visual photo upload/preview/reorder, publish state, price confirmation, enquiry-only/custom-size/size-note controls.
   - Colour × size variant grid with stock, extra charge and active flags; validation before save.
   - Bulk publish/unpublish/hide.

5. **Inventory**
   - Variant-level sellable stock grid, low-stock filter, restock action, stock movement history.
   - Aggregate product stock shown as read-only derived information.

6. **Orders**
   - Search/filter by number, customer, status, payment status.
   - Detail drawer with purchased snapshot, price actually paid, timeline and shipment fields where available.
   - Labelled status transitions and bulk status update with confirmation.

7. **Enquiries**
   - Inbox with status filter, full measurement view, reference images, internal notes and status workflow.
   - Clear next action for each enquiry.

8. **Customers / content / audit**
   - Customer lookup with order history.
   - Content editor with labelled fields and unsaved-changes warning.
   - Audit log list filterable by actor/action/entity.

9. **Verification**
   - `npx tsc --noEmit`
   - `npx eslint .`
   - `npx next build`
   - `npx prisma migrate status`
   - Local HTTP smoke checks for every new admin route (authenticated and unauthenticated).
   - Owner UAT using `docs/PHASE4_UAT.md`.

## Out of scope for Phase 4

- Razorpay/webhooks/refunds (Phase 5).
- Notification providers and message templates (Phase 5/6).
- Object storage migration and monitoring (Phase 6).
- Price changes, catalogue re-import, deletion of demo products or storefront redesign.
