import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const completed = searchParams.get('completed');
    
    const where: any = {};
    if (role) where.role = role;
    if (completed !== null) where.completed = completed === 'true';
    
    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tasks);
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
      },
    });
    return NextResponse.json(task);
  } catch (error: any) {
    console.error('[API] POST /api/tasks error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
