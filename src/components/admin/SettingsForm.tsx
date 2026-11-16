"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhotoUpload from "./PhotoUpload";
import type { GiftAccount, StoryItem } from "@/lib/invitation";

export type SettingsData = {
  slug: string;
  title: string;
  theme: string;
  musicUrl: string;
  musicTitle: string;
  openingSalam: string;
  invitationText: string;
  quoteText: string;
  quoteSource: string;
  closingText: string;
  brideName: string;
  brideNick: string;
  brideParents: string;
  brideInstagram: string;
  bridePhoto: string;
  groomName: string;
  groomNick: string;
  groomParents: string;
  groomInstagram: string;
  groomPhoto: string;
  coupleOrder: string;
  mainDate: string;
  akadAt: string;
  akadEndAt: string;
  resepsiAt: string;
  resepsiEndAt: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  giftText: string;
  giftAddress: string;
  gallery: string[];
  giftAccounts: GiftAccount[];
  storyItems: StoryItem[];
  invitedBy: string[];
};

export default function SettingsForm({ initial }: { initial: SettingsData }) {
  const router = useRouter();
  const [form, setForm] = useState<SettingsData>(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (uploading) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "Gagal menyimpan" });
        return;
      }
      setMsg({ type: "ok", text: "Pengaturan tersimpan" });
      router.refresh();
    } catch {
      setMsg({ type: "err", text: "Koneksi bermasalah" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="admin-head">
        <div>
          <h1>Pengaturan Undangan</h1>
          <p>Data ini tampil di halaman undangan tamu.</p>
        </div>
        <div className="toolbar">
          {msg ? (
            <span className={`pill ${msg.type === "ok" ? "pill-ok" : "pill-off"}`}>{msg.text}</span>
          ) : null}
          <button type="submit" className="b-btn b-primary" disabled={busy || uploading}>
            {busy ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* Mempelai */}
      <div className="panel">
        <div className="panel-head">
          <h2>Kedua Mempelai</h2>
        </div>
        <div className="panel-body">
          <div className="b-field">
            <label className="b-label" htmlFor="order">
              Urutan Nama
            </label>
            <select
              id="order"
              className="b-select"
              value={form.coupleOrder}
              onChange={(e) => set("coupleOrder", e.target.value)}
            >
              <option value="bride-first">Mempelai wanita dulu</option>
              <option value="groom-first">Mempelai pria dulu</option>
            </select>
          </div>

          <div className="b-row">
            <div>
              <div className="b-field">
                <label className="b-label">Nama Panggilan — Wanita</label>
                <input
                  className="b-input"
                  value={form.brideNick}
                  onChange={(e) => set("brideNick", e.target.value)}
                />
              </div>
              <div className="b-field">
                <label className="b-label">Nama Lengkap — Wanita</label>
                <input
                  className="b-input"
                  value={form.brideName}
                  onChange={(e) => set("brideName", e.target.value)}
                />
              </div>
              <div className="b-field">
                <label className="b-label">Orang Tua — Wanita</label>
                <textarea
                  className="b-textarea"
                  value={form.brideParents}
                  onChange={(e) => set("brideParents", e.target.value)}
                  placeholder="Putri dari Bapak … dan Ibu …"
                />
              </div>
              <div className="b-row">
                <div className="b-field">
                  <label className="b-label">Instagram</label>
                  <input
                    className="b-input"
                    value={form.brideInstagram}
                    onChange={(e) => set("brideInstagram", e.target.value)}
                    placeholder="username"
                  />
                </div>
                <div className="b-field">
                  <label className="b-label">Foto (URL)</label>
                  <input
                    className="b-input"
                    value={form.bridePhoto}
                    onChange={(e) => set("bridePhoto", e.target.value)}
                    placeholder="/img/… atau https://…"
                  />
                  <PhotoUpload disabled={busy || uploading} onBusy={setUploading} onUploaded={(url) => set("bridePhoto", url)} />
                  {form.bridePhoto ? <img src={form.bridePhoto} alt="Pratinjau foto mempelai wanita" style={{ width: 120, height: 160, objectFit: "cover", borderRadius: 12, marginTop: ".75rem" }} /> : null}
                  {form.bridePhoto ? <button type="button" className="b-btn b-ghost" disabled={busy || uploading} onClick={() => set("bridePhoto", "")}>Hapus Foto</button> : null}
                </div>
              </div>
            </div>

            <div>
              <div className="b-field">
                <label className="b-label">Nama Panggilan — Pria</label>
                <input
                  className="b-input"
                  value={form.groomNick}
                  onChange={(e) => set("groomNick", e.target.value)}
                />
              </div>
              <div className="b-field">
                <label className="b-label">Nama Lengkap — Pria</label>
                <input
                  className="b-input"
                  value={form.groomName}
                  onChange={(e) => set("groomName", e.target.value)}
                />
              </div>
              <div className="b-field">
                <label className="b-label">Orang Tua — Pria</label>
                <textarea
                  className="b-textarea"
                  value={form.groomParents}
                  onChange={(e) => set("groomParents", e.target.value)}
                  placeholder="Putra dari Bapak … dan Ibu …"
                />
              </div>
              <div className="b-row">
                <div className="b-field">
                  <label className="b-label">Instagram</label>
                  <input
                    className="b-input"
                    value={form.groomInstagram}
                    onChange={(e) => set("groomInstagram", e.target.value)}
                    placeholder="username"
                  />
                </div>
                <div className="b-field">
                  <label className="b-label">Foto (URL)</label>
                  <input
                    className="b-input"
                    value={form.groomPhoto}
                    onChange={(e) => set("groomPhoto", e.target.value)}
                    placeholder="/img/… atau https://…"
                  />
                  <PhotoUpload disabled={busy || uploading} onBusy={setUploading} onUploaded={(url) => set("groomPhoto", url)} />
                  {form.groomPhoto ? <img src={form.groomPhoto} alt="Pratinjau foto mempelai pria" style={{ width: 120, height: 160, objectFit: "cover", borderRadius: 12, marginTop: ".75rem" }} /> : null}
                  {form.groomPhoto ? <button type="button" className="b-btn b-ghost" disabled={busy || uploading} onClick={() => set("groomPhoto", "")}>Hapus Foto</button> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teks */}
      <div className="panel">
        <div className="panel-head">
          <h2>Teks Undangan</h2>
        </div>
        <div className="panel-body">
          <div className="b-row">
            <div className="b-field">
              <label className="b-label">Salam Pembuka</label>
              <input
                className="b-input"
                value={form.openingSalam}
                onChange={(e) => set("openingSalam", e.target.value)}
                placeholder="Assalamu'alaikum…"
              />
            </div>
            <div className="b-field">
              <label className="b-label">Judul Halaman</label>
              <input className="b-input" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
          </div>
          <div className="b-field">
            <label className="b-label">Kata Pengantar</label>
            <textarea
              className="b-textarea"
              value={form.invitationText}
              onChange={(e) => set("invitationText", e.target.value)}
            />
          </div>
          <div className="b-row">
            <div className="b-field">
              <label className="b-label">Kutipan / Ayat</label>
              <textarea
                className="b-textarea"
                value={form.quoteText}
                onChange={(e) => set("quoteText", e.target.value)}
              />
            </div>
            <div className="b-field">
              <label className="b-label">Sumber Kutipan</label>
              <input
                className="b-input"
                value={form.quoteSource}
                onChange={(e) => set("quoteSource", e.target.value)}
                placeholder="QS. Ar-Rum: 21"
              />
            </div>
          </div>
          <div className="b-field">
            <label className="b-label">Kata Penutup</label>
            <textarea
              className="b-textarea"
              value={form.closingText}
              onChange={(e) => set("closingText", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Acara */}
      <div className="panel">
        <div className="panel-head">
          <h2>Tanggal &amp; Lokasi Acara</h2>
        </div>
        <div className="panel-body">
          <div className="b-row">
            <div className="b-field">
              <label className="b-label">Tanggal Utama</label>
              <input
                type="datetime-local"
                className="b-input"
                value={form.mainDate}
                onChange={(e) => set("mainDate", e.target.value)}
              />
              <p className="b-hint">Dipakai untuk countdown.</p>
            </div>
            <div className="b-field">
              <label className="b-label">Nama Venue</label>
              <input className="b-input" value={form.venueName} onChange={(e) => set("venueName", e.target.value)} />
            </div>
          </div>

          <div className="b-row">
            <div className="b-field">
              <label className="b-label">Akad — Mulai</label>
              <input
                type="datetime-local"
                className="b-input"
                value={form.akadAt}
                onChange={(e) => set("akadAt", e.target.value)}
              />
            </div>
            <div className="b-field">
              <label className="b-label">Akad — Selesai</label>
              <input
                type="datetime-local"
                className="b-input"
                value={form.akadEndAt}
                onChange={(e) => set("akadEndAt", e.target.value)}
              />
            </div>
          </div>

          <div className="b-row">
            <div className="b-field">
              <label className="b-label">Resepsi — Mulai</label>
              <input
                type="datetime-local"
                className="b-input"
                value={form.resepsiAt}
                onChange={(e) => set("resepsiAt", e.target.value)}
              />
            </div>
            <div className="b-field">
              <label className="b-label">Resepsi — Selesai</label>
              <input
                type="datetime-local"
                className="b-input"
                value={form.resepsiEndAt}
                onChange={(e) => set("resepsiEndAt", e.target.value)}
              />
            </div>
          </div>

          <div className="b-field">
            <label className="b-label">Alamat Venue</label>
            <textarea
              className="b-textarea"
              value={form.venueAddress}
              onChange={(e) => set("venueAddress", e.target.value)}
            />
          </div>
          <div className="b-field">
            <label className="b-label">Link Google Maps</label>
            <input
              className="b-input"
              value={form.mapsUrl}
              onChange={(e) => set("mapsUrl", e.target.value)}
              placeholder="https://maps.google.com/?q=…"
            />
          </div>
        </div>
      </div>

      {/* Gift */}
      <div className="panel">
        <div className="panel-head">
          <h2>Wedding Gift</h2>
        </div>
        <div className="panel-body">
          <div className="b-field">
            <label className="b-label">Kalimat Pengantar</label>
            <textarea className="b-textarea" value={form.giftText} onChange={(e) => set("giftText", e.target.value)} />
          </div>
          <div className="b-field">
            <label className="b-label">Alamat Kirim Kado</label>
            <textarea
              className="b-textarea"
              value={form.giftAddress}
              onChange={(e) => set("giftAddress", e.target.value)}
              placeholder="Kosongkan bila tidak ditampilkan"
            />
          </div>

          <label className="b-label">Rekening / E-wallet</label>
          {form.giftAccounts.map((g, i) => (
            <div key={i} className="b-row" style={{ marginBottom: ".5rem" }}>
              <input
                className="b-input"
                value={g.bank}
                onChange={(e) => {
                  const next = [...form.giftAccounts];
                  next[i] = { ...next[i], bank: e.target.value };
                  set("giftAccounts", next);
                }}
                placeholder="BCA / DANA"
              />
              <div style={{ display: "flex", gap: ".4rem" }}>
                <input
                  className="b-input"
                  value={g.number}
                  onChange={(e) => {
                    const next = [...form.giftAccounts];
                    next[i] = { ...next[i], number: e.target.value };
                    set("giftAccounts", next);
                  }}
                  placeholder="Nomor rekening"
                />
                <button
                  type="button"
                  className="b-btn b-danger b-mini"
                  onClick={() => set("giftAccounts", form.giftAccounts.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
              <input
                className="b-input"
                style={{ gridColumn: "1 / -1" }}
                value={g.holder}
                onChange={(e) => {
                  const next = [...form.giftAccounts];
                  next[i] = { ...next[i], holder: e.target.value };
                  set("giftAccounts", next);
                }}
                placeholder="Nama pemilik rekening"
              />
            </div>
          ))}
          <button
            type="button"
            className="b-btn b-ghost"
            onClick={() => set("giftAccounts", [...form.giftAccounts, { bank: "", number: "", holder: "" }])}
          >
            + Tambah Rekening
          </button>
        </div>
      </div>

      {/* Love story */}
      <div className="panel">
        <div className="panel-head">
          <h2>Love Story</h2>
        </div>
        <div className="panel-body">
          {form.storyItems.map((s, i) => (
            <div key={i} className="b-field" style={{ borderLeft: "2px solid #e2c574", paddingLeft: ".7rem" }}>
              <div className="b-row">
                <input
                  className="b-input"
                  value={s.title}
                  onChange={(e) => {
                    const next = [...form.storyItems];
                    next[i] = { ...next[i], title: e.target.value };
                    set("storyItems", next);
                  }}
                  placeholder="Judul"
                />
                <div style={{ display: "flex", gap: ".4rem" }}>
                  <input
                    className="b-input"
                    value={s.date}
                    onChange={(e) => {
                      const next = [...form.storyItems];
                      next[i] = { ...next[i], date: e.target.value };
                      set("storyItems", next);
                    }}
                    placeholder="Januari 2020"
                  />
                  <button
                    type="button"
                    className="b-btn b-danger b-mini"
                    onClick={() => set("storyItems", form.storyItems.filter((_, j) => j !== i))}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <textarea
                className="b-textarea"
                style={{ marginTop: ".4rem" }}
                value={s.text}
                onChange={(e) => {
                  const next = [...form.storyItems];
                  next[i] = { ...next[i], text: e.target.value };
                  set("storyItems", next);
                }}
                placeholder="Cerita singkat…"
              />
            </div>
          ))}
          <button
            type="button"
            className="b-btn b-ghost"
            onClick={() => set("storyItems", [...form.storyItems, { title: "", date: "", text: "" }])}
          >
            + Tambah Cerita
          </button>
        </div>
      </div>

      {/* Galeri & lain-lain */}
      <div className="panel">
        <div className="panel-head">
          <h2>Galeri, Musik &amp; Turut Mengundang</h2>
        </div>
        <div className="panel-body">
          <div className="b-field">
            <label className="b-label">Foto Galeri (satu URL per baris)</label>
            <textarea
              className="b-textarea"
              style={{ minHeight: 110 }}
              value={form.gallery.join("\n")}
              onChange={(e) =>
                set(
                  "gallery",
                  e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                )
              }
              placeholder={"/img/foto1.webp\n/img/foto2.webp"}
            />
            <PhotoUpload multiple remaining={Math.max(0, 40 - form.gallery.length)} disabled={busy || uploading} onBusy={setUploading}
              onUploaded={(url) => setForm((current) => ({ ...current, gallery: [...current.gallery, url] }))} />
            <p style={{ fontSize: ".85rem" }}>{form.gallery.length}/40 foto. Perubahan foto diterapkan setelah menekan Simpan Perubahan.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: ".75rem", marginTop: "1rem" }}>
              {form.gallery.map((url, index) => (
                <div key={`${index}-${url}`}>
                  <img src={url} alt={`Pratinjau galeri ${index + 1}`} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10 }} />
                  <button type="button" className="b-btn b-ghost" disabled={busy || uploading}
                    aria-label={`Hapus foto galeri ${index + 1}`}
                    onClick={() => setForm((current) => ({ ...current, gallery: current.gallery.filter((_, i) => i !== index) }))}>Hapus</button>
                </div>
              ))}
            </div>
          </div>

          <div className="b-row">
            <div className="b-field">
              <label className="b-label">URL Musik Latar</label>
              <input
                className="b-input"
                value={form.musicUrl}
                onChange={(e) => set("musicUrl", e.target.value)}
                placeholder="/audio/music.mp3 atau https://…"
              />
            </div>
            <div className="b-field">
              <label className="b-label">Judul Musik</label>
              <input className="b-input" value={form.musicTitle} onChange={(e) => set("musicTitle", e.target.value)} />
            </div>
          </div>

          <div className="b-field">
            <label className="b-label">Turut Mengundang (satu per baris)</label>
            <textarea
              className="b-textarea"
              value={form.invitedBy.join("\n")}
              onChange={(e) =>
                set(
                  "invitedBy",
                  e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                )
              }
            />
          </div>

          <div className="b-field">
            <label className="b-label">Slug Undangan</label>
            <input className="b-input" value={form.slug} readOnly style={{ opacity: 0.7 }} />
            <p className="b-hint">
              Link undangan: <code>/{form.slug}?to=slug-tamu</code>
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
        <button type="submit" className="b-btn b-primary" disabled={busy || uploading}>
          {busy ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
