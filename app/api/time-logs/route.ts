import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('task_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const where: any = {};
    if (taskId) where.taskId = taskId;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const timeLogs = await prisma.timeLog.findMany({
      where,
      include: { task: { select: { id: true, title: true } } },
      orderBy: { startTime: 'desc' },
    });
    return NextResponse.json(timeLogs.map((t: any) => ({
      ...t,
      task_id: t.taskId,
      start_time: t.startTime,
      end_time: t.endTime,
      duration_minutes: t.durationMinutes,
      task_title: t.task?.title || null,
    })));
  } catch (error: any) {
    console.error('[API] GET /api/time-logs error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let durationMinutes = body.duration_minutes || null;

    // Auto-calculate duration if end_time provided but duration_minutes is not
    if (body.end_time && body.start_time && !durationMinutes) {
      const start = new Date(body.start_time).getTime();
      const end = new Date(body.end_time).getTime();
      durationMinutes = Math.round((end - start) / 60000);
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        taskId: body.task_id,
        startTime: body.start_time,
        endTime: body.end_time || null,
        durationMinutes,
        notes: body.notes || null,
      },
      include: { task: { select: { id: true, title: true } } },
    });
    return NextResponse.json({
      ...timeLog,
      task_id: timeLog.taskId,
      start_time: timeLog.startTime,
      end_time: timeLog.endTime,
      duration_minutes: timeLog.durationMinutes,
      task_title: timeLog.task?.title || null,
    });
  } catch (error: any) {
    console.error('[API] POST /api/time-logs error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
