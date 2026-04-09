-- Correctly handle enum values with safety checks
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'Network' AND e.enumlabel = 'TELECEL') THEN
        ALTER TYPE "Network" ADD VALUE 'TELECEL';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'Network' AND e.enumlabel = 'AT') THEN
        ALTER TYPE "Network" ADD VALUE 'AT';
    END IF;
END $$;

-- Safe Add Column for orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_provider" TEXT NOT NULL DEFAULT 'paystack';

-- Safe Add Column for users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferences" JSONB;

-- Safe Create Table for system_settings
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "active_payment_provider" TEXT NOT NULL DEFAULT 'paystack',
    "moolre_fee_percentage" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "moolre_flat_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.5,
    "paystack_fee_percentage" DECIMAL(5,2) NOT NULL DEFAULT 1.95,
    "paystack_flat_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
