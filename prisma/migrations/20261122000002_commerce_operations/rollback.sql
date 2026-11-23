-- Manual rollback for 20261122000002_commerce_operations.
-- Prisma does not execute this automatically. Run only after restoring a verified backup.
-- This contract drops the new operational tables and columns added in the expand migration.
-- The forward migration nulls duplicate SKUs before adding unique indexes; those
-- original values cannot be restored by this script, so a verified backup is required.

DROP TABLE IF EXISTS "IdempotencyKey";
DROP TABLE IF EXISTS "WebhookEvent";
DROP TABLE IF EXISTS "MediaAsset";
DROP TABLE IF EXISTS "OrderStatusEvent";
DROP TABLE IF EXISTS "Refund";
DROP TABLE IF EXISTS "Payment";
DROP TABLE IF EXISTS "InventoryReservation";
DROP TABLE IF EXISTS "StockMovement";

-- SKU columns predate this migration; remove only the new uniqueness constraints.
DROP INDEX IF EXISTS "Product_sku_key";
DROP INDEX IF EXISTS "ProductVariant_sku_key";

ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_variantId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_shippingRuleId_fkey";
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_shippingRuleId_fkey";

ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "variantId";

ALTER TABLE "Order"
    DROP COLUMN IF EXISTS "cancellationReason",
    DROP COLUMN IF EXISTS "cancelledAt",
    DROP COLUMN IF EXISTS "shippingRuleId",
    DROP COLUMN IF EXISTS "trackingNumber",
    DROP COLUMN IF EXISTS "carrier",
    DROP COLUMN IF EXISTS "tax",
    DROP COLUMN IF EXISTS "discount",
    DROP COLUMN IF EXISTS "currency",
    DROP COLUMN IF EXISTS "idempotencyKey";

ALTER TABLE "Customer"
    DROP COLUMN IF EXISTS "updatedAt",
    DROP COLUMN IF EXISTS "consentAt",
    DROP COLUMN IF EXISTS "phoneKey",
    DROP COLUMN IF EXISTS "emailNormalized";

ALTER TABLE "ProductVariant"
    DROP COLUMN IF EXISTS "updatedAt",
    DROP COLUMN IF EXISTS "createdAt",
    DROP COLUMN IF EXISTS "lowStockThreshold",
    DROP COLUMN IF EXISTS "isActive",
    DROP COLUMN IF EXISTS "sortOrder",
    DROP COLUMN IF EXISTS "extraPrice";

ALTER TABLE "Product"
    DROP COLUMN IF EXISTS "shippingRuleId",
    DROP COLUMN IF EXISTS "publishedBy",
    DROP COLUMN IF EXISTS "publishedAt",
    DROP COLUMN IF EXISTS "preorderAllowed",
    DROP COLUMN IF EXISTS "readyToDispatch",
    DROP COLUMN IF EXISTS "customSizingAllowed",
    DROP COLUMN IF EXISTS "isEnquiryOnly";

DROP TABLE IF EXISTS "ShippingRule";
