-- CreateEnum
CREATE TYPE "WorkspaceModule" AS ENUM ('CRM', 'HR', 'FINANCE', 'INVENTORY');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "enabledModules" "WorkspaceModule"[] NOT NULL DEFAULT ARRAY[]::"WorkspaceModule"[];

-- backfill existing orgs with full access so nothing breaks post-deploy
UPDATE "organizations" SET "enabledModules" = ARRAY['CRM','HR','FINANCE','INVENTORY']::"WorkspaceModule"[];