import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function mapSub(s: any) {
  return {
    id: s.id,
    nama: s.nama,
    nominal: s.nominal,
    tanggal_renewal: s.tanggalRenewal,
    kategori: s.kategori,
    status: s.status,
    archived: s.archived,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dueSoon = searchParams.get('due_soon');
    const showArchived = searchParams.get('archived') === 'true';

    if (dueSoon) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(today);
      target.setDate(target.getDate() + 7);
      const todayStr = today.toISOString().split('T')[0];
      const targetStr = target.toISOString().split('T')[0];
      const subs = await prisma.subscription.findMany({
        where: { status: 'Aktif', archived: false, AND: [{ tanggalRenewal: { gte: todayStr } }, { tanggalRenewal: { lte: targetStr } }] },
      });
      return NextResponse.json(subs.map(mapSub));
    }

    const subs = await prisma.subscription.findMany({
      where: showArchived ? { archived: true } : { archived: false },
      orderBy: { tanggalRenewal: 'asc' },
      take: 200,
    });
    return NextResponse.json(subs.map(mapSub));
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
        archived: false,
      },
    });
    return NextResponse.json(mapSub(sub));
  } catch (error: any) {
    console.error('[API] POST /api/subscriptions error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
