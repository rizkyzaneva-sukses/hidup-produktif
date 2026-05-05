import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dueSoon = searchParams.get('due_soon');

    if (dueSoon) {
      const target = new Date();
      target.setDate(target.getDate() + 7);
      const targetStr = target.toISOString().split('T')[0];
      const subs = await prisma.subscription.findMany({
        where: { status: 'Aktif', tanggalRenewal: targetStr },
      });
      return NextResponse.json(subs);
    }

    const subs = await prisma.subscription.findMany({
      orderBy: { tanggalRenewal: 'asc' },
      take: 200,
    });
    return NextResponse.json(subs);
  } catch (error: any) {
    console.error('[API] GET /api/subscriptions error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sub = await prisma.subscription.create({
      data: {
        nama: body.nama,
        nominal: body.nominal || 0,
        tanggalRenewal: body.tanggal_renewal || null,
        kategori: body.kategori || 'Software',
        status: body.status || 'Aktif',
      },
    });
    return NextResponse.json(sub);
  } catch (error: any) {
    console.error('[API] POST /api/subscriptions error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
