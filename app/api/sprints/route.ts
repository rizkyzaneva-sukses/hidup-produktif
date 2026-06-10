import { NextRequest, NextResponse } from 'next/server';
import { prisma, parseJson } from '@/lib/prisma';

function sprintToJson(s: any, sprintTasks?: any[]) {
  if (!s) return null;
  // If sprintTasks (FK rows) are provided, use them; else fall back to legacy JSON
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (date) {
      const sprint = await prisma.dailySprint.findUnique({
        where: { date },
        include: {
          sprintTasks: {
            orderBy: { sortOrder: 'asc' },
            include: { task: { select: { id: true, completed: true, workType: true, role: true, priority: true } } },
          },
        },
      });
      if (!sprint) return NextResponse.json(null);
      return NextResponse.json(sprintToJson(sprint, sprint.sprintTasks));
    }

    const sprints = await prisma.dailySprint.findMany({
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        sprintTasks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return NextResponse.json(sprints.map((s: any) => sprintToJson(s, s.sprintTasks)));
  } catch (error: any) {
    console.error('[API] GET /api/sprints error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tasks: Array<{ task_id: string; task_title: string; duration: string }> = body.tasks || [];

    const sprint = await prisma.dailySprint.create({
      data: {
        date: body.date,
        energyLevel: body.energy_level ?? null,
        intention: body.intention ?? null,
        reflection: body.reflection ?? null,
        tasks: '[]', // legacy column — kept empty, source of truth is sprint_tasks
        sprintTasks: {
          create: tasks
            .filter((t) => t.task_id)
            .map((t, i) => ({
              taskId: t.task_id,
              taskTitle: t.task_title,
              duration: t.duration || '1 jam',
              sortOrder: i,
            })),
        },
      },
      include: {
        sprintTasks: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return NextResponse.json(sprintToJson(sprint, sprint.sprintTasks));
  } catch (error: any) {
    console.error('[API] POST /api/sprints error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
