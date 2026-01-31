-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "transaction_fee" DECIMAL(10,2) NOT NULL DEFAULT 0;
