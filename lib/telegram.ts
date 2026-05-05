import { prisma } from './prisma';

export async function sendTelegram(message: string): Promise<{ ok: boolean; error?: string }> {
  // Try environment variables first, then fall back to database config
  let token = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    try {
      const tokenRow = await prisma.appConfig.findUnique({ where: { key: 'TELEGRAM_BOT_TOKEN' } });
      const chatIdRow = await prisma.appConfig.findUnique({ where: { key: 'TELEGRAM_CHAT_ID' } });
      token = tokenRow?.value || undefined;
      chatId = chatIdRow?.value || undefined;
    } catch {
      // Database might not be ready
    }
  }

  if (!token || !chatId) {
    return { ok: false, error: 'Telegram bot token atau chat ID belum dikonfigurasi.' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
    const data = await res.json() as any;
    if (!data.ok) return { ok: false, error: data.description };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function formatRupiah(nominal: number): string {
  return 'Rp ' + nominal.toLocaleString('id-ID');
}
