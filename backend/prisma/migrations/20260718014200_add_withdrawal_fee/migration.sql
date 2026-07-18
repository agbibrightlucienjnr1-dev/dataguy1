-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN "withdrawal_flat_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.5,
ADD COLUMN "withdrawal_fee_percentage" DECIMAL(5,2) NOT NULL DEFAULT 2.0;

-- AlterTable
ALTER TABLE "withdrawals" ADD COLUMN "fee" DECIMAL(10,2) NOT NULL DEFAULT 0.0;
