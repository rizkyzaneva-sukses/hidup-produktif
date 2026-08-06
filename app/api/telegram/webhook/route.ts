import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TRANSCRIBE_URL = process.env.TRANSCRIBE_URL || 'http://host.docker.internal:7890';

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

// Download file from Telegram
async function downloadTelegramFile(token: string, fileId: string): Promise<Buffer | null> {
  try {
    // Get file info
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json() as any;
    if (!fileData.ok || !fileData.result?.file_path) return null;

    // Download file
    const url = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch {
    return null;
  }
}

// Transcribe audio via local whisper.cpp
async function transcribeAudio(audioBuffer: Buffer): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg');

    const res = await fetch(`${TRANSCRIBE_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json() as any;
    return data.text || null;
  } catch {
    return null;
  }
}

// Save idea to database
async function saveIdea(title: string, description?: string | null) {
  return prisma.idea.create({
    data: {
      title,
      description: description || null,
      role: 'Umum',
      category: 'Telegram',
      status: 'Mentah',
    },
  });
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
    if (!msg) return NextResponse.json({ ok: true });

    const chatId = String(msg.chat.id);
    const messageId = msg.message_id;

    // Only process from allowed chat IDs
    const allowed = await getAllowedChatIds();
    if (allowed.length > 0 && !allowed.includes(chatId)) {
      await reply(token, msg.chat.id, '⛔ Anda tidak memiliki akses ke bot ini.', messageId);
      return NextResponse.json({ ok: true });
    }

    // === VOICE MESSAGE ===
    if (msg.voice) {
      await reply(token, msg.chat.id, '🎙️ Memproses voice note...', messageId);

      const audioBuffer = await downloadTelegramFile(token, msg.voice.file_id);
      if (!audioBuffer) {
        await reply(token, msg.chat.id, '❌ Gagal mengunduh audio.', messageId);
        return NextResponse.json({ ok: true });
      }

      const text = await transcribeAudio(audioBuffer);
      if (!text) {
        await reply(token, msg.chat.id, '❌ Gagal mentranskripsi audio. Coba ulang.', messageId);
        return NextResponse.json({ ok: true });
      }

      const idea = await saveIdea(text);
      await reply(
        token,
        msg.chat.id,
        `✅ <b>Voice note tersimpan sebagai ide!</b>\n\n` +
          `🎙️ <i>"${text}"</i>\n\n` +
          `📂 Kategori: Telegram\n🏷 Status: Mentah\n\n` +
          `👉 <a href="https://produktifmax.maulanacorp.my.id/ideas">Lihat di Dashboard</a>`,
        messageId
      );
      return NextResponse.json({ ok: true });
    }

    // === TEXT MESSAGE ===
    if (!msg.text) return NextResponse.json({ ok: true });

    const text: string = msg.text.trim();

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
          `• Ketik langsung — otomatis jadi ide\n` +
          `• 🎙️ Voice note — otomatis transkripsi & simpan\n\n` +
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
      title = text;
    }

    if (!title) {
      await reply(token, msg.chat.id, '⚠️ Judul ide tidak boleh kosong.', messageId);
      return NextResponse.json({ ok: true });
    }

    const idea = await saveIdea(title, description);
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
