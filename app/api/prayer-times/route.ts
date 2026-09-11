import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cimahi coordinates
const LAT = -6.8896;
const LNG = 107.5448;
const METHOD = 11; // Kemenag RI

interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export async function GET() {
  try {
    // Check cache in AppConfig
    const dateRow = await prisma.appConfig.findUnique({ where: { key: 'PRAYER_TIMES_DATE' } });
    const dataRow = await prisma.appConfig.findUnique({ where: { key: 'PRAYER_TIMES_DATA' } });

    const today = getTodayWIB();

    // Return cached if same day
    if (dateRow?.value === today && dataRow?.value) {
      return NextResponse.json({ source: 'cache', date: today, times: JSON.parse(dataRow.value) });
    }

    // Fetch fresh from aladhan.com
    const url = `https://api.aladhan.com/v1/timings/${today}?latitude=${LAT}&longitude=${LNG}&method=${METHOD}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Aladhan API error: ${res.status}`);

    const json = await res.json();
    const t: AladhanTimings = json.data.timings;

    const times = {
      Subuh: t.Fajr.substring(0, 5),
      Terbit: t.Sunrise.substring(0, 5),
      Zuhur: t.Dhuhr.substring(0, 5),
      Asar: t.Asr.substring(0, 5),
      Magrib: t.Maghrib.substring(0, 5),
      Isya: t.Isha.substring(0, 5),
    };

    // Cache in AppConfig
    await prisma.appConfig.upsert({
      where: { key: 'PRAYER_TIMES_DATE' },
      update: { value: today },
      create: { key: 'PRAYER_TIMES_DATE', value: today },
    });
    await prisma.appConfig.upsert({
      where: { key: 'PRAYER_TIMES_DATA' },
      update: { value: JSON.stringify(times) },
      create: { key: 'PRAYER_TIMES_DATA', value: JSON.stringify(times) },
    });

    return NextResponse.json({ source: 'api', date: today, times });
  } catch (error: unknown) {
    console.error('[API] Prayer times error:', error);
    // Fallback to cached even if stale
    try {
      const dataRow = await prisma.appConfig.findUnique({ where: { key: 'PRAYER_TIMES_DATA' } });
      if (dataRow?.value) {
        return NextResponse.json({ source: 'stale-cache', times: JSON.parse(dataRow.value) });
      }
    } catch {}
    return NextResponse.json({ error: 'Gagal mengambil jam sholat' }, { status: 500 });
  }
}

function getTodayWIB(): string {
  const now = new Date();
  const wibOffset = 7 * 60;
  const wibTime = new Date(now.getTime() + (wibOffset + now.getTimezoneOffset()) * 60000);
  return wibTime.toISOString().split('T')[0];
}
