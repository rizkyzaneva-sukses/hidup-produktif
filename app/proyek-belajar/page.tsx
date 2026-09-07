'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectsContent from '@/app/projects/_projects-content';
import LearningContent from '@/app/learning/_learning-content';

export default function ProyekBelajarPage() {
  return (
    <Tabs defaultValue="projects">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 max-w-5xl mx-auto">
        <TabsList className="w-full">
          <TabsTrigger value="projects" className="flex-1">📂 Proyek</TabsTrigger>
          <TabsTrigger value="learning" className="flex-1">🎓 Belajar</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="projects"><ProjectsContent /></TabsContent>
      <TabsContent value="learning"><LearningContent /></TabsContent>
    </Tabs>
  );
}
