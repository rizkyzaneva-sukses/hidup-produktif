import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get('week_start');

    const where: any = {};
    if (weekStart) where.weekStart = weekStart;

    const goals = await prisma.weeklyGoal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(goals.map((g: any) => ({
      ...g,
      week_start: g.weekStart,
      completed_count: g.completed,
    })));
  } catch (error: any) {
    console.error('[API] GET /api/weekly-goals error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Batch-update completed counts
    if (body.update_completed && Array.isArray(body.update_completed)) {
      for (const item of body.update_completed) {
        await prisma.weeklyGoal.update({
          where: { id: item.id },
          data: { completed: item.completed_count },
        });
      }
      return NextResponse.json({ ok: true });
    }

    const goal = await prisma.weeklyGoal.create({
      data: {
        weekStart: body.week_start,
        role: body.role,
        title: body.title,
        target: body.target,
      },
    });
    return NextResponse.json({
      ...goal,
      week_start: goal.weekStart,
      completed_count: goal.completed,
    });
  } catch (error: any) {
    console.error('[API] POST /api/weekly-goals error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
