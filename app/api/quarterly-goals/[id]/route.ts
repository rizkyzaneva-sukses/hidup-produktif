import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.role !== undefined) data.role = body.role;
    if (body.key_results !== undefined) data.keyResults = body.key_results;
    if (body.notes !== undefined) data.notes = body.notes || null;

    const goal = await prisma.quarterlyGoal.update({
      where: { id },
      data,
    });
    return NextResponse.json({
      ...goal,
      key_results: goal.keyResults,
      created_at: goal.createdAt,
    });
  } catch (error: any) {
    console.error('[API] PATCH /api/quarterly-goals/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.quarterlyGoal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/quarterly-goals/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
