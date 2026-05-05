import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { todayStr } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dueToday = searchParams.get('due_today');

    if (dueToday) {
      const today = todayStr();
      const todayDate = new Date(today);
      const dayOfWeek = todayDate.getDay().toString(); // 0-6
      const dayOfMonth = today.split('-')[2]; // DD

      const reminders = await prisma.reminder.findMany({
        where: {
          active: true,
          OR: [
            { frequency: 'Sekali', date: today },
            { frequency: 'Harian' },
            // For weekly/monthly, we filter in application layer
          ],
        },
      });

      // Also get weekly and monthly reminders and filter
      const weeklyMonthly = await prisma.reminder.findMany({
        where: {
          active: true,
          frequency: { in: ['Mingguan', 'Bulanan'] },
        },
      });

      const filtered = weeklyMonthly.filter(r => {
        if (!r.date) return false;
        if (r.frequency === 'Mingguan') {
          const rDate = new Date(r.date);
          return rDate.getDay().toString() === dayOfWeek;
        }
        if (r.frequency === 'Bulanan') {
          return r.date.split('-')[2] === dayOfMonth;
        }
        return false;
      });

      return NextResponse.json([...reminders, ...filtered]);
    }

    const reminders = await prisma.reminder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json(reminders);
  } catch (error: any) {
    console.error('[API] GET /api/reminders error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reminder = await prisma.reminder.create({
      data: {
        title: body.title,
        role: body.role,
        date: body.date || null,
        frequency: body.frequency || 'Sekali',
        active: true,
      },
    });
    return NextResponse.json(reminder);
  } catch (error: any) {
    console.error('[API] POST /api/reminders error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
