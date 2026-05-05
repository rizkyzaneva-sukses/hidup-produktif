import { prisma } from './prisma';
import { sendTelegram, formatRupiah } from './telegram';

let cronStarted = false;

export function startCron() {
  if (cronStarted) return;
  cronStarted = true;

  // Only run in server environment
  if (typeof window !== 'undefined') return;

  try {
    const cron = require('node-cron');

    // Run every day at 07:00 WIB (UTC+7 = 00:00 UTC)
    cron.schedule('0 0 * * *', async () => {
      await runDailyNotifications();
    }, { timezone: 'Asia/Jakarta' });

    console.log('[Cron] Daily notification job scheduled at 07:00 WIB');
  } catch (e) {
    console.error('[Cron] Failed to start:', e);
  }
}

export async function runDailyNotifications(): Promise<string[]> {
  const messages: string[] = [];
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);
  const dayOfWeek = todayDate.getDay().toString();
  const dayOfMonth = today.split('-')[2];

  // 1. Reminders due today
  const allActiveReminders = await prisma.reminder.findMany({
    where: { active: true },
  });

  const reminders = allActiveReminders.filter((r) => {
    if (r.frequency === 'Sekali' && r.date === today) return true;
    if (r.frequency === 'Harian') return true;
    if (r.frequency === 'Mingguan' && r.date) {
      return new Date(r.date).getDay().toString() === dayOfWeek;
    }
    if (r.frequency === 'Bulanan' && r.date) {
      return r.date.split('-')[2] === dayOfMonth;
    }
    return false;
  });

  for (const r of reminders) {
    const msg = `🔔 <b>Reminder</b>: ${r.title}\n📌 Role: ${r.role}\n🗓 ${today}`;
    const result = await sendTelegram(msg);
    messages.push(result.ok ? `✅ Reminder sent: ${r.title}` : `❌ Failed: ${r.title} — ${result.error}`);
  }

  // 2. Subscriptions due in 7 days
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const target = targetDate.toISOString().split('T')[0];

  const subs = await prisma.subscription.findMany({
    where: { status: 'Aktif', tanggalRenewal: target },
  });

  for (const s of subs) {
    const msg = `⚠️ <b>Subscription Renewal</b> dalam 7 hari!\n📦 ${s.nama}\n💰 ${formatRupiah(s.nominal)}/bln\n🗓 Renewal: ${s.tanggalRenewal}\n\nJangan lupa cancel jika tidak perlu lagi.`;
    const result = await sendTelegram(msg);
    messages.push(result.ok ? `✅ Sub sent: ${s.nama}` : `❌ Failed: ${s.nama} — ${result.error}`);
  }

  return messages;
}
