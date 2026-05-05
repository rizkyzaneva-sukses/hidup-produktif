import { NextRequest, NextResponse } from 'next/server';
import { prisma, parseJson } from '@/lib/prisma';

function sprintToJson(s: any) {
  if (!s) return null;
  return { ...s, tasks: parseJson(s.tasks, []), eod_task_statuses: parseJson(s.eodTaskStatuses, []) };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};

    if (body.energy_level !== undefined) data.energyLevel = body.energy_level;
    if (body.intention !== undefined) data.intention = body.intention;
    if (body.reflection !== undefined) data.reflection = body.reflection;
    if (body.tasks !== undefined) data.tasks = JSON.stringify(body.tasks);
    if (body.eod_notes !== undefined) data.eodNotes = body.eod_notes;
    if (body.eod_task_statuses !== undefined) data.eodTaskStatuses = JSON.stringify(body.eod_task_statuses);
    if (body.eod_submitted_at !== undefined) data.eodSubmittedAt = body.eod_submitted_at;

    const sprint = await prisma.dailySprint.update({
      where: { id },
      data,
    });
    return NextResponse.json(sprintToJson(sprint));
  } catch (error: any) {
    console.error('[API] PATCH /api/sprints/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.dailySprint.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/sprints/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
