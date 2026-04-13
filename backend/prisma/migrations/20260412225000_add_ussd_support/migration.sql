-- Add agent_code auto-increment to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'agent_code'
  ) THEN
    -- Create a sequence for agent codes
    CREATE SEQUENCE IF NOT EXISTS users_agent_code_seq;
    
    -- Add the column with sequence default
    ALTER TABLE "users" ADD COLUMN "agent_code" INTEGER;
    
    -- Backfill existing rows with sequential values
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
      FROM "users"
    )
    UPDATE "users" SET "agent_code" = numbered.rn
    FROM numbered WHERE "users".id = numbered.id;
    
    -- Set default for future rows
    PERFORM setval('users_agent_code_seq', COALESCE((SELECT MAX(agent_code) FROM "users"), 0));
    ALTER TABLE "users" ALTER COLUMN "agent_code" SET DEFAULT nextval('users_agent_code_seq');
    ALTER TABLE "users" ALTER COLUMN "agent_code" SET NOT NULL;
    
    -- Add unique constraint
    ALTER TABLE "users" ADD CONSTRAINT "users_agent_code_key" UNIQUE ("agent_code");
  END IF;
END $$;

-- Create ussd_sessions table
CREATE TABLE IF NOT EXISTS "ussd_sessions" (
  "id" TEXT NOT NULL,
  "msisdn" TEXT NOT NULL,
  "stage" TEXT NOT NULL DEFAULT 'AWAIT_AGENT',
  "agent_id" TEXT,
  "network" TEXT,
  "bundle_id" TEXT,
  "recipient" TEXT,
  "page" INTEGER NOT NULL DEFAULT 0,
  "order_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ussd_sessions_pkey" PRIMARY KEY ("id")
);
