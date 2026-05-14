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
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.due_date !== undefined) data.dueDate = body.due_date || null;
    if (body.project_id !== undefined) data.projectId = body.project_id || null;
    
    const task = await prisma.task.update({
      where: { id },
      data,
      include: { project: { select: { id: true, name: true } } },
    });
    return NextResponse.json({
      ...task,
      work_type: task.workType,
      due_date: task.dueDate,
      project_id: task.projectId,
      project_name: task.project?.name || null,
    });
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
