"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

const PLACEHOLDERS = [
  "/img/placeholder-1.svg",
  "/img/placeholder-2.svg",
  "/img/placeholder-3.svg",
  "/img/placeholder-4.svg",
  "/img/placeholder-5.svg",
  "/img/placeholder-6.svg",
];

export default function Gallery({ images }: { images: string[] }) {
  const list = images.length ? images : PLACEHOLDERS;
  const [index, setIndex] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(() => setIndex((i) => (i === null ? i : (i + 1) % list.length)), [list.length]);
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + list.length) % list.length)),
    [list.length],
  );

  useEffect(() => {
    if (index === null) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>("button");
        if (buttons?.length) {
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey, true);
    document.body.classList.add("locked");
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.classList.remove("locked");
      previousFocus?.focus();
    };
  }, [index, close, next, prev]);

  return (
    <>
      <div ref={gridRef} className="gallery-grid">
        {list.map((src, i) => (
          <button
            type="button"
            className="gallery-item"
            key={`${src}-${i}`}
            onClick={() => setIndex(i)}
            aria-label={`Buka foto ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Foto ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {index !== null ? createPortal(
        <div ref={dialogRef} className="lightbox" onClick={close} role="dialog" aria-modal="true" aria-label={`Foto ${index + 1} dari ${list.length}`}>
          <button ref={closeRef} type="button" className="lightbox-close" onClick={close} aria-label="Tutup">
            ✕
          </button>
          <button
            type="button"
            className="lightbox-nav prev"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Sebelumnya"
          >
            ‹
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={list[index]} alt={`Foto ${index + 1}`} onClick={(e) => e.stopPropagation()} />
          <button
            type="button"
            className="lightbox-nav next"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Berikutnya"
          >
            ›
          </button>
        </div>, gridRef.current?.closest("dialog") ?? document.body
      ) : null}
    </>
  );
}
