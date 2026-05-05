import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.role !== undefined) data.role = body.role;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.work_type !== undefined) data.workType = body.work_type;
    if (body.completed !== undefined) data.completed = body.completed;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.due_date !== undefined) data.dueDate = body.due_date;
    
    const task = await prisma.task.update({
      where: { id },
      data,
    });
    return NextResponse.json(task);
  } catch (error: any) {
    console.error('[API] PATCH /api/tasks/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/tasks/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
