"use client";

import { useId, useState } from "react";

export default function PhotoUpload({ onUploaded, onBusy, disabled, multiple = false, remaining = 1 }: {
  onUploaded: (url: string) => void;
  onBusy: (busy: boolean) => void;
  disabled: boolean;
  multiple?: boolean;
  remaining?: number;
}) {
  const id = useId();
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(files: File[]) {
    if (!files.length) return;
    if (files.length > remaining) {
      setMessage(multiple ? `Galeri maksimal 40 foto. Anda masih dapat menambahkan ${remaining} foto.` : "Pilih satu foto saja.");
      return;
    }
    setUploading(true);
    onBusy(true);
    let completed = 0;
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: maksimal 10 MB per foto.`);
        setMessage(`Mengupload foto ${completed + 1} dari ${files.length}…`);
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/uploads", { method: "POST", body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || typeof data.url !== "string") throw new Error(data.error || "Upload gagal. Silakan coba lagi.");
        onUploaded(data.url);
        completed++;
      }
      setMessage(`${completed} foto berhasil diupload. Klik Simpan Perubahan untuk menampilkannya di undangan.`);
    } catch (error) {
      setMessage(`${completed ? `${completed} foto sudah diupload. ` : ""}${error instanceof Error ? error.message : "Koneksi bermasalah."}`);
    } finally {
      setUploading(false);
      onBusy(false);
    }
  }

  return (
    <div style={{ marginTop: ".75rem" }}>
      <label className="b-label" htmlFor={id}>{multiple ? "Upload Foto Galeri" : "Upload Foto dari Perangkat"}</label>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple}
        disabled={disabled || uploading} style={{ width: "100%", fontSize: ".85rem" }}
        onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ""; void upload(files); }} />
      <p style={{ fontSize: ".8rem", marginTop: ".5rem" }}>JPG, PNG, atau WebP · maksimal 10 MB per foto.</p>
      <p role="status" style={{ fontSize: ".85rem", marginTop: ".5rem" }}>{message}</p>
    </div>
  );
}
