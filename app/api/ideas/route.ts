import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    const where: any = {};
    if (status) where.status = status;
    
    const ideas = await prisma.idea.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json(ideas);
  } catch (error: any) {
    console.error('[API] GET /api/ideas error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idea = await prisma.idea.create({
      data: {
        title: body.title,
        description: body.description || null,
        role: body.role || 'Umum',
        category: body.category || 'Random',
        status: body.status || 'Mentah',
      },
    });
    return NextResponse.json(idea);
  } catch (error: any) {
    console.error('[API] POST /api/ideas error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
