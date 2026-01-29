-- CreateEnum
CREATE TYPE "Network" AS ENUM ('MTN', 'VODAFONE', 'AIRTELTIGO');

-- CreateTable
CREATE TABLE "data_bundles" (
    "id" TEXT NOT NULL,
    "network" "Network" NOT NULL,
    "volume" TEXT NOT NULL,
    "hubnet_cost" DECIMAL(10,2) NOT NULL,
    "admin_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_bundles_network_volume_key" ON "data_bundles"("network", "volume");
