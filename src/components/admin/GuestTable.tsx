"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type GuestRow = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  note: string | null;
  openCount: number;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  createdAt: string;
  wish: { attendance: "HADIR" | "RAGU" | "TIDAK_HADIR"; guestCount: number } | null;
};

const ATT_LABEL: Record<string, string> = {
  HADIR: "Hadir",
  RAGU: "Ragu",
  TIDAK_HADIR: "Tidak Hadir",
};

function ago(iso: string | null) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export default function GuestTable({
  guests,
  invitationSlug,
}: {
  guests: GuestRow[];
  invitationSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "opened" | "unopened" | "hadir" | "ragu" | "tidak">("all");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; guest?: GuestRow } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(t: string) {
    setToast(t);
    window.setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 2200);
  }

  function linkFor(slug: string) {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/${invitationSlug}?to=${slug}`;
  }

  async function copyLink(slug: string, name: string) {
    const url = linkFor(slug);
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(url);
      else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast(`Link untuk ${name} tersalin`);
    } catch {
      showToast("Gagal menyalin, salin manual dari kolom link");
    }
  }

  async function sendWhatsApp(g: GuestRow) {
    const url = linkFor(g.slug);
    const text = `Assalamu'alaikum, ${g.name}.\n\nTanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir di acara pernikahan kami.\n\nBerikut link undangannya:\n${url}\n\nTerima kasih.`;
    const phone = (g.phone || "").replace(/[^0-9]/g, "").replace(/^0/, "62");
    const wa = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener");
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return guests.filter((g) => {
      if (term && !g.name.toLowerCase().includes(term) && !(g.phone || "").includes(term)) return false;
      switch (filter) {
        case "opened":
          return !!g.firstOpenedAt;
        case "unopened":
          return !g.firstOpenedAt;
        case "hadir":
          return g.wish?.attendance === "HADIR";
        case "ragu":
          return g.wish?.attendance === "RAGU";
        case "tidak":
          return g.wish?.attendance === "TIDAK_HADIR";
        default:
          return true;
      }
    });
  }, [guests, q, filter]);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Daftar Tamu</h1>
          <p>Setiap tamu punya link unik yang otomatis menampilkan namanya.</p>
        </div>
        <div className="toolbar">
          <button type="button" className="b-btn b-primary" onClick={() => setModal({ mode: "add" })}>
            + Tambah Tamu
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="toolbar">
            <input
              className="b-input"
              placeholder="Cari nama atau nomor HP…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="b-select"
              style={{ width: "auto" }}
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="all">Semua status</option>
              <option value="opened">Sudah membuka</option>
              <option value="unopened">Belum membuka</option>
              <option value="hadir">RSVP: Hadir</option>
              <option value="ragu">RSVP: Ragu</option>
              <option value="tidak">RSVP: Tidak Hadir</option>
            </select>
          </div>
          <span className="b-hint">
            {filtered.length} dari {guests.length} tamu
          </span>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nama Tamu</th>
                <th>Link</th>
                <th>Status Buka</th>
                <th>RSVP</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="b-hint">
                    Tidak ada tamu yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{g.name}</div>
                      {g.phone ? <div className="b-hint">{g.phone}</div> : null}
                    </td>
                    <td>
                      <code className="b-hint" style={{ fontSize: ".7rem" }}>
                        ?to={g.slug}
                      </code>
                    </td>
                    <td>
                      {g.firstOpenedAt ? (
                        <span className="pill pill-ok" title={`${g.openCount}× dibuka`}>
                          Sudah · {g.openCount}×
                        </span>
                      ) : (
                        <span className="pill pill-muted">Belum</span>
                      )}
                      {g.lastOpenedAt ? <div className="b-hint">{ago(g.lastOpenedAt)}</div> : null}
                    </td>
                    <td>
                      {g.wish ? (
                        <span
                          className={`pill ${
                            g.wish.attendance === "HADIR"
                              ? "pill-ok"
                              : g.wish.attendance === "RAGU"
                                ? "pill-warn"
                                : "pill-off"
                          }`}
                        >
                          {ATT_LABEL[g.wish.attendance]}
                          {g.wish.attendance === "HADIR" && g.wish.guestCount > 1 ? ` · ${g.wish.guestCount}` : ""}
                        </span>
                      ) : (
                        <span className="pill pill-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="b-actions">
                        <button
                          type="button"
                          className="b-btn b-ghost b-mini"
                          onClick={() => copyLink(g.slug, g.name)}
                        >
                          Salin Link
                        </button>
                        <button
                          type="button"
                          className="b-btn b-ghost b-mini"
                          onClick={() => sendWhatsApp(g)}
                        >
                          WA
                        </button>
                        <button
                          type="button"
                          className="b-btn b-ghost b-mini"
                          onClick={() => setModal({ mode: "edit", guest: g })}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="b-btn b-danger b-mini"
                          disabled={pending}
                          onClick={() => {
                            if (!confirm(`Hapus tamu "${g.name}"? Link-nya akan berhenti bekerja.`)) return;
                            startTransition(async () => {
                              const res = await fetch(`/api/admin/guests?id=${encodeURIComponent(g.id)}`, {
                                method: "DELETE",
                              });
                              if (res.ok) {
                                showToast("Tamu dihapus");
                                router.refresh();
                              } else showToast("Gagal menghapus");
                            });
                          }}
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

      {modal ? (
        <GuestModal
          mode={modal.mode}
          guest={modal.guest}
          onClose={() => setModal(null)}
          onSaved={(msg) => {
            setModal(null);
            showToast(msg);
            router.refresh();
          }}
        />
      ) : null}

      <div className={`b-toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    </>
  );
}

function GuestModal({
  mode,
  guest,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  guest?: GuestRow;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [name, setName] = useState(guest?.name ?? "");
  const [phone, setPhone] = useState(guest?.phone ?? "");
  const [note, setNote] = useState(guest?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Nama wajib diisi.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: mode === "add" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "add"
            ? { name: name.trim(), phone: phone.trim() || null, note: note.trim() || null }
            : { id: guest!.id, name: name.trim(), phone: phone.trim() || null, note: note.trim() || null },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || "Gagal menyimpan");
      onSaved(mode === "add" ? "Tamu ditambahkan" : "Perubahan disimpan");
    } catch {
      setError("Koneksi bermasalah");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{mode === "add" ? "Tambah Tamu" : "Edit Tamu"}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error ? <p className="b-error">{error}</p> : null}
            <div className="b-field">
              <label className="b-label" htmlFor="g-name">
                Nama Tamu *
              </label>
              <input
                id="g-name"
                className="b-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Bapak Andi Fitra"
                autoFocus
              />
              <p className="b-hint">Nama ini yang tampil di cover undangan &amp; form RSVP.</p>
            </div>
            <div className="b-field">
              <label className="b-label" htmlFor="g-phone">
                Nomor WhatsApp
              </label>
              <input
                id="g-phone"
                className="b-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                inputMode="tel"
              />
              <p className="b-hint">Opsional, dipakai untuk tombol kirim via WhatsApp.</p>
            </div>
            <div className="b-field">
              <label className="b-label" htmlFor="g-note">
                Catatan
              </label>
              <input
                id="g-note"
                className="b-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="cth. keluarga kantor"
              />
            </div>
            {mode === "add" ? (
              <p className="b-hint">
                Link unik dibuat otomatis dari nama tamu. Setelah tersimpan, gunakan tombol{" "}
                <strong>Salin Link</strong>.
              </p>
            ) : null}
          </div>
          <div className="modal-foot">
            <button type="button" className="b-btn b-ghost" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button type="submit" className="b-btn b-primary" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
