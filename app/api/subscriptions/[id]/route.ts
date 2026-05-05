import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.nama !== undefined) data.nama = body.nama;
    if (body.nominal !== undefined) data.nominal = body.nominal;
    if (body.tanggal_renewal !== undefined) data.tanggalRenewal = body.tanggal_renewal;
    if (body.kategori !== undefined) data.kategori = body.kategori;
    if (body.status !== undefined) data.status = body.status;
    
    const sub = await prisma.subscription.update({
      where: { id },
      data,
    });
    return NextResponse.json(sub);
  } catch (error: any) {
    console.error('[API] PATCH /api/subscriptions/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.subscription.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[API] DELETE /api/subscriptions/[id] error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
