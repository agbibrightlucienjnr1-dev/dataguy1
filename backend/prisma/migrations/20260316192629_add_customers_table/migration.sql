-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "total_orders_count" INTEGER NOT NULL DEFAULT 0,
    "successful_orders_count" INTEGER NOT NULL DEFAULT 0,
    "first_order_at" TIMESTAMP(3),
    "last_order_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");
