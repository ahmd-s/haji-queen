-- Manual rollback for 20261122000001_security_foundation.
-- Prisma does not execute this automatically. Running it invalidates all admin sessions.

DROP TABLE IF EXISTS "AuditLog";
ALTER TABLE "AdminUser" DROP COLUMN IF EXISTS "sessionVersion";
