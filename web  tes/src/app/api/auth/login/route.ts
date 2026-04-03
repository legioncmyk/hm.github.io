import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

const VALID_USERNAME = 'fullstack';
const VALID_PASSWORD = 'sirblackline';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 60 * 1000; // 60 seconds
const LOGIN_DELAY_MS = 2500; // 2.5 seconds anti brute force delay

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);

    // Check if account is locked
    let accountLock = await db.accountLock.findUnique({
      where: { username },
    });

    if (accountLock && accountLock.lockedUntil && new Date(accountLock.lockedUntil) > new Date()) {
      const remainingMs = new Date(accountLock.lockedUntil).getTime() - Date.now();
      const remainingSec = Math.ceil(remainingMs / 1000);
      return NextResponse.json(
        {
          success: false,
          message: `Akun terkunci. Coba lagi dalam ${remainingSec} detik.`,
          locked: true,
          remainingSeconds: remainingSec,
        },
        { status: 429 }
      );
    }

    // Anti brute force delay - always delay to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, LOGIN_DELAY_MS));

    // Validate credentials
    const isValid = username === VALID_USERNAME && password === VALID_PASSWORD;

    if (!isValid) {
      // Increment failed attempts
      if (!accountLock) {
        accountLock = await db.accountLock.create({
          data: { username, failedCount: 1 },
        });
      } else {
        // Reset lock if lock period has expired
        const updateData: { failedCount: number; lockedUntil?: Date | null } = {
          failedCount: accountLock.failedCount + 1,
        };
        if (accountLock.lockedUntil && new Date(accountLock.lockedUntil) <= new Date()) {
          updateData.lockedUntil = null;
        }
        accountLock = await db.accountLock.update({
          where: { username },
          data: updateData,
        });
      }

      // Check if max attempts reached
      if (accountLock.failedCount >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await db.accountLock.update({
          where: { username },
          data: { lockedUntil, failedCount: 0 },
        });

        // Log the attempt
        await db.loginAttempt.create({
          data: { username, success: false, ip },
        });

        return NextResponse.json(
          {
            success: false,
            message: 'Terlalu banyak percobaan login. Akun dikunci selama 60 detik.',
            locked: true,
            remainingSeconds: 60,
          },
          { status: 429 }
        );
      }

      const remaining = MAX_ATTEMPTS - accountLock.failedCount;

      // Log the attempt
      await db.loginAttempt.create({
        data: { username, success: false, ip },
      });

      return NextResponse.json(
        {
          success: false,
          message: `Username atau password salah. ${remaining} percobaan tersisa.`,
          remainingAttempts: remaining,
        },
        { status: 401 }
      );
    }

    // Login success - reset lock
    if (accountLock) {
      await db.accountLock.update({
        where: { username },
        data: { failedCount: 0, lockedUntil: null },
      });
    }

    // Create session
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.authSession.create({
      data: { token, username, expiresAt },
    });

    // Log successful attempt
    await db.loginAttempt.create({
      data: { username, success: true, ip },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login berhasil!',
        token,
        username,
      },
      { status: 200 }
    );

    // Set cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
