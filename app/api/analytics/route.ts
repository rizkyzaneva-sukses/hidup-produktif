import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getDateRange(range: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start: string;

  switch (range) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
      break;
    }
    case 'month': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split('T')[0];
      break;
    }
    case 'quarter': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      start = d.toISOString().split('T')[0];
      break;
    }
    default: {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    }
  }

  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'week';
    const { start, end } = getDateRange(range);

    // Tasks completed in range
    const tasksCompleted = await prisma.task.count({
      where: {
        completed: true,
        updatedAt: { gte: start, lte: end },
      },
    });

    // Tasks created in range
    const tasksCreated = await prisma.task.count({
      where: {
        createdAt: { gte: start, lte: end },
      },
    });

    // Total focus session minutes
    const focusAgg = await prisma.focusSession.aggregate({
      where: {
        date: { gte: start, lte: end },
      },
      _sum: { durationMinutes: true },
    });
    const focusMinutes = focusAgg._sum.durationMinutes || 0;

    // Mood average (energy level)
    const moodAgg = await prisma.moodLog.aggregate({
      where: {
        date: { gte: start, lte: end },
      },
      _avg: { energyLevel: true },
    });
    const moodAverage = moodAgg._avg.energyLevel ? Math.round(moodAgg._avg.energyLevel * 10) / 10 : null;

    // Habit completion rate
    const totalHabits = await prisma.habit.count({ where: { active: true } });
    const habitLogsInRange = await prisma.habitLog.count({
      where: {
        date: { gte: start, lte: end },
        completed: true,
      },
    });
    const daysInRange = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
    const expectedCompletions = totalHabits * daysInRange;
    const habitCompletionRate = expectedCompletions > 0
      ? Math.round((habitLogsInRange / expectedCompletions) * 100)
      : 0;

    // Streaks for each active habit
    const activeHabits = await prisma.habit.findMany({
      where: { active: true },
    });

    const streaks: Record<string, number> = {};
    for (const habit of activeHabits) {
      let streak = 0;
      const d = new Date();
      // Check today first
      const todayStr = d.toISOString().split('T')[0];
      const todayLog = await prisma.habitLog.findUnique({
        where: { habitId_date: { habitId: habit.id, date: todayStr } },
      });
      if (!todayLog || !todayLog.completed) {
        // Check yesterday
        d.setDate(d.getDate() - 1);
      }

      while (true) {
        const dateStr = d.toISOString().split('T')[0];
        const log = await prisma.habitLog.findUnique({
          where: { habitId_date: { habitId: habit.id, date: dateStr } },
        });
        if (log && log.completed) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
      }
      streaks[habit.label] = streak;
    }

    // Productivity score (weighted: tasks 40%, focus 30%, mood 15%, habits 15%)
    const taskScore = tasksCreated > 0 ? Math.min(100, (tasksCompleted / Math.max(tasksCreated, 1)) * 100) : 50;
    const focusScore = Math.min(100, (focusMinutes / (8 * 60)) * 100); // 8 hours target
    const moodScore = moodAverage ? (moodAverage / 5) * 100 : 50;
    const habitScore = habitCompletionRate;
    const productivityScore = Math.round(
      taskScore * 0.4 + focusScore * 0.3 + moodScore * 0.15 + habitScore * 0.15
    );

    // Role breakdown
    const tasksWithRoles = await prisma.task.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: { role: true, completed: true },
    });

    const roleMap: Record<string, { total: number; completed: number }> = {};
    for (const t of tasksWithRoles) {
      if (!roleMap[t.role]) roleMap[t.role] = { total: 0, completed: 0 };
      roleMap[t.role].total++;
      if (t.completed) roleMap[t.role].completed++;
    }
    const roleBreakdown = Object.entries(roleMap).map(([role, counts]) => ({
      role,
      total: counts.total,
      completed: counts.completed,
      completion_rate: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
    }));

    // Daily trend (tasks completed per day)
    const completedTasks = await prisma.task.findMany({
      where: {
        completed: true,
        updatedAt: { gte: start, lte: end },
      },
      select: { updatedAt: true },
    });

    const dailyMap: Record<string, number> = {};
    for (const t of completedTasks) {
      const day = t.updatedAt.split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    }
    const dailyTrend = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      range,
      date_start: start,
      date_end: end,
      tasks_completed: tasksCompleted,
      tasks_created: tasksCreated,
      focus_minutes: focusMinutes,
      mood_average: moodAverage,
      habit_completion_rate: habitCompletionRate,
      streaks,
      productivity_score: Math.min(100, Math.max(0, productivityScore)),
      role_breakdown: roleBreakdown,
      daily_trend: dailyTrend,
    });
  } catch (error: any) {
    console.error('[API] GET /api/analytics error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
