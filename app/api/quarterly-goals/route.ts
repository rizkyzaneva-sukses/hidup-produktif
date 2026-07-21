import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quarter = searchParams.get('quarter');
    const year = searchParams.get('year');

    const where: any = {};
    if (quarter) where.quarter = parseInt(quarter);
    if (year) where.year = parseInt(year);

    const goals = await prisma.quarterlyGoal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(goals.map((g: any) => ({
      ...g,
      key_results: g.keyResults,
      created_at: g.createdAt,
    })));
  } catch (error: any) {
    console.error('[API] GET /api/quarterly-goals error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const goal = await prisma.quarterlyGoal.create({
      data: {
        quarter: parseInt(body.quarter),
        year: parseInt(body.year),
        role: body.role,
        title: body.title,
        keyResults: body.key_results || '[]',
      },
    });
    return NextResponse.json({
      ...goal,
      key_results: goal.keyResults,
      created_at: goal.createdAt,
    });
  } catch (error: any) {
    console.error('[API] POST /api/quarterly-goals error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
