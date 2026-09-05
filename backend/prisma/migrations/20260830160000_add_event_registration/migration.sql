-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('pending', 'confirmed', 'failed');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "event_date" TIMESTAMP(3),
    "whatsapp_group_link" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "payment_reference" TEXT NOT NULL,
    "payment_provider" TEXT NOT NULL DEFAULT 'paystack',
    "status" "RegistrationStatus" NOT NULL DEFAULT 'pending',
    "whatsapp_accessed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_payment_reference_key" ON "event_registrations"("payment_reference");

-- CreateIndex
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations"("event_id");

-- CreateIndex
CREATE INDEX "event_registrations_phone_idx" ON "event_registrations"("phone");

-- CreateIndex
CREATE INDEX "event_registrations_status_idx" ON "event_registrations"("status");

-- CreateIndex
CREATE INDEX "event_registrations_payment_reference_idx" ON "event_registrations"("payment_reference");

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
