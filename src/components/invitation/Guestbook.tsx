"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {carnivalStickers, stickerImage} from "@/lib/carnival-stickers";
import VoiceRecorder from "./karnaval/VoiceRecorder";

export type WishItem = {
  voiceId?: string | null;
  sticker?: string | null;
  id: string;
  name: string;
  attendance: "HADIR" | "RAGU" | "TIDAK_HADIR";
  guestCount: number;
  message: string;
  createdAt: string;
};

const BADGE: Record<WishItem["attendance"], string> = {
  HADIR: "Hadir",
  RAGU: "Ragu",
  TIDAK_HADIR: "Tidak Hadir",
};

function timeAgo(iso: string) {
  const past = new Date(iso);
  const diff = Math.floor((Date.now() - past.getTime()) / 1000);
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari yang lalu`;
  return past.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function Guestbook({
  initial,
  guestName,
  guestToken,
  carnival = false,
  onSent,
}: {
  carnival?: boolean;
  onSent?: (wish:WishItem) => void;
  initial: WishItem[];
  guestName: string | null;
  guestToken: string | null;
}) {
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [sticker, setSticker] = useState<string | null>(null);
  const [recorderKey, setRecorderKey] = useState(0);
  const [items, setItems] = useState<WishItem[]>(initial);
  const [name, setName] = useState((guestName ?? "").slice(0,60));
  useEffect(() => { setItems(initial); }, [initial]);
  const [attendance, setAttendance] = useState<WishItem["attendance"]>("HADIR");
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Nama wajib diisi.");
    if (message.trim().length < 2) return setError("Ucapan terlalu pendek.");

    setBusy(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          attendance,
          guestCount,
          message: message.trim(),
          token: guestToken,
          voiceId, sticker,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; item?: WishItem };
      if (!res.ok || !data.ok) {
        setError(data.error || "Gagal mengirim. Coba lagi ya.");
        return;
      }
      if (data.item) setItems((prev) => [data.item as WishItem, ...prev.filter(i => i.id !== data.item!.id)]);
      if (data.item) onSent?.(data.item);
      setMessage("");
      setVoiceId(null); setSticker(null); setRecorderKey(k => k + 1);
      showToast("Ucapan & doa terkirim, terima kasih!");
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  const visible = items.slice(0, 60);

  return (
    <>
      <form className="form-card" onSubmit={submit} style={{ marginTop: "1.8rem" }}>
        <div style={{ marginBottom: "0.85rem" }}>
          <label className="field-label" htmlFor="w-name">
            Nama Anda
          </label>
          <input
            id="w-name"
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            maxLength={60}
            autoComplete="name"
          />
        </div>

        <div style={{ marginBottom: "0.85rem" }}>
          <span className="field-label">Konfirmasi Kehadiran</span>
          <div className="radio-row">
            {(["HADIR", "RAGU", "TIDAK_HADIR"] as const).map((v) => (
              <label className="radio-pill" key={v}>
                <input
                  type="radio"
                  name="attendance"
                  value={v}
                  checked={attendance === v}
                  onChange={() => setAttendance(v)}
                />
                {BADGE[v]}
              </label>
            ))}
          </div>
        </div>

        {attendance === "HADIR" ? (
          <div style={{ marginBottom: "0.85rem" }}>
            <label className="field-label" htmlFor="w-count">
              Jumlah Orang
            </label>
            <input
              id="w-count"
              type="number"
              min={1}
              max={10}
              className="field-input"
              value={guestCount}
              onChange={(e) => setGuestCount(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
            />
          </div>
        ) : null}

        <div style={{ marginBottom: "0.95rem" }}>
          <label className="field-label" htmlFor="w-msg">
            Ucapan / Doa
          </label>
          <textarea
            id="w-msg"
            className="field-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis ucapan dan doa untuk kedua mempelai…"
            maxLength={500}
          />
          <div style={{ textAlign: "right", fontSize: "0.68rem", color: "#8a9a90" }}>
            {message.length}/500
          </div>
        </div>

        {carnival && <><div className="kk-stickers" aria-label="Stiker ucapan">{carnivalStickers.map(s => <button type="button" key={s.id} aria-label={`Stiker ${s.name}`} aria-pressed={sticker === s.id} onClick={() => setSticker(sticker === s.id ? null : s.id)}><img src={s.src} alt={s.name} loading="lazy" /></button>)}</div><VoiceRecorder key={recorderKey} onChange={setVoiceId} onBusy={setVoiceBusy} disabled={busy}/></>}

        {error ? (
          <p style={{ color: "#b3261e", fontSize: "0.82rem", marginBottom: "0.7rem" }}>{error}</p>
        ) : null}

        <button type="submit" className="btn-solid" style={{ width: "100%" }} disabled={busy || voiceBusy}>
          {busy ? "Mengirim…" : "Kirim Ucapan & Doa"}
        </button>
      </form>

      <div style={{ marginTop: "2.2rem" }}>
        <p className="eyebrow" style={{ color: "rgba(226,197,116,.85)" }}>
          Daftar Ucapan Tamu ({items.length})
        </p>

        {visible.length === 0 ? (
          <p className="wish-empty">Belum ada ucapan. Jadilah yang pertama!</p>
        ) : (
          <div className="wish-list">
            {visible.map((w) => (
              <article className="wish-item" key={w.id}>
                <div className="wish-head">
                  <span className="wish-name">{w.name}</span>
                  <span className="wish-badge">
                    {BADGE[w.attendance]}
                    {w.attendance === "HADIR" && w.guestCount > 1 ? ` · ${w.guestCount} org` : ""}
                  </span>
                </div>
                <p className="wish-text" style={{ whiteSpace: "pre-line", wordBreak: "break-word" }}>
                  {w.message}
                </p>
                {w.sticker && <p aria-label="Stiker ucapan" style={{fontSize: "2rem"}}>{stickerImage(w.sticker) ? <img className="kk-wish-sticker" src={stickerImage(w.sticker)} alt="Stiker ucapan" loading="lazy" /> : w.sticker}</p>}
                {w.voiceId && <audio controls preload="none" style={{width:"100%"}} src={`/api/carnival/voice/${w.voiceId}`} />}
                <p className="wish-time">{timeAgo(w.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
