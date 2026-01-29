/*
  Warnings:

  - A unique constraint covering the columns `[payment_link_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "payment_link_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_payment_link_code_key" ON "users"("payment_link_code");
