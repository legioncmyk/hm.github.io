"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  LogOut,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  History,
  Fingerprint,
  Loader2,
  ChevronRight,
  Terminal,
  AlertCircle,
} from "lucide-react";

// Types
interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  username?: string;
  locked?: boolean;
  remainingSeconds?: number;
  remainingAttempts?: number;
}

interface SessionResponse {
  authenticated: boolean;
  username?: string;
  loginAt?: string;
  message?: string;
}

interface LoginAttempt {
  id: string;
  username: string;
  success: boolean;
  ip: string | null;
  timestamp: string;
}

interface LockStatus {
  username: string;
  failedCount: number;
  locked: boolean;
  remainingSeconds: number;
  lockedUntil: string | null;
}

// Particles background
function Particles() {
  const [particles] = useState(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${8 + Math.random() * 12}s`,
      animationDelay: `${Math.random() * 10}s`,
      size: `${1 + Math.random() * 3}px`,
      opacity: 0.2 + Math.random() * 0.4,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

// Login View
function LoginView({
  onLoginSuccess,
}: {
  onLoginSuccess: (username: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [lockInfo, setLockInfo] = useState<LockStatus | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check lock status on mount
  const checkLockStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data: LockStatus = await res.json();
      setLockInfo(data);

      if (data.locked && data.remainingSeconds > 0) {
        setCountdown(data.remainingSeconds);
        startCountdown(data.remainingSeconds);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    checkLockStatus();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [checkLockStatus]);

  const startCountdown = (seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    let remaining = seconds;
    setCountdown(remaining);

    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setLockInfo((prev) => (prev ? { ...prev, locked: false } : null));
        setError("");
      }
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (countdown > 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data: LoginResponse = await res.json();

      if (data.success && data.token && data.username) {
        onLoginSuccess(data.username);
      } else {
        setError(data.message);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);

        // Update lock info
        if (data.locked && data.remainingSeconds) {
          startCountdown(data.remainingSeconds);
          setLockInfo((prev) =>
            prev
              ? { ...prev, locked: true }
              : {
                  username: username || "fullstack",
                  failedCount: 5,
                  locked: true,
                  remainingSeconds: data.remainingSeconds!,
                  lockedUntil: new Date(
                    Date.now() + data.remainingSeconds! * 1000
                  ).toISOString(),
                }
          );
        } else {
          // Refresh lock status
          checkLockStatus();
        }
      }
    } catch {
      setError("Terjadi kesalahan koneksi");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const isLocked = countdown > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid">
      <Particles />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo / Brand */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 mb-4 shield-pulse">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Secure<span className="text-red-500">Auth</span>
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Fullstack Authentication System
          </p>
        </motion.div>

        {/* Login Card */}
        <div
          className={`relative rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-8 card-glow ${
            isShaking ? "shake" : ""
          }`}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-red-600/40 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-red-600/40 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-red-600/40 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-red-600/40 rounded-br-2xl" />

          {/* Lock Overlay */}
          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center"
              >
                <Lock className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-red-400 font-semibold text-lg mb-2">
                  Akun Terkunci
                </h3>
                <p className="text-zinc-400 text-sm mb-6">
                  Terlalu banyak percobaan login gagal
                </p>
                <div className="relative w-24 h-24 mb-4">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#2a2a2a"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={251}
                      strokeDashoffset={251 - (countdown / 60) * 251}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-red-500 font-mono">
                      {countdown}
                    </span>
                  </div>
                </div>
                <p className="text-zinc-500 text-xs">
                  Coba lagi dalam {countdown} detik
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10">
            <h2 className="text-xl font-semibold text-white mb-1">Masuk</h2>
            <p className="text-zinc-500 text-sm mb-6">
              Masukkan kredensial untuk mengakses dashboard
            </p>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-red-300">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    disabled={isLocked || loading}
                    className="w-full h-11 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    disabled={isLocked || loading}
                    className="w-full h-11 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remaining attempts indicator */}
              {lockInfo && lockInfo.failedCount > 0 && !isLocked && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i < lockInfo.failedCount
                            ? "bg-red-500"
                            : "bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-zinc-500">
                    {5 - lockInfo.failedCount} dari 5 percobaan tersisa
                  </span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLocked || loading || !username || !password}
                className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-600 disabled:hover:to-red-700 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span>Masuk</span>
                  </>
                )}
              </button>
            </form>

            {/* Security notice */}
            <div className="mt-6 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <Shield className="w-3 h-3" />
                <span>
                  Dilindungi dengan anti brute-force protection
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-zinc-700 text-xs mt-6">
          SecureAuth &copy; {new Date().getFullYear()} — Fullstack Security Demo
        </p>
      </motion.div>
    </div>
  );
}

// Dashboard View
function DashboardView({
  username,
  onLogout,
  loginAt,
}: {
  username: string;
  onLogout: () => void;
  loginAt: string;
}) {
  const [history, setHistory] = useState<LoginAttempt[]>([]);
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [historyRes, statusRes] = await Promise.all([
        fetch("/api/auth/history"),
        fetch("/api/auth/status"),
      ]);

      const historyData = await historyRes.json();
      const statusData: LockStatus = await statusRes.json();

      setHistory(historyData.attempts || []);
      setLockStatus(statusData);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalAttempts = history.length;
  const successCount = history.filter((a) => a.success).length;
  const failCount = history.filter((a) => !a.success).length;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (loginAtStr: string) => {
    const start = new Date(loginAtStr).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / 1000);
    if (diff < 60) return `${diff} detik`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit`;
    return `${Math.floor(diff / 3600)} jam ${Math.floor((diff % 3600) / 60)} menit`;
  };

  const [sessionDuration, setSessionDuration] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDuration(formatDuration(loginAt));
    }, 1000);
    setSessionDuration(formatDuration(loginAt));
    return () => clearInterval(timer);
  }, [loginAt]);

  return (
    <div className="min-h-screen bg-grid">
      <Particles />

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">
                Secure<span className="text-red-500">Auth</span>
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
              <span className="text-zinc-400 text-sm">Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500 dot-pulse" />
                <span>Online</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Selamat datang,{" "}
              <span className="text-red-500">{username}</span>
            </h1>
            <p className="text-zinc-500 mt-1">
              Panel administrasi sistem autentikasi
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <StatCard
              icon={<Activity className="w-5 h-5" />}
              label="Status Login"
              value="Aktif"
              color="emerald"
              subtext={`Sesi: ${sessionDuration}`}
            />
            <StatCard
              icon={<AlertCircle className="w-5 h-5" />}
              label="Percobaan Gagal"
              value={lockStatus?.failedCount?.toString() || "0"}
              color="red"
              subtext={`Maks: 5 kali`}
            />
            <StatCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="Login Berhasil"
              value={successCount.toString()}
              color="emerald"
              subtext={`dari ${totalAttempts} total`}
            />
            <StatCard
              icon={<XCircle className="w-5 h-5" />}
              label="Login Gagal"
              value={failCount.toString()}
              color="amber"
              subtext="Total keseluruhan"
            />
          </motion.div>

          {/* Account Status + Lock Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8"
          >
            {/* Account Info Card */}
            <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Informasi Akun</h3>
                  <p className="text-zinc-500 text-xs">Detail sesi aktif</p>
                </div>
              </div>
              <div className="space-y-3">
                <InfoRow label="Username" value={username} />
                <InfoRow
                  label="Waktu Login"
                  value={formatTime(loginAt)}
                />
                <InfoRow
                  label="Durasi Sesi"
                  value={sessionDuration}
                />
                <InfoRow
                  label="Status Keamanan"
                  value={
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 dot-pulse" />
                      <span className="text-emerald-400">Aman</span>
                    </span>
                  }
                />
              </div>
            </div>

            {/* Security Status Card */}
            <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Status Keamanan</h3>
                  <p className="text-zinc-500 text-xs">
                    Proteksi anti brute-force
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <InfoRow
                  label="Status Akun"
                  value={
                    <span className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          lockStatus?.locked
                            ? "bg-red-500 dot-pulse"
                            : "bg-emerald-500 dot-pulse"
                        }`}
                      />
                      <span
                        className={
                          lockStatus?.locked
                            ? "text-red-400"
                            : "text-emerald-400"
                        }
                      >
                        {lockStatus?.locked ? "Terkunci" : "Normal"}
                      </span>
                    </span>
                  }
                />
                <InfoRow
                  label="Percobaan Gagal Saat Ini"
                  value={`${lockStatus?.failedCount || 0} / 5`}
                />
                <InfoRow
                  label="Batas Penguncian"
                  value="60 detik"
                />
                <InfoRow
                  label="Delay Login"
                  value="2.5 detik (anti brute-force)"
                />
              </div>
            </div>
          </motion.div>

          {/* Login History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800"
          >
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                  <History className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    Riwayat Login
                  </h3>
                  <p className="text-zinc-500 text-xs">
                    {totalAttempts} total percobaan
                  </p>
                </div>
              </div>
              <button
                onClick={fetchData}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-2 rounded-lg hover:bg-zinc-800/50"
                title="Refresh"
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                <Terminal className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Belum ada riwayat login</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-900">
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-6 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-6 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                          Username
                        </th>
                        <th className="text-left px-6 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">
                          IP Address
                        </th>
                        <th className="text-left px-6 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                          Waktu
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((attempt, index) => (
                        <motion.tr
                          key={attempt.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                        >
                          <td className="px-6 py-3">
                            {attempt.success ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Berhasil
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                                <XCircle className="w-3 h-3" />
                                Gagal
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2 text-zinc-300">
                              <User className="w-3.5 h-3.5 text-zinc-600" />
                              {attempt.username}
                            </div>
                          </td>
                          <td className="px-6 py-3 hidden sm:table-cell">
                            <code className="text-zinc-500 text-xs bg-zinc-800/50 px-2 py-1 rounded">
                              {attempt.ip || "-"}
                            </code>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(attempt.timestamp)}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-zinc-600 text-xs">
              SecureAuth &copy; {new Date().getFullYear()} — Fullstack Security
              Demo
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-700">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Anti Brute-Force
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Rate Limiting
              </span>
              <span className="flex items-center gap-1">
                <Fingerprint className="w-3 h-3" />
                Session Auth
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "red" | "emerald" | "amber" | "blue";
  subtext: string;
}) {
  const colorClasses = {
    red: "bg-red-500/10 text-red-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    blue: "bg-blue-500/10 text-blue-500",
  };

  const valueColorClasses = {
    red: "text-red-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    blue: "text-blue-400",
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-4 sm:p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
      <p className="text-xs text-zinc-600 mt-2">{subtext}</p>
    </div>
  );
}

// Info Row Component
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className="text-zinc-300 text-sm font-medium">{value}</span>
    </div>
  );
}

// Main App
export default function AuthPage() {
  const [view, setView] = useState<"login" | "dashboard">("login");
  const [user, setUser] = useState("");
  const [loginAt, setLoginAt] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data: SessionResponse = await res.json();

        if (data.authenticated && data.username) {
          setUser(data.username);
          setLoginAt(data.loginAt || new Date().toISOString());
          setView("dashboard");
        }
      } catch {
        // not logged in
      } finally {
        setInitialLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLoginSuccess = (username: string) => {
    setUser(username);
    setLoginAt(new Date().toISOString());
    setView("dashboard");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // silently fail
    }
    setUser("");
    setLoginAt("");
    setView("login");
  };

  // Loading screen
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shield-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === "login" ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoginView onLoginSuccess={handleLoginSuccess} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DashboardView
            username={user}
            onLogout={handleLogout}
            loginAt={loginAt}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
