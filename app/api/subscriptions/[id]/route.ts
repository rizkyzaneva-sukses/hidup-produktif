import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function mapSub(s: any) {
  return {
    id: s.id,
    nama: s.nama,
    nominal: s.nominal,
    tanggal_renewal: s.tanggalRenewal,
    kategori: s.kategori,
    status: s.status,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.nama !== undefined) data.nama = body.nama;
    if (body.nominal !== undefined) data.nominal = body.nominal;
    if (body.tanggal_renewal !== undefined) data.tanggalRenewal = body.tanggal_renewal || null;
    if (body.kategori !== undefined) data.kategori = body.kategori;
    if (body.status !== undefined) data.status = body.status;
    
    const sub = await prisma.subscription.update({
      where: { id },
      data,
    });
    return NextResponse.json(mapSub(sub));
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
