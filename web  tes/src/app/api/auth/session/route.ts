import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, message: 'Tidak ada sesi aktif' },
        { status: 401 }
      );
    }

    const session = await db.authSession.findUnique({
      where: { token },
    });

    if (!session) {
      return NextResponse.json(
        { authenticated: false, message: 'Sesi tidak valid' },
        { status: 401 }
      );
    }

    if (new Date(session.expiresAt) < new Date()) {
      await db.authSession.delete({ where: { token } });
      return NextResponse.json(
        { authenticated: false, message: 'Sesi telah kedaluwarsa' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      username: session.username,
      loginAt: session.createdAt,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
