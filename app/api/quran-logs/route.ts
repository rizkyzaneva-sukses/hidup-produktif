import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const limit = Number(searchParams.get('limit') || 30);

    const where: any = {};
    if (date) where.date = date;

    const logs = await prisma.quranLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, surah, ayat, halaman, ayat_dibaca, catatan } = body;

    if (!date || !surah || !ayat || !halaman) {
      return NextResponse.json({ error: 'date, surah, ayat, halaman wajib diisi' }, { status: 400 });
    }

    const log = await prisma.quranLog.create({
      data: {
        date,
        surah,
        ayat,
        halaman: Number(halaman),
        ayatDibaca: ayat_dibaca || null,
        catatan: catatan || null,
      },
    });

    return NextResponse.json(log);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
