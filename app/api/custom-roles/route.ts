import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const roles = await prisma.customRole.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('[API] GET /api/custom-roles error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = await prisma.customRole.create({
      data: {
        name: body.name,
        emoji: body.emoji || '⭐',
        hue: body.hue || 239,
      },
    });
    return NextResponse.json(role);
  } catch (error: any) {
    console.error('[API] POST /api/custom-roles error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
