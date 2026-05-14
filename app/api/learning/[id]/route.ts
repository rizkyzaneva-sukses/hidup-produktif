import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function mapLog(log: any) {
  return {
    id: log.id,
    title: log.title,
    type: log.type,
    insight: log.insight,
    duration_minutes: log.durationMinutes,
    log_date: log.logDate,
    finished: log.finished,
    category_id: log.categoryId,
    category: log.category ? { id: log.category.id, name: log.category.name, emoji: log.category.emoji } : null,
    created_at: log.createdAt,
    updated_at: log.updatedAt,
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.type !== undefined) data.type = body.type;
    if (body.insight !== undefined) data.insight = body.insight;
    if (body.duration_minutes !== undefined) data.durationMinutes = body.duration_minutes;
    if (body.log_date !== undefined) data.logDate = body.log_date;
    if (body.finished !== undefined) data.finished = body.finished;
    if (body.category_id !== undefined) data.categoryId = body.category_id;
    
    const log = await prisma.learningLog.update({
      where: { id },
      data,
      include: { category: true },
    });
    return NextResponse.json(mapLog(log));
  } catch (error: any) {
    console.error('[API] PATCH /api/learning/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.learningLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/learning/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
