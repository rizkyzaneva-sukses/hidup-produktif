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
    category_id: log.categoryId,
    category: log.category ? { id: log.category.id, name: log.category.name, emoji: log.category.emoji } : null,
    created_at: log.createdAt,
    updated_at: log.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const categoryId = searchParams.get('category_id');
    const type = searchParams.get('type');

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { insight: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type;
    }

    const logs = await prisma.learningLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { category: true },
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
        categoryId: body.category_id || null,
      },
      include: { category: true },
    });
    return NextResponse.json(mapLog(log));
  } catch (error: any) {
    console.error('[API] POST /api/learning error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
