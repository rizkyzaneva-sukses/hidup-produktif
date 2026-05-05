import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const habitId = searchParams.get('habit_id');
    
    const where: any = {};
    if (date) where.date = date;
    if (habitId) where.habitId = habitId;
    
    const logs = await prisma.habitLog.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 1000,
    });
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('[API] GET /api/habit-logs error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = await prisma.habitLog.findUnique({
      where: { habitId_date: { habitId: body.habit_id, date: body.date } },
    });
    if (existing) return NextResponse.json(existing);
    
    const log = await prisma.habitLog.create({
      data: {
        habitId: body.habit_id,
        date: body.date,
        completed: true,
      },
    });
    return NextResponse.json(log);
  } catch (error: any) {
    console.error('[API] POST /api/habit-logs error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
