import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.role !== undefined) data.role = body.role;
    if (body.emoji !== undefined) data.emoji = body.emoji;
    if (body.tasks !== undefined) data.tasks = body.tasks;

    const template = await prisma.taskTemplate.update({
      where: { id },
      data,
    });
    return NextResponse.json({
      ...template,
      created_at: template.createdAt,
    });
  } catch (error: any) {
    console.error('[API] PATCH /api/task-templates/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.taskTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/task-templates/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
