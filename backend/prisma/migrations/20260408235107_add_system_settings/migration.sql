-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Network" ADD VALUE 'TELECEL';
ALTER TYPE "Network" ADD VALUE 'AT';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_provider" TEXT NOT NULL DEFAULT 'paystack';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferences" JSONB;

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "active_payment_provider" TEXT NOT NULL DEFAULT 'paystack',
    "moolre_fee_percentage" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "moolre_flat_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.5,
    "paystack_fee_percentage" DECIMAL(5,2) NOT NULL DEFAULT 1.95,
    "paystack_flat_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
