import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function mapLog(log: any) {
  return {
    id: log.id,
    title: log.title,
    type: log.type,
    insight: log.insight,
    duration_minutes: log.durationMinutes,
    log_date: log.logDate,
    finished: log.finished,
    created_at: log.createdAt,
    updated_at: log.updatedAt,
  };
}

export async function GET() {
  try {
    const logs = await prisma.learningLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return NextResponse.json(logs.map(mapLog));
  } catch (error: any) {
    console.error('[API] GET /api/learning error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const log = await prisma.learningLog.create({
      data: {
        title: body.title,
        type: body.type,
        insight: body.insight || null,
        durationMinutes: body.duration_minutes || null,
        logDate: body.log_date || null,
        finished: body.finished || false,
      },
    });
    return NextResponse.json(mapLog(log));
  } catch (error: any) {
    console.error('[API] POST /api/learning error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
