'use client';
import HabitsPage from '@/app/habits/_habits-content';
import MoodPage from '@/app/mood/_mood-content';

export default function RutinitasPage() {
  return (
    <div className="space-y-0">
      <HabitsPage />
      <div className="mx-4 sm:mx-6 lg:mx-8 max-w-5xl lg:mx-auto">
        <hr className="border-slate-800 my-4" />
      </div>
      <MoodPage />
    </div>
  );
}
