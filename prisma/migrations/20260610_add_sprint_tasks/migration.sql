-- CreateTable sprint_tasks with FK to daily_sprints and tasks
CREATE TABLE "sprint_tasks" (
    "id" TEXT NOT NULL,
    "sprint_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "task_title" TEXT NOT NULL,
    "duration" TEXT NOT NULL DEFAULT '1 jam',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sprint_tasks_pkey" PRIMARY KEY ("id")
);

-- UniqueConstraint: one task per sprint
ALTER TABLE "sprint_tasks" ADD CONSTRAINT "sprint_tasks_sprint_id_task_id_key" UNIQUE ("sprint_id", "task_id");

-- AddForeignKey sprint_tasks.sprint_id -> daily_sprints.id
ALTER TABLE "sprint_tasks" ADD CONSTRAINT "sprint_tasks_sprint_id_fkey"
    FOREIGN KEY ("sprint_id") REFERENCES "daily_sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey sprint_tasks.task_id -> tasks.id
ALTER TABLE "sprint_tasks" ADD CONSTRAINT "sprint_tasks_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing JSON data from daily_sprints.tasks into sprint_tasks
-- For each sprint, parse the tasks JSON array and insert rows
-- We use a DO block to handle JSON parsing safely
DO $$
DECLARE
  sprint_row RECORD;
  task_item JSONB;
  task_exists BOOLEAN;
  new_id TEXT;
  idx INT;
BEGIN
  FOR sprint_row IN SELECT id, tasks FROM daily_sprints WHERE tasks != '[]' AND tasks != '' LOOP
    BEGIN
      idx := 0;
      FOR task_item IN SELECT * FROM jsonb_array_elements(sprint_row.tasks::JSONB) LOOP
        -- Check task exists in tasks table
        SELECT EXISTS(SELECT 1 FROM tasks WHERE id = task_item->>'task_id') INTO task_exists;
        IF task_exists THEN
          -- Generate cuid-like id using gen_random_uuid
          new_id := 'migr_' || replace(gen_random_uuid()::text, '-', '');
          INSERT INTO sprint_tasks (id, sprint_id, task_id, task_title, duration, sort_order, created_at)
          VALUES (
            new_id,
            sprint_row.id,
            task_item->>'task_id',
            COALESCE(task_item->>'task_title', ''),
            COALESCE(task_item->>'duration', '1 jam'),
            idx,
            NOW()
          )
          ON CONFLICT (sprint_id, task_id) DO NOTHING;
          idx := idx + 1;
        END IF;
      END LOOP;
    EXCEPTION WHEN OTHERS THEN
      -- Skip sprints with invalid JSON
      RAISE NOTICE 'Skipping sprint % due to error: %', sprint_row.id, SQLERRM;
    END;
  END LOOP;
END;
$$;
