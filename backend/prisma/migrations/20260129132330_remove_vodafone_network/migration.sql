/*
  Warnings:

  - The values [VODAFONE] on the enum `Network` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Network_new" AS ENUM ('MTN', 'AIRTELTIGO');
ALTER TABLE "data_bundles" ALTER COLUMN "network" TYPE "Network_new" USING ("network"::text::"Network_new");
ALTER TYPE "Network" RENAME TO "Network_old";
ALTER TYPE "Network_new" RENAME TO "Network";
DROP TYPE "public"."Network_old";
COMMIT;
