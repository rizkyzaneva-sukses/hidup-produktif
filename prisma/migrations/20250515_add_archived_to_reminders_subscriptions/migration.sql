-- AlterTable: Add archived field to reminders
ALTER TABLE "reminders" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add archived field to subscriptions
ALTER TABLE "subscriptions" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
