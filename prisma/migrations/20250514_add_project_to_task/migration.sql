-- AlterTable: Add project_id to tasks
ALTER TABLE "tasks" ADD COLUMN "project_id" TEXT;

-- CreateIndex (optional, for query performance)
CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
