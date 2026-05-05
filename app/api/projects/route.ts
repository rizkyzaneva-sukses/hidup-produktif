import { NextRequest, NextResponse } from 'next/server';
import { prisma, parseJson } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    
    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(projects.map((p: any) => ({ ...p, subtasks: parseJson(p.subtasks, []) })));
  } catch (error: any) {
    console.error('[API] GET /api/projects error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        role: body.role || 'CEO',
        deadline: body.deadline || null,
        status: body.status || 'Aktif',
        subtasks: JSON.stringify(body.subtasks || []),
        ideaId: body.idea_id || null,
      },
    });
    return NextResponse.json({ ...project, subtasks: parseJson(project.subtasks, []) });
  } catch (error: any) {
    console.error('[API] POST /api/projects error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
