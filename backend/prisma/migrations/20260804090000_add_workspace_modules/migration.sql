-- Guarded so this is safe to re-run no matter what partial state the
-- database is already in.

-- CreateEnum (skip if it already exists)
DO $$ BEGIN
    CREATE TYPE "WorkspaceModule" AS ENUM ('CRM', 'HR', 'FINANCE', 'INVENTORY');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable (skip each column if it already exists)
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "enabledModules" "WorkspaceModule"[] NOT NULL DEFAULT ARRAY[]::"WorkspaceModule"[];
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "country" TEXT;

-- Backfill only orgs that don't have any modules enabled yet, so this
-- never overwrites modules a real signup already chose.
UPDATE "organizations"
SET "enabledModules" = ARRAY['CRM','HR','FINANCE','INVENTORY']::"WorkspaceModule"[]
WHERE cardinality("enabledModules") = 0;