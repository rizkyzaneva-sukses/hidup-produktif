-- AlterTable: add priority column to ideas table
ALTER TABLE "ideas" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'P3';
