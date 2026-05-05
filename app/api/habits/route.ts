import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_HABITS } from '@/lib/constants';

export async function GET() {
  try {
    const habits = await prisma.habit.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(habits);
  } catch (error: any) {
    console.error('[API] GET /api/habits error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Seed default habits if requested
    if (body.seed) {
      const count = await prisma.habit.count();
      if (count === 0) {
        for (const h of DEFAULT_HABITS) {
          await prisma.habit.create({
            data: {
              label: h.label,
              emoji: h.emoji,
              active: true,
              pinned: h.pinned,
              sortOrder: h.sort_order,
            },
          });
        }
      }
      return NextResponse.json({ ok: true });
    }
    
    const maxOrder = await prisma.habit.aggregate({ _max: { sortOrder: true } });
    const habit = await prisma.habit.create({
      data: {
        label: body.label,
        emoji: body.emoji || '✅',
        active: true,
        pinned: false,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });
    return NextResponse.json(habit);
  } catch (error: any) {
    console.error('[API] POST /api/habits error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
