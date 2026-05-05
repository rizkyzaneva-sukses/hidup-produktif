import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get('week_start');
    if (weekStart) {
      const review = await prisma.weeklyReview.findUnique({ where: { weekStart } });
      return NextResponse.json(review || null);
    }
    const reviews = await prisma.weeklyReview.findMany({
      orderBy: { weekStart: 'desc' },
      take: 52,
    });
    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('[API] GET /api/weekly-review error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const review = await prisma.weeklyReview.upsert({
      where: { weekStart: body.week_start },
      update: { reflectionNotes: body.reflection_notes },
      create: {
        weekStart: body.week_start,
        reflectionNotes: body.reflection_notes || null,
      },
    });
    return NextResponse.json(review);
  } catch (error: any) {
    console.error('[API] POST /api/weekly-review error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
