-- CreateTable
CREATE TABLE "sub_agent_prices" (
    "id" TEXT NOT NULL,
    "sub_agent_id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "customer_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_agent_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sub_agent_prices_sub_agent_id_bundle_id_key" ON "sub_agent_prices"("sub_agent_id", "bundle_id");

-- AddForeignKey
ALTER TABLE "sub_agent_prices" ADD CONSTRAINT "sub_agent_prices_sub_agent_id_fkey" FOREIGN KEY ("sub_agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_agent_prices" ADD CONSTRAINT "sub_agent_prices_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "data_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
