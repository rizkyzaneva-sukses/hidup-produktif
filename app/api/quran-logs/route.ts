import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function toJson(log: any) {
  return {
    id: log.id,
    date: log.date,
    dari_halaman: log.dariHalaman,
    ke_halaman: log.keHalaman,
    halaman_dibaca: log.keHalaman - log.dariHalaman,
    catatan: log.catatan,
    created_at: log.createdAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const limit = Number(searchParams.get('limit') || 50);

    const where: any = {};
    if (date) where.date = date;

    const logs = await prisma.quranLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(limit, 200),
    });

    return NextResponse.json(logs.map(toJson));
  } catch (error: any) {
    console.error('[API] GET /api/quran-logs error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const date = body.date;
    const dari = Number(body.dari_halaman);
    const ke = Number(body.ke_halaman);
    const catatan = body.catatan || null;

    if (!date || !Number.isFinite(dari) || !Number.isFinite(ke)) {
      return NextResponse.json({ error: 'date, dari_halaman, ke_halaman wajib diisi' }, { status: 400 });
    }
    if (dari < 1 || ke > 604 || ke <= dari) {
      return NextResponse.json({ error: 'Halaman tidak valid (1–604, ke harus > dari)' }, { status: 400 });
    }

    const log = await prisma.quranLog.create({
      data: {
        date,
        dariHalaman: dari,
        keHalaman: ke,
        catatan,
      },
    });

    return NextResponse.json(toJson(log));
  } catch (error: any) {
    console.error('[API] POST /api/quran-logs error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
