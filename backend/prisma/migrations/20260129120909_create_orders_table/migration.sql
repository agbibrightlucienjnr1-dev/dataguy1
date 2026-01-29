-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'payment_confirmed', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('agent', 'sub_agent');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_name" TEXT,
    "bundle_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "seller_type" "SellerType" NOT NULL,
    "price_paid" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "payment_reference" TEXT,
    "payment_confirmed_at" TIMESTAMP(3),
    "hubnet_order_id" TEXT,
    "hubnet_status" TEXT,
    "hubnet_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_payment_reference_key" ON "orders"("payment_reference");

-- CreateIndex
CREATE INDEX "orders_customer_phone_idx" ON "orders"("customer_phone");

-- CreateIndex
CREATE INDEX "orders_seller_id_idx" ON "orders"("seller_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "data_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
