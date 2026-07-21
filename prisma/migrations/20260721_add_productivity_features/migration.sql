-- AlterTable: Add new columns to tasks table
ALTER TABLE "tasks" ADD COLUMN "recurring" TEXT,
ADD COLUMN "recurring_parent_id" TEXT;

-- AlterTable: Add new column to habits table
ALTER TABLE "habits" ADD COLUMN "streak_goal" INTEGER;

-- CreateTable: time_logs
CREATE TABLE "time_logs" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: focus_sessions
CREATE TABLE "focus_sessions" (
    "id" TEXT NOT NULL,
    "task_id" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'Pomodoro',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: weekly_goals
CREATE TABLE "weekly_goals" (
    "id" TEXT NOT NULL,
    "week_start" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CEO',
    "title" TEXT NOT NULL,
    "target" INTEGER NOT NULL DEFAULT 1,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable: task_templates
CREATE TABLE "task_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CEO',
    "emoji" TEXT NOT NULL DEFAULT '📋',
    "tasks" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: mood_logs
CREATE TABLE "mood_logs" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "energy_level" INTEGER NOT NULL DEFAULT 3,
    "mood" TEXT NOT NULL DEFAULT 'Netral',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: quarterly_goals
CREATE TABLE "quarterly_goals" (
    "id" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CEO',
    "title" TEXT NOT NULL,
    "key_results" TEXT NOT NULL DEFAULT '[]',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quarterly_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint on mood_logs(date, hour)
CREATE UNIQUE INDEX "mood_logs_date_hour_key" ON "mood_logs"("date", "hour");

-- AddForeignKey: time_logs -> tasks
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
