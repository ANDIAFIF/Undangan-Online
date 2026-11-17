"use client";

import { useMemo, useState, useTransition } from "react";
import {stickerImage} from "@/lib/carnival-stickers";
import { useRouter } from "next/navigation";

export type WishRow = {
  id: string;
  name: string;
  attendance: "HADIR" | "RAGU" | "TIDAK_HADIR";
  guestCount: number;
  message: string;
  voiceId?: string | null;
  sticker?: string | null;
  isVisible: boolean;
  createdAt: string;
};

const LABEL: Record<WishRow["attendance"], string> = {
  HADIR: "Hadir",
  RAGU: "Ragu",
  TIDAK_HADIR: "Tidak Hadir",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WishList({ wishes }: { wishes: WishRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "visible" | "hidden" | "hadir" | "ragu" | "tidak">("all");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(t: string) {
    setToast(t);
    window.setTimeout(() => setToast((c) => (c === t ? null : c)), 2000);
  }

  async function toggle(w: WishRow) {
    startTransition(async () => {
      const res = await fetch("/api/admin/wishes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: w.id, isVisible: !w.isVisible }),
      });
      if (res.ok) {
        showToast(w.isVisible ? "Ucapan disembunyikan" : "Ucapan ditampilkan");
        router.refresh();
      } else showToast("Gagal mengubah");
    });
  }

  async function remove(w: WishRow) {
    if (!confirm(`Hapus ucapan dari "${w.name}"? Tindakan ini permanen.`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/wishes?id=${encodeURIComponent(w.id)}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Ucapan dihapus");
        router.refresh();
      } else showToast("Gagal menghapus");
    });
  }

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return wishes.filter((w) => {
      if (term && !w.name.toLowerCase().includes(term) && !w.message.toLowerCase().includes(term)) return false;
      switch (filter) {
        case "visible":
          return w.isVisible;
        case "hidden":
          return !w.isVisible;
        case "hadir":
          return w.attendance === "HADIR";
        case "ragu":
          return w.attendance === "RAGU";
        case "tidak":
          return w.attendance === "TIDAK_HADIR";
        default:
          return true;
      }
    });
  }, [wishes, q, filter]);

  const totalJiwa = wishes
    .filter((w) => w.attendance === "HADIR")
    .reduce((sum, w) => sum + w.guestCount, 0);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Ucapan &amp; RSVP</h1>
          <p>
            {wishes.length} ucapan · {totalJiwa} perkiraan jiwa hadir
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="toolbar">
            <input
              className="b-input"
              placeholder="Cari nama atau isi ucapan…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="b-select"
              style={{ width: "auto" }}
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="all">Semua</option>
              <option value="visible">Tampil</option>
              <option value="hidden">Disembunyikan</option>
              <option value="hadir">Hadir</option>
              <option value="ragu">Ragu</option>
              <option value="tidak">Tidak Hadir</option>
            </select>
          </div>
          <span className="b-hint">{list.length} ditampilkan</span>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Tamu</th>
                <th>RSVP</th>
                <th>Ucapan</th>
                <th>Waktu</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="b-hint">
                    Belum ada ucapan.
                  </td>
                </tr>
              ) : (
                list.map((w) => (
                  <tr key={w.id} style={{ opacity: w.isVisible ? 1 : 0.55 }}>
                    <td style={{ fontWeight: 600 }}>{w.name}</td>
                    <td>
                      <span
                        className={`pill ${
                          w.attendance === "HADIR"
                            ? "pill-ok"
                            : w.attendance === "RAGU"
                              ? "pill-warn"
                              : "pill-off"
                        }`}
                      >
                        {LABEL[w.attendance]}
                        {w.attendance === "HADIR" && w.guestCount > 1 ? ` · ${w.guestCount}` : ""}
                      </span>
                    </td>
                    <td style={{ maxWidth: 340, fontSize: ".82rem", color: "#4c5f54" }}>{w.message}{w.sticker && <p style={{fontSize:"1.5rem"}}>{stickerImage(w.sticker) ? <img src={stickerImage(w.sticker)} alt="Stiker ucapan" width="80" loading="lazy" /> : w.sticker}</p>}{w.voiceId && <audio controls preload="none" style={{width:"100%",maxWidth:280}} src={`/api/carnival/voice/${w.voiceId}`} />}</td>
                    <td className="b-hint" style={{ whiteSpace: "nowrap" }}>
                      {fmt(w.createdAt)}
                    </td>
                    <td>
                      <div className="b-actions">
                        <button
                          type="button"
                          className="b-btn b-ghost b-mini"
                          onClick={() => toggle(w)}
                          disabled={pending}
                        >
                          {w.isVisible ? "Sembunyikan" : "Tampilkan"}
                        </button>
                        <button
                          type="button"
                          className="b-btn b-danger b-mini"
                          onClick={() => remove(w)}
                          disabled={pending}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`b-toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    </>
  );
}
