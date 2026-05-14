import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.learningCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { logs: true } } },
    });
    return NextResponse.json(categories.map(c => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      log_count: c._count.logs,
      created_at: c.createdAt,
    })));
  } catch (error: any) {
    console.error('[API] GET /api/learning-categories error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const category = await prisma.learningCategory.create({
      data: {
        name: body.name.trim(),
        emoji: body.emoji || '📂',
      },
    });
    return NextResponse.json({
      id: category.id,
      name: category.name,
      emoji: category.emoji,
      log_count: 0,
      created_at: category.createdAt,
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    console.error('[API] POST /api/learning-categories error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
