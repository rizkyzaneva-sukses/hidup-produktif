import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const where: any = {};
    if (date) where.date = date;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const moodLogs = await prisma.moodLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { hour: 'desc' }],
    });
    return NextResponse.json(moodLogs.map((m: any) => ({
      ...m,
      energy_level: m.energyLevel,
    })));
  } catch (error: any) {
    console.error('[API] GET /api/mood-logs error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const moodLog = await prisma.moodLog.upsert({
      where: {
        date_hour: { date: body.date, hour: body.hour },
      },
      update: {
        energyLevel: body.energy_level,
        mood: body.mood,
        notes: body.notes || null,
      },
      create: {
        date: body.date,
        hour: body.hour,
        energyLevel: body.energy_level,
        mood: body.mood,
        notes: body.notes || null,
      },
    });
    return NextResponse.json({
      ...moodLog,
      energy_level: moodLog.energyLevel,
    });
  } catch (error: any) {
    console.error('[API] POST /api/mood-logs error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
