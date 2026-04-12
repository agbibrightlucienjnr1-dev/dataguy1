-- Add delivery_provider column to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_provider" TEXT NOT NULL DEFAULT 'hubnet';

-- Add active_delivery_provider column to system_settings table
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "active_delivery_provider" TEXT NOT NULL DEFAULT 'hubnet';
