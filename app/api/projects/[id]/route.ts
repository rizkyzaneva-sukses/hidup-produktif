import { NextRequest, NextResponse } from 'next/server';
import { prisma, parseJson } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.role !== undefined) data.role = body.role;
    if (body.deadline !== undefined) data.deadline = body.deadline;
    if (body.status !== undefined) data.status = body.status;
    if (body.subtasks !== undefined) data.subtasks = JSON.stringify(body.subtasks);
    
    const project = await prisma.project.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ...project, subtasks: parseJson(project.subtasks, []) });
  } catch (error: any) {
    console.error('[API] PATCH /api/projects/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/projects/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
