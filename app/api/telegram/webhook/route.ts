import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TRANSCRIBE_URL = process.env.TRANSCRIBE_URL || 'http://127.0.0.1:7890';

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
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json() as any;
    if (!fileData.ok || !fileData.result?.file_path) return null;
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
    formData.append('file', new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' }), 'voice.ogg');
    const res = await fetch(`${TRANSCRIBE_URL}/transcribe`, { method: 'POST', body: formData });
    const data = await res.json() as any;
    return data.text || null;
  } catch {
    return null;
  }
}

// === SAVE FUNCTIONS ===

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

async function saveTask(title: string, notes?: string | null) {
  return prisma.task.create({
    data: {
      title,
      notes: notes || null,
      role: 'CEO',
      priority: 'Sedang',
      workType: 'Admin',
    },
  });
}

async function saveProject(name: string, description?: string | null) {
  return prisma.project.create({
    data: {
      name,
      description: description || null,
      role: 'CEO',
      status: 'Aktif',
    },
  });
}

async function saveHabit(label: string) {
  return prisma.habit.create({
    data: {
      label,
      emoji: '✨',
      active: true,
    },
  });
}

// === MAIN HANDLER ===

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

    // === VOICE MESSAGE === (always saved as ide)
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
    const lower = text.toLowerCase();

    // --- /start & /help ---
    if (lower === '/start' || lower === '/help') {
      await reply(
        token,
        msg.chat.id,
        `🕌 <b>Hidup Produktif Berkah</b>\n\n` +
          `📌 <b>Commands:</b>\n` +
          `• <code>/task Judul</code> — tambah task\n` +
          `• <code>/task Judul | Catatan</code> — task + catatan\n` +
          `• <code>/project Judul</code> — tambah project\n` +
          `• <code>/project Judul | Deskripsi</code> — project + deskripsi\n` +
          `• <code>/habit Judul</code> — tambah habit\n` +
          `• <code>/ide Judul</code> — tambah ide\n` +
          `• <code>/ide Judul | Deskripsi</code> — ide + deskripsi\n\n` +
          `💡 Ketik langsung tanpa / → otomatis jadi ide\n` +
          `🎙️ Voice note → transkripsi & simpan sebagai ide`,
        messageId
      );
      return NextResponse.json({ ok: true });
    }

    // --- /task Judul | Notes ---
    if (lower.startsWith('/task')) {
      const payload = text.slice(5).trim();
      if (!payload) {
        await reply(token, msg.chat.id, `⚠️ Format: <code>/task Judul</code> atau <code>/task Judul | Catatan</code>`, messageId);
        return NextResponse.json({ ok: true });
      }
      const parts = payload.split('|');
      const title = parts[0].trim();
      const notes = parts[1]?.trim() || null;
      if (!title) {
        await reply(token, msg.chat.id, '⚠️ Judul task tidak boleh kosong.', messageId);
        return NextResponse.json({ ok: true });
      }
      const task = await saveTask(title, notes);
      const notesLine = notes ? `\n📝 ${notes}` : '';
      await reply(
        token,
        msg.chat.id,
        `✅ <b>Task tersimpan!</b>\n\n` +
          `📋 ${task.title}` +
          notesLine +
          `\n\n🏷 Priority: ${task.priority}\n📂 Work Type: ${task.workType}\n\n` +
          `👉 <a href="https://produktifmax.maulanacorp.my.id/tasks">Lihat di Dashboard</a>`,
        messageId
      );
      return NextResponse.json({ ok: true });
    }

    // --- /project Judul | Desc ---
    if (lower.startsWith('/project')) {
      const payload = text.slice(8).trim();
      if (!payload) {
        await reply(token, msg.chat.id, `⚠️ Format: <code>/project Judul</code> atau <code>/project Judul | Deskripsi</code>`, messageId);
        return NextResponse.json({ ok: true });
      }
      const parts = payload.split('|');
      const name = parts[0].trim();
      const desc = parts[1]?.trim() || null;
      if (!name) {
        await reply(token, msg.chat.id, '⚠️ Nama project tidak boleh kosong.', messageId);
        return NextResponse.json({ ok: true });
      }
      const project = await saveProject(name, desc);
      const descLine = desc ? `\n📝 ${desc}` : '';
      await reply(
        token,
        msg.chat.id,
        `✅ <b>Project tersimpan!</b>\n\n` +
          `🚀 ${project.name}` +
          descLine +
          `\n\n🏷 Status: ${project.status}\n\n` +
          `👉 <a href="https://produktifmax.maulanacorp.my.id/projects">Lihat di Dashboard</a>`,
        messageId
      );
      return NextResponse.json({ ok: true });
    }

    // --- /habit Judul ---
    if (lower.startsWith('/habit')) {
      const payload = text.slice(6).trim();
      if (!payload) {
        await reply(token, msg.chat.id, `⚠️ Format: <code>/habit Judul habit</code>`, messageId);
        return NextResponse.json({ ok: true });
      }
      const label = payload;
      const habit = await saveHabit(label);
      await reply(
        token,
        msg.chat.id,
        `✅ <b>Habit tersimpan!</b>\n\n` +
          `✨ ${habit.label}\n\n` +
          `👉 <a href="https://produktifmax.maulanacorp.my.id/habits">Lihat di Dashboard</a>`,
        messageId
      );
      return NextResponse.json({ ok: true });
    }

    // --- /ide Judul | Desc ---
    if (lower.startsWith('/ide')) {
      const payload = text.slice(4).trim();
      if (!payload) {
        await reply(token, msg.chat.id, `⚠️ Format: <code>/ide Judul</code> atau <code>/ide Judul | Deskripsi</code>`, messageId);
        return NextResponse.json({ ok: true });
      }
      const parts = payload.split('|');
      const title = parts[0].trim();
      const description = parts[1]?.trim() || null;
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
    }

    // --- Plain text → Ide (default) ---
    const idea = await saveIdea(text);
    await reply(
      token,
      msg.chat.id,
      `✅ <b>Ide tersimpan!</b>\n\n` +
        `💡 ${idea.title}` +
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
