-- CreateTable
CREATE TABLE "learning_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📂',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_categories_name_key" ON "learning_categories"("name");

-- AlterTable
ALTER TABLE "learning_logs" ADD COLUMN "category_id" TEXT;

-- AddForeignKey
ALTER TABLE "learning_logs" ADD CONSTRAINT "learning_logs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "learning_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
