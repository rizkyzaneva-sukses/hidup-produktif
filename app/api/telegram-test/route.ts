import { NextResponse } from 'next/server';
import { sendTelegram } from '@/lib/telegram';
import { runDailyNotifications } from '@/lib/cron';

// POST: test koneksi Telegram
export async function POST() {
  const result = await sendTelegram('✅ <b>Hidup Produktif Berkah</b>\n\nTelegram bot berhasil terhubung! 🎉');
  return NextResponse.json(result);
}

// GET: jalankan notifikasi manual (sudah dilindungi middleware)
export async function GET() {
  const messages = await runDailyNotifications();
  return NextResponse.json({ ok: true, messages });
}
