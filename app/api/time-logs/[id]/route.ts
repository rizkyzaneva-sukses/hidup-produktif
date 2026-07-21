import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.task_id !== undefined) data.taskId = body.task_id;
    if (body.start_time !== undefined) data.startTime = body.start_time;
    if (body.end_time !== undefined) data.endTime = body.end_time;
    if (body.duration_minutes !== undefined) data.durationMinutes = body.duration_minutes;
    if (body.notes !== undefined) data.notes = body.notes || null;

    const timeLog = await prisma.timeLog.update({
      where: { id },
      data,
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
    console.error('[API] PATCH /api/time-logs/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.timeLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/time-logs/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
