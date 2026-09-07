'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SprintPage from '@/app/sprint/_sprint-content';
import TasksPage from '@/app/tasks/_tasks-content';
import GoalsPage from '@/app/goals/_goals-content';

export default function AktivitasPage() {
  return (
    <Tabs defaultValue="sprint">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 max-w-5xl mx-auto">
        <TabsList className="w-full">
          <TabsTrigger value="sprint" className="flex-1">Hari Ini</TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1">Semua Tugas</TabsTrigger>
          <TabsTrigger value="goals" className="flex-1">Target</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="sprint">
        <SprintPage />
      </TabsContent>

      <TabsContent value="tasks">
        <TasksPage />
      </TabsContent>

      <TabsContent value="goals">
        <GoalsPage />
      </TabsContent>
    </Tabs>
  );
}
