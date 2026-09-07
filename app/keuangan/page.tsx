'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscriptionsContent from '@/app/subscriptions/_subscriptions-content';
import LaporanContent from '@/app/laporan/_laporan-content';

export default function KeuanganPage() {
  return (
    <Tabs defaultValue="subscriptions">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 max-w-5xl mx-auto">
        <TabsList className="w-full">
          <TabsTrigger value="subscriptions" className="flex-1">💳 Langganan</TabsTrigger>
          <TabsTrigger value="laporan" className="flex-1">📊 Laporan</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="subscriptions"><SubscriptionsContent /></TabsContent>
      <TabsContent value="laporan"><LaporanContent /></TabsContent>
    </Tabs>
  );
}
