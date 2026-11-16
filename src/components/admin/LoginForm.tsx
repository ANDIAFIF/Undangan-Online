"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ next }: { next?: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Password salah");
        return;
      }
      router.replace(next || "/admin");
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="login-card">
      <div className="login-mark">◆</div>
      <h1>Admin Undangan</h1>
      <p>Masukkan password untuk mengelola tamu &amp; ucapan.</p>

      <label htmlFor="pw">Password</label>
      <input
        id="pw"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        autoComplete="current-password"
        placeholder="••••••••"
      />

      {error ? <p className="login-error">{error}</p> : null}

      <button type="submit" disabled={busy || !password}>
        {busy ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
