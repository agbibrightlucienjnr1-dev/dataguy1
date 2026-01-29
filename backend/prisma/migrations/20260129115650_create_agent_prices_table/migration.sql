-- CreateTable
CREATE TABLE "agent_prices" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "customer_price" DECIMAL(10,2) NOT NULL,
    "sub_agent_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_prices_agent_id_bundle_id_key" ON "agent_prices"("agent_id", "bundle_id");

-- AddForeignKey
ALTER TABLE "agent_prices" ADD CONSTRAINT "agent_prices_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_prices" ADD CONSTRAINT "agent_prices_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "data_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
