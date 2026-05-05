import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.shoppingItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('[API] GET /api/shopping error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await prisma.shoppingItem.create({
      data: {
        name: body.name,
        role: body.role || 'Suami',
        archived: false,
      },
    });
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('[API] POST /api/shopping error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
