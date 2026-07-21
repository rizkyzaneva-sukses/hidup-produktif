import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const templates = await prisma.taskTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(templates.map((t: any) => ({
      ...t,
      created_at: t.createdAt,
    })));
  } catch (error: any) {
    console.error('[API] GET /api/task-templates error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const template = await prisma.taskTemplate.create({
      data: {
        name: body.name,
        role: body.role || 'CEO',
        emoji: body.emoji || '📋',
        tasks: body.tasks || '[]',
      },
    });
    return NextResponse.json({
      ...template,
      created_at: template.createdAt,
    });
  } catch (error: any) {
    console.error('[API] POST /api/task-templates error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
