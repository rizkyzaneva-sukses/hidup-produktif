import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  } catch (error: any) {
    console.error('[API] GET /api/config error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await prisma.appConfig.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] POST /api/config error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
