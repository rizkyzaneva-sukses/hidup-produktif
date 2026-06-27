import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { username, password, nama } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    if (String(username).length < 3) {
      return NextResponse.json({ error: 'Username minimal 3 karakter' }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const usernameNorm = String(username).toLowerCase().trim();

    // Cek username sudah terdaftar
    const existing = await prisma.user.findUnique({
      where: { username: usernameNorm },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: 'Username sudah terdaftar' }, { status: 409 });
    }

    const passwordHash = await hashPassword(String(password));

    const user = await prisma.user.create({
      data: {
        username: usernameNorm,
        passwordHash,
        nama: nama ? String(nama).trim() : null,
      },
    });

    // Auto-login setelah register
    const session = await getSession();
    session.isLoggedIn = true;
    session.username = user.username;
    await session.save();

    return NextResponse.json({ ok: true, user: { id: user.id, username: user.username, nama: user.nama } });
  } catch (error: unknown) {
    console.error('[API] POST /api/auth/register error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
