import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.learningLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return NextResponse.json(logs);
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
    return NextResponse.json(log);
  } catch (error: any) {
    console.error('[API] POST /api/learning error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
