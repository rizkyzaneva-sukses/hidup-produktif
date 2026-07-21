import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.target !== undefined) data.target = body.target;
    if (body.completed !== undefined) data.completed = body.completed;
    if (body.completed_count !== undefined) data.completedCount = body.completed_count;
    if (body.notes !== undefined) data.notes = body.notes || null;

    const goal = await prisma.weeklyGoal.update({
      where: { id },
      data,
    });
    return NextResponse.json({
      ...goal,
      week_start: goal.weekStart,
      completed_count: goal.completedCount,
    });
  } catch (error: any) {
    console.error('[API] PATCH /api/weekly-goals/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.weeklyGoal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/weekly-goals/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
