import { NextRequest, NextResponse } from 'next/server';
import { prisma, parseJson } from '@/lib/prisma';

function sprintToJson(s: any) {
  if (!s) return null;
  return { ...s, tasks: parseJson(s.tasks, []), eod_task_statuses: parseJson(s.eodTaskStatuses, []) };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    
    if (date) {
      const sprint = await prisma.dailySprint.findUnique({ where: { date } });
      return NextResponse.json(sprintToJson(sprint));
    }
    
    const sprints = await prisma.dailySprint.findMany({
      orderBy: { date: 'desc' },
      take: 100,
    });
    return NextResponse.json(sprints.map(sprintToJson));
  } catch (error: any) {
    console.error('[API] GET /api/sprints error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sprint = await prisma.dailySprint.create({
      data: {
        date: body.date,
        energyLevel: body.energy_level || null,
        intention: body.intention || null,
        reflection: body.reflection || null,
        tasks: JSON.stringify(body.tasks || []),
      },
    });
    return NextResponse.json(sprintToJson(sprint));
  } catch (error: any) {
    console.error('[API] POST /api/sprints error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
