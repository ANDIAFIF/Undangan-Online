"use client";

import { useEffect, useId, useState } from "react";

function SelectedPhoto({ file, onRemove, disabled }: { file: File; onRemove: () => void; disabled: boolean }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);

  return <div style={{ minWidth: 0 }}>
    {url && <img src={url} alt="" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />}
    <p style={{ overflowWrap: "anywhere", fontSize: ".8rem" }}>{file.name}</p>
    <button type="button" className="b-btn b-ghost" disabled={disabled} onClick={onRemove}
      aria-label={`Lepas ${file.name} dari pilihan upload`}>Lepas</button>
  </div>;
}

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
  const [selected, setSelected] = useState<File[]>([]);

  function choose(files: File[]) {
    if (!files.length) return;
    setMessage("");
    if (!multiple) {
      void upload(files);
      return;
    }
    setSelected(files);
  }

  async function upload(files: File[]) {
    if (!files.length) return;
    if (files.length > remaining) {
      setMessage(multiple ? `Galeri maksimal 40 foto. Anda masih dapat menambahkan ${remaining} foto.` : "Pilih satu foto saja.");
      return;
    }
    const oversized = files.find(file => file.size > 10 * 1024 * 1024);
    if (oversized) {
      setMessage(`${oversized.name}: maksimal 10 MB per foto.`);
      return;
    }
    setUploading(true);
    onBusy(true);
    let completed = 0;
    try {
      for (const file of files) {
        setMessage(`Mengupload foto ${completed + 1} dari ${files.length}…`);
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/uploads", { method: "POST", body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || typeof data.url !== "string") throw new Error(data.error || "Upload gagal. Silakan coba lagi.");
        onUploaded(data.url);
        completed++;
        if (multiple) setSelected(files.slice(completed));
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
        onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ""; choose(files); }} />
      <p style={{ fontSize: ".8rem", marginTop: ".5rem" }}>JPG, PNG, atau WebP · maksimal 10 MB per foto.</p>
      {multiple && selected.length > 0 && (
        <div style={{ marginTop: ".75rem" }}>
          <p>Periksa {selected.length} foto sebelum upload.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: ".75rem" }}>
            {selected.map((file, index) => (
              <SelectedPhoto key={`${file.name}-${file.lastModified}-${index}`} file={file} disabled={disabled || uploading}
                onRemove={() => { setSelected(files => files.filter((_, i) => i !== index)); setMessage(""); }} />
            ))}
          </div>
          {selected.length > remaining && <p role="status">Tersedia {remaining} slot. Lepas foto yang berlebih.</p>}
          <div className="toolbar" style={{ marginTop: ".75rem" }}>
            <button type="button" className="b-btn b-primary" disabled={disabled || uploading || selected.length > remaining}
              onClick={() => void upload(selected)}>Upload {selected.length} foto</button>
            <button type="button" className="b-btn b-ghost" disabled={disabled || uploading}
              onClick={() => { setSelected([]); setMessage(""); }}>Batalkan pilihan</button>
          </div>
        </div>
      )}
      <p role="status" style={{ fontSize: ".85rem", marginTop: ".5rem" }}>{message}</p>
    </div>
  );
}
