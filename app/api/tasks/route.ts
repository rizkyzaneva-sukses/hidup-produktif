import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const completed = searchParams.get('completed');
    const projectId = searchParams.get('project_id');
    
    const where: any = {};
    if (role) where.role = role;
    if (completed !== null) where.completed = completed === 'true';
    if (projectId) where.projectId = projectId;
    
    const tasks = await prisma.task.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tasks.map((t: any) => ({
      ...t,
      work_type: t.workType,
      due_date: t.dueDate,
      project_id: t.projectId,
      project_name: t.project?.name || null,
    })));
  } catch (error: any) {
    console.error('[API] GET /api/tasks error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = await prisma.task.create({
      data: {
        title: body.title,
        role: body.role || 'CEO',
        priority: body.priority || 'Sedang',
        workType: body.work_type || 'Admin',
        completed: false,
        notes: body.notes || null,
        dueDate: body.due_date || null,
        projectId: body.project_id || null,
      },
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
    console.error('[API] POST /api/tasks error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
