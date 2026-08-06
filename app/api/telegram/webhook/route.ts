import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Reply to a Telegram message
async function reply(token: string, chatId: number, text: string, replyTo?: number) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(replyTo ? { reply_to_message_id: replyTo } : {}),
    }),
  });
}

// Get bot token from env or database
async function getToken(): Promise<string | null> {
  let token = process.env.TELEGRAM_BOT_TOKEN;
  if (token) return token;
  try {
    const row = await prisma.appConfig.findUnique({ where: { key: 'TELEGRAM_BOT_TOKEN' } });
    return row?.value || null;
  } catch {
    return null;
  }
}

// Get allowed chat IDs (comma-separated)
async function getAllowedChatIds(): Promise<string[]> {
  let chatId = process.env.TELEGRAM_CHAT_ID;
  if (chatId) return chatId.split(',').map((s) => s.trim());
  try {
    const row = await prisma.appConfig.findUnique({ where: { key: 'TELEGRAM_CHAT_ID' } });
    return row?.value ? row.value.split(',').map((s) => s.trim()) : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken();
    if (!token) {
      console.error('[Telegram Webhook] No bot token configured');
      return NextResponse.json({ ok: true });
    }

    const body = await req.json();
    const msg = body.message;
    if (!msg || !msg.text) return NextResponse.json({ ok: true });

    const chatId = String(msg.chat.id);
    const text: string = msg.text.trim();
    const messageId = msg.message_id;

    // Only process from allowed chat IDs
    const allowed = await getAllowedChatIds();
    if (allowed.length > 0 && !allowed.includes(chatId)) {
      await reply(token, msg.chat.id, '⛔ Anda tidak memiliki akses ke bot ini.', messageId);
      return NextResponse.json({ ok: true });
    }

    // Handle /start and /help
    if (text === '/start' || text === '/help') {
      await reply(
        token,
        msg.chat.id,
        `🕌 <b>Hidup Produktif Berkah</b>\n\n` +
          `Kirim ide kapan saja!\n\n` +
          `📌 <b>Cara pakai:</b>\n` +
          `• <code>/ide Judul ide</code>\n` +
          `• <code>/ide Judul | Deskripsi</code>\n` +
          `• Atau ketik langsung — otomatis jadi ide\n\n` +
          `💡 Ide akan tersimpan di dashboard Anda.`,
        messageId
      );
      return NextResponse.json({ ok: true });
    }

    // Parse: /ide Title | Description  OR  /ide Title  OR  plain text
    let title: string;
    let description: string | null = null;

    if (text.toLowerCase().startsWith('/ide')) {
      const payload = text.slice(4).trim();
      if (!payload) {
        await reply(
          token,
          msg.chat.id,
          `⚠️ Format: <code>/ide Judul ide</code> atau <code>/ide Judul | Deskripsi</code>`,
          messageId
        );
        return NextResponse.json({ ok: true });
      }
      const parts = payload.split('|');
      title = parts[0].trim();
      description = parts[1]?.trim() || null;
    } else {
      // Plain text → save as idea
      title = text;
    }

    if (!title) {
      await reply(token, msg.chat.id, '⚠️ Judul ide tidak boleh kosong.', messageId);
      return NextResponse.json({ ok: true });
    }

    // Save to database
    const idea = await prisma.idea.create({
      data: {
        title,
        description,
        role: 'Umum',
        category: 'Telegram',
        status: 'Mentah',
      },
    });

    const descLine = description ? `\n📝 ${description}` : '';
    await reply(
      token,
      msg.chat.id,
      `✅ <b>Ide tersimpan!</b>\n\n` +
        `💡 ${idea.title}` +
        descLine +
        `\n\n📂 Kategori: Telegram\n🏷 Status: Mentah\n\n` +
        `👉 <a href="https://produktifmax.maulanacorp.my.id/ideas">Lihat di Dashboard</a>`,
      messageId
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram Webhook] Error:', error?.message);
    return NextResponse.json({ ok: true });
  }
}
