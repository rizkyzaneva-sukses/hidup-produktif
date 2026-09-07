'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IdeasPage from '@/app/ideas/page';
import RemindersPage from '@/app/reminders/page';

export default function InboxPage() {
  return (
    <Tabs defaultValue="ideas">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 max-w-3xl mx-auto">
        <TabsList className="w-full">
          <TabsTrigger value="ideas" className="flex-1">💡 Parkir Ide</TabsTrigger>
          <TabsTrigger value="reminders" className="flex-1">🔔 Reminders</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="ideas">
        <IdeasPage />
      </TabsContent>

      <TabsContent value="reminders">
        <RemindersPage />
      </TabsContent>
    </Tabs>
  );
}
