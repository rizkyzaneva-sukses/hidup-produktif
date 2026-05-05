import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.label !== undefined) data.label = body.label;
    if (body.emoji !== undefined) data.emoji = body.emoji;
    if (body.active !== undefined) data.active = body.active;
    if (body.sort_order !== undefined) data.sortOrder = body.sort_order;
    
    const habit = await prisma.habit.update({
      where: { id },
      data,
    });
    return NextResponse.json(habit);
  } catch (error: any) {
    console.error('[API] PATCH /api/habits/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const h = await prisma.habit.findUnique({ where: { id } });
    if (h?.pinned) return NextResponse.json({ error: 'Habit ini tidak bisa dihapus.' }, { status: 400 });
    
    // Delete related logs first, then the habit (cascade should handle this via schema)
    await prisma.habitLog.deleteMany({ where: { habitId: id } });
    await prisma.habit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/habits/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
