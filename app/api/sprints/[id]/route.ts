import { NextRequest, NextResponse } from 'next/server';
import { prisma, parseJson } from '@/lib/prisma';

function sprintToJson(s: any, sprintTasks?: any[]) {
  if (!s) return null;
  const tasks = sprintTasks
    ? sprintTasks.map((st: any) => ({
        task_id: st.taskId,
        task_title: st.taskTitle,
        duration: st.duration,
        sort_order: st.sortOrder,
      }))
    : parseJson(s.tasks, []);
  return {
    ...s,
    tasks,
    eod_task_statuses: parseJson(s.eodTaskStatuses, []),
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};

    if (body.energy_level !== undefined) data.energyLevel = body.energy_level;
    if (body.intention !== undefined) data.intention = body.intention;
    if (body.reflection !== undefined) data.reflection = body.reflection;
    if (body.eod_notes !== undefined) data.eodNotes = body.eod_notes;
    if (body.eod_task_statuses !== undefined) data.eodTaskStatuses = JSON.stringify(body.eod_task_statuses);
    if (body.eod_submitted_at !== undefined) data.eodSubmittedAt = body.eod_submitted_at;

    // If tasks array is provided, replace sprint_tasks rows (upsert by sprint+task)
    if (body.tasks !== undefined) {
      const tasks: Array<{ task_id: string; task_title: string; duration: string }> = body.tasks || [];
      const validTasks = tasks.filter((t) => t.task_id);

      // Delete removed tasks
      const incomingIds = validTasks.map((t) => t.task_id);
      await prisma.sprintTask.deleteMany({
        where: { sprintId: id, taskId: { notIn: incomingIds } },
      });

      // Upsert each task
      for (let i = 0; i < validTasks.length; i++) {
        const t = validTasks[i];
        await prisma.sprintTask.upsert({
          where: { sprintId_taskId: { sprintId: id, taskId: t.task_id } },
          create: {
            sprintId: id,
            taskId: t.task_id,
            taskTitle: t.task_title,
            duration: t.duration || '1 jam',
            sortOrder: i,
          },
          update: {
            taskTitle: t.task_title,
            duration: t.duration || '1 jam',
            sortOrder: i,
          },
        });
      }
    }

    const sprint = await prisma.dailySprint.update({
      where: { id },
      data,
      include: {
        sprintTasks: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return NextResponse.json(sprintToJson(sprint, sprint.sprintTasks));
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
