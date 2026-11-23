-- Expand schema for catalogue workflow, inventory, payments, shipping and audit-ready operations.
-- All statements are additive; legacy rows receive safe defaults and are backfilled before constraints.

-- Deduplicate existing SKUs before enforcing uniqueness (oldest row wins).
UPDATE "Product" p
SET "sku" = NULL
FROM "Product" d
WHERE d."sku" = p."sku"
  AND d."sku" IS NOT NULL
  AND d."id" < p."id";

UPDATE "ProductVariant" v
SET "sku" = NULL
FROM "ProductVariant" d
WHERE d."sku" = v."sku"
  AND d."sku" IS NOT NULL
  AND d."id" < v."id";

-- Shipping rules must exist before product/order foreign keys are added.
CREATE TABLE "ShippingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "flatFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeThreshold" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingRule_pkey" PRIMARY KEY ("id")
);

-- Product workflow fields.
ALTER TABLE "Product"
    ADD COLUMN "isEnquiryOnly" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "customSizingAllowed" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "readyToDispatch" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "preorderAllowed" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "publishedAt" TIMESTAMP(3),
    ADD COLUMN "publishedBy" TEXT,
    ADD COLUMN "shippingRuleId" TEXT;

UPDATE "Product"
SET "publishedAt" = "createdAt"
WHERE "visible" = true AND "publishedAt" IS NULL;

-- Variant-level pricing, ordering and stock controls.
ALTER TABLE "ProductVariant"
    ADD COLUMN "extraPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Customer dedupe key.
ALTER TABLE "Customer"
    ADD COLUMN "emailNormalized" TEXT,
    ADD COLUMN "phoneKey" TEXT,
    ADD COLUMN "consentAt" TIMESTAMP(3),
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Customer"
SET "phoneKey" = regexp_replace("phone", '\D', '', 'g'),
    "emailNormalized" = CASE WHEN "email" IS NULL THEN NULL ELSE lower(trim("email")) END;

UPDATE "Customer" c
SET "phoneKey" = NULL
FROM "Customer" d
WHERE d."phoneKey" = c."phoneKey"
  AND d."phoneKey" IS NOT NULL
  AND d."id" < c."id";

-- Order operations fields.
ALTER TABLE "Order"
    ADD COLUMN "idempotencyKey" TEXT,
    ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'INR',
    ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "carrier" TEXT,
    ADD COLUMN "trackingNumber" TEXT,
    ADD COLUMN "shippingRuleId" TEXT,
    ADD COLUMN "cancelledAt" TIMESTAMP(3),
    ADD COLUMN "cancellationReason" TEXT;

UPDATE "Order"
SET "cancelledAt" = "updatedAt"
WHERE "status" = 'CANCELLED' AND "cancelledAt" IS NULL;

-- Link purchased lines to the exact variant.
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;

CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "orderId" TEXT,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryReservation" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "orderId" TEXT,
    "quantity" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "signatureVerifiedAt" TIMESTAMP(3),
    "rawPayloadHash" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "gatewayRefundId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderStatusEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'PRODUCT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdempotencyKey" (
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("key")
);

-- Unique and lookup indexes.
CREATE UNIQUE INDEX "ShippingRule_name_key" ON "ShippingRule"("name");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE UNIQUE INDEX "Customer_phoneKey_key" ON "Customer"("phoneKey");
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE UNIQUE INDEX "Payment_gateway_gatewayOrderId_key" ON "Payment"("gateway", "gatewayOrderId");
CREATE UNIQUE INDEX "Payment_gateway_gatewayPaymentId_key" ON "Payment"("gateway", "gatewayPaymentId");
CREATE UNIQUE INDEX "Refund_gatewayRefundId_key" ON "Refund"("gatewayRefundId");
CREATE UNIQUE INDEX "MediaAsset_key_key" ON "MediaAsset"("key");

CREATE INDEX "Product_categoryId_visible_createdAt_idx" ON "Product"("categoryId", "visible", "createdAt");
CREATE INDEX "Product_visible_featured_createdAt_idx" ON "Product"("visible", "featured", "createdAt");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");
CREATE INDEX "MeasurementInquiry_status_createdAt_idx" ON "MeasurementInquiry"("status", "createdAt");
CREATE INDEX "MeasurementInquiry_phone_idx" ON "MeasurementInquiry"("phone");
CREATE INDEX "ContactInquiry_status_createdAt_idx" ON "ContactInquiry"("status", "createdAt");
CREATE INDEX "StockMovement_variantId_createdAt_idx" ON "StockMovement"("variantId", "createdAt");
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");
CREATE INDEX "StockMovement_orderId_idx" ON "StockMovement"("orderId");
CREATE INDEX "InventoryReservation_variantId_expiresAt_idx" ON "InventoryReservation"("variantId", "expiresAt");
CREATE INDEX "InventoryReservation_orderId_idx" ON "InventoryReservation"("orderId");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "OrderStatusEvent_orderId_createdAt_idx" ON "OrderStatusEvent"("orderId", "createdAt");
CREATE INDEX "MediaAsset_kind_createdAt_idx" ON "MediaAsset"("kind", "createdAt");
CREATE INDEX "WebhookEvent_gateway_createdAt_idx" ON "WebhookEvent"("gateway", "createdAt");
CREATE INDEX "IdempotencyKey_scope_expiresAt_idx" ON "IdempotencyKey"("scope", "expiresAt");

-- Relations.
ALTER TABLE "Product" ADD CONSTRAINT "Product_shippingRuleId_fkey" FOREIGN KEY ("shippingRuleId") REFERENCES "ShippingRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingRuleId_fkey" FOREIGN KEY ("shippingRuleId") REFERENCES "ShippingRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
