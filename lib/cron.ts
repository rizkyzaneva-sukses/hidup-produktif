import { prisma } from './prisma';
import { sendTelegram, formatRupiah } from './telegram';

let cronStarted = false;
let lastRunDate = '';
let lastPrayerRunDate = '';

export function startCron() {
  if (cronStarted) return;
  cronStarted = true;

  // Only run in server environment
  if (typeof window !== 'undefined') return;

  try {
    const cron = require('node-cron');

    // Check every minute if it's time to send notifications
    cron.schedule('* * * * *', async () => {
      try {
        await checkAndRunNotifications();
        await checkAndFetchPrayerTimes();
      } catch (e) {
        console.error('[Cron] Error in cron check:', e);
      }
    });

    console.log('[Cron] Notification scheduler started (checks every minute)');
  } catch (e) {
    console.error('[Cron] Failed to start:', e);
  }
}

async function getNotificationTime(): Promise<string> {
  try {
    const config = await prisma.appConfig.findUnique({ where: { key: 'NOTIFICATION_TIME' } });
    return config?.value || '07:00';
  } catch {
    return '07:00';
  }
}

async function checkAndRunNotifications() {
  const now = new Date();
  // Convert to WIB (UTC+7)
  const wibOffset = 7 * 60; // minutes
  const wibTime = new Date(now.getTime() + (wibOffset + now.getTimezoneOffset()) * 60000);
  const currentHour = wibTime.getHours().toString().padStart(2, '0');
  const currentMinute = wibTime.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  const currentDate = wibTime.toISOString().split('T')[0];

  // Get configured notification time
  const notifTime = await getNotificationTime();

  // Only run once per day at the configured time
  if (currentTime === notifTime && lastRunDate !== currentDate) {
    lastRunDate = currentDate;
    console.log(`[Cron] Running daily notifications at ${currentTime} WIB`);
    await runDailyNotifications();
  }
}

export async function runDailyNotifications(): Promise<string[]> {
  const messages: string[] = [];
  
  // Get current date in WIB
  const now = new Date();
  const wibOffset = 7 * 60;
  const wibTime = new Date(now.getTime() + (wibOffset + now.getTimezoneOffset()) * 60000);
  const today = wibTime.toISOString().split('T')[0];
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

  // 2. Subscriptions due in 7, 3, or 1 days
  const subAlerts = [
    { days: 7, emoji: '⚠️', label: '7 hari lagi' },
    { days: 3, emoji: '🔴', label: '3 hari lagi' },
    { days: 1, emoji: '🚨', label: 'BESOK' },
  ];

  for (const alert of subAlerts) {
    const targetDate = new Date(wibTime);
    targetDate.setDate(targetDate.getDate() + alert.days);
    const target = targetDate.toISOString().split('T')[0];

    const subs = await prisma.subscription.findMany({
      where: { status: 'Aktif', tanggalRenewal: target },
    });

    for (const s of subs) {
      const msg = `${alert.emoji} <b>Subscription Renewal — ${alert.label}!</b>\n\n📦 ${s.nama}\n🏷 Kategori: ${s.kategori}\n💰 ${formatRupiah(s.nominal)}/bln\n🗓 Renewal: ${s.tanggalRenewal}\n\n${alert.days === 1 ? '⚡ Renewal besok! Segera siapkan.' : 'Jangan lupa cancel jika tidak perlu lagi.'}`;
      const result = await sendTelegram(msg);
      messages.push(result.ok ? `✅ Sub alert H-${alert.days} sent: ${s.nama}` : `❌ Failed H-${alert.days}: ${s.nama} — ${result.error}`);
    }
  }

  return messages;
}

// ── Prayer Times Auto-Fetch ──────────────────────────────────────────────────
const LAT = -6.8896;
const LNG = 107.5448;
const METHOD = 11; // Kemenag RI

async function checkAndFetchPrayerTimes() {
  try {
    const now = new Date();
    const wibOffset = 7 * 60;
    const wibTime = new Date(now.getTime() + (wibOffset + now.getTimezoneOffset()) * 60000);
    const currentHour = wibTime.getHours().toString().padStart(2, '0');
    const currentMinute = wibTime.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;
    const currentDate = wibTime.toISOString().split('T')[0];

    // Fetch at 00:00 WIB once per day
    if (currentTime === '00:00' && lastPrayerRunDate !== currentDate) {
      lastPrayerRunDate = currentDate;
      console.log(`[Cron] Fetching prayer times for ${currentDate}`);

      const dateRow = await prisma.appConfig.findUnique({ where: { key: 'PRAYER_TIMES_DATE' } });
      if (dateRow?.value === currentDate) return; // already cached

      const url = `https://api.aladhan.com/v1/timings/${currentDate}?latitude=${LAT}&longitude=${LNG}&method=${METHOD}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Aladhan API error: ${res.status}`);

      const json = await res.json();
      const t = json.data.timings;

      const times = {
        Subuh: t.Fajr.substring(0, 5),
        Terbit: t.Sunrise.substring(0, 5),
        Zuhur: t.Dhuhr.substring(0, 5),
        Asar: t.Asr.substring(0, 5),
        Magrib: t.Maghrib.substring(0, 5),
        Isya: t.Isha.substring(0, 5),
      };

      await prisma.appConfig.upsert({
        where: { key: 'PRAYER_TIMES_DATE' },
        update: { value: currentDate },
        create: { key: 'PRAYER_TIMES_DATE', value: currentDate },
      });
      await prisma.appConfig.upsert({
        where: { key: 'PRAYER_TIMES_DATA' },
        update: { value: JSON.stringify(times) },
        create: { key: 'PRAYER_TIMES_DATA', value: JSON.stringify(times) },
      });

      console.log(`[Cron] Prayer times cached:`, times);
    }
  } catch (e) {
    console.error('[Cron] Prayer times fetch error:', e);
  }
}
