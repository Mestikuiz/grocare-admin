import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { api, setToken } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function SignIn() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [blockedSeconds, setBlockedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    if (blockedSeconds <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setBlockedSeconds((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); setError(""); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [blockedSeconds]);

  const isBlocked = blockedSeconds > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/admin-login", { email, password });
      setToken(res.data.token);
      const u = res.data.user;
      setUser({ id: u.id, phone: u.phone ?? '', role: u.role, name: u.name ?? '', email: u.email ?? '' });
      navigate("/");
    } catch (err: any) {
      const data   = err.response?.data;
      const status = err.response?.status;
      if (status === 429 && data?.secondsLeft) {
        setBlockedSeconds(data.secondsLeft);
        setError("Too many failed attempts. Account locked.");
      } else {
        setError(data?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "#0D0D0D" }}
    >
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/images/logo/logo-dark.png"
          alt="Grocare"
          className="h-14 w-auto object-contain"
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-[456px] bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Log in</h1>
        <p className="text-sm text-gray-500 mb-7">Continue to Grocare Admin</p>

        {/* Error */}
        {error && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm border ${
            isBlocked
              ? "bg-orange-50 border-orange-200 text-orange-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              {isBlocked && (
                <span className="font-mono font-bold text-orange-600 flex-shrink-0">
                  {formatTime(blockedSeconds)}
                </span>
              )}
            </div>
            {isBlocked && (
              <div className="mt-2 w-full bg-orange-200 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-orange-500 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${(blockedSeconds / 300) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@grocare.pk"
              required
              disabled={isBlocked}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isBlocked}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || isBlocked}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white bg-gray-900 hover:bg-gray-800 active:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isBlocked
              ? `Locked — ${formatTime(blockedSeconds)}`
              : loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-gray-400">
          Default: <span className="text-gray-600 font-medium">admin@grocare.pk</span> / <span className="text-gray-600 font-medium">admin12345&</span>
        </p>
      </div>

      <p className="mt-8 text-xs text-gray-600">
        © {new Date().getFullYear()} Grocare. All rights reserved.
      </p>
    </div>
  );
}
