import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const lock = await db.accountLock.findUnique({
      where: { username: 'fullstack' },
    });

    if (!lock) {
      return NextResponse.json({
        username: 'fullstack',
        failedCount: 0,
        locked: false,
        lockedUntil: null,
      });
    }

    const isLocked = lock.lockedUntil && new Date(lock.lockedUntil) > new Date();
    let remainingSeconds = 0;

    if (isLocked && lock.lockedUntil) {
      remainingSeconds = Math.ceil(
        (new Date(lock.lockedUntil).getTime() - Date.now()) / 1000
      );
    }

    return NextResponse.json({
      username: lock.username,
      failedCount: lock.failedCount,
      locked: !!isLocked,
      remainingSeconds,
      lockedUntil: lock.lockedUntil,
    });
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
