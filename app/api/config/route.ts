import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Hanya key ini yang boleh diubah via API
const ALLOWED_KEYS = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'NOTIFICATION_TIME'];

export async function GET() {
  try {
    const configs = await prisma.appConfig.findMany();
    const config: Record<string, string> = {};
    for (const row of configs) config[row.key] = row.value || '';
    // Mask token for display
    if (config.TELEGRAM_BOT_TOKEN) {
      config.TELEGRAM_BOT_TOKEN_SET = 'true';
      delete config.TELEGRAM_BOT_TOKEN;
    }
    return NextResponse.json(config);
  } catch (error: unknown) {
    console.error('[API] GET /api/config error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validasi: hanya izinkan key yang di-whitelist
    const entries = Object.entries(body).filter(([key]) => ALLOWED_KEYS.includes(key));

    if (entries.length === 0) {
      return NextResponse.json({ error: 'Tidak ada config valid yang dikirim' }, { status: 400 });
    }

    for (const [key, value] of entries) {
      await prisma.appConfig.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[API] POST /api/config error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
