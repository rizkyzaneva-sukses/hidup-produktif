import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const taskId = searchParams.get('task_id');

    const where: any = {};
    if (date) where.date = date;
    if (taskId) where.taskId = taskId;

    const sessions = await prisma.focusSession.findMany({
      where,
      orderBy: { startTime: 'desc' },
    });
    return NextResponse.json(sessions.map((s: any) => ({
      ...s,
      task_id: s.taskId,
      start_time: s.startTime,
      end_time: s.endTime,
      duration_minutes: s.durationMinutes,
    })));
  } catch (error: any) {
    console.error('[API] GET /api/focus-sessions error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await prisma.focusSession.create({
      data: {
        taskId: body.task_id || null,
        mode: body.mode || 'focus',
        startTime: body.start_time,
        endTime: body.end_time || null,
        durationMinutes: body.duration_minutes || 0,
        completed: body.completed !== undefined ? body.completed : false,
        date: body.date,
      },
    });
    return NextResponse.json({
      ...session,
      task_id: session.taskId,
      start_time: session.startTime,
      end_time: session.endTime,
      duration_minutes: session.durationMinutes,
    });
  } catch (error: any) {
    console.error('[API] POST /api/focus-sessions error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
