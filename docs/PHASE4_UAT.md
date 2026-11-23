# Phase 4 — Owner admin UAT checklist

Phase 4 exit gate: **the owner completes the key tasks below without developer help.**

This checklist is written in plain owner language. During UAT, tick each step only when the owner can do it from the admin panel alone. If a step needs code, SQL, a repair script, or a developer request, Phase 4 has not passed.

## A. Find your way around

- [ ] Sign in at `/admin/login`.
- [ ] See today's attention items on the dashboard: orders to fulfil, new enquiries, low stock, and quick actions.
- [ ] Open every sidebar section and return to the dashboard without getting lost.
- [ ] Use the mobile/narrow layout without horizontal scrolling of the whole page.

## B. Catalogue and product photos

- [ ] Add a new product with title, price, category, description and at least one photo.
- [ ] See a large preview of each photo before saving.
- [ ] Reorder photos and know which photo will be the main product image.
- [ ] Mark a product as Live, Hidden, Pending approval or Enquiry only.
- [ ] Set a pending price or confirm a price without editing raw JSON.
- [ ] Add sizes and colours, including a larger-size extra charge.
- [ ] Save size notes / measurement prompts for a custom-size product.
- [ ] Edit an existing product and see the previous values filled in.
- [ ] Bulk publish or unpublish selected products.

## C. Stock and variants

- [ ] Find a product from the Inventory screen, not by opening its product card.
- [ ] See sellable stock per colour × size variant.
- [ ] Restock one variant and confirm the new sellable quantity immediately.
- [ ] Filter to low-stock variants.
- [ ] See the stock movement history for a variant (who/when/how much/why).

## D. Orders

- [ ] Find an order by order number, customer name, email or phone.
- [ ] Filter by status and payment status.
- [ ] Open an order and see the purchased product snapshot and the price actually paid.
- [ ] Move an order through the allowed statuses using labelled buttons, not free text.
- [ ] See the order timeline / status history.
- [ ] Bulk-update the status of selected orders.
- [ ] Understand why an invalid status transition is blocked.

## E. Enquiries

- [ ] Open the enquiry inbox and see new enquiries first.
- [ ] Read all measurement fields and view any reference images.
- [ ] Add an internal note and change the enquiry status.
- [ ] Filter by status.
- [ ] Find an enquiry again after leaving the page.

## F. Customers and content

- [ ] Find a customer by phone or email.
- [ ] See that customer's past orders.
- [ ] Edit homepage copy / contact details through labelled fields.
- [ ] See a dirty-state warning before leaving unsaved content changes.
- [ ] Save content and confirm the storefront shows the new text.

## G. Safety and errors

- [ ] Get a clear field-level error when a required field is empty or a price is invalid.
- [ ] Never see a raw stack trace, Prisma error or database message.
- [ ] Confirm actions that delete, publish, cancel or restock before they happen.
- [ ] Use the password/security page to change the admin password.
- [ ] See an audit entry after a price change, publish action or order status change (where the audit screen is available).

## UAT result

- Owner name: ______________________
- Date: ______________________
- Sections passed: A / B / C / D / E / F / G
- Blocking issues (must be zero to exit Phase 4): ______________________
