import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No task IDs provided' }, { status: 400 });
    }

    const result = await prisma.task.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (error: any) {
    console.error('[API] POST /api/tasks/bulk-delete error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
