import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.role !== undefined) data.role = body.role;
    if (body.date !== undefined) data.date = body.date;
    if (body.frequency !== undefined) data.frequency = body.frequency;
    if (body.active !== undefined) data.active = body.active;
    
    const reminder = await prisma.reminder.update({
      where: { id },
      data,
    });
    return NextResponse.json(reminder);
  } catch (error: any) {
    console.error('[API] PATCH /api/reminders/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/reminders/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
