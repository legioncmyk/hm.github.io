import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const attempts = await db.loginAttempt.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      attempts: attempts.map((a) => ({
        id: a.id,
        username: a.username,
        success: a.success,
        ip: a.ip,
        timestamp: a.timestamp,
      })),
      total: await db.loginAttempt.count(),
    });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
