"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  guestName: string | null;
  firstNick: string;
  secondNick: string;
  coverSalam?: string | null;
  coverDate: string;
  onOpen?: () => void;
};

export default function Cover({ guestName, firstNick, secondNick, coverDate, onOpen }: Props) {
  const [opening, setOpening] = useState(false);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    document.body.classList.add("locked");
    let secondFrame = 0;
    const frame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(() => setReady(true)); });
    return () => {
      cancelAnimationFrame(frame); cancelAnimationFrame(secondFrame);
      if (timer.current) clearTimeout(timer.current);
      document.body.classList.remove("locked");
    };
  }, []);
  const open = () => {
    if (opening) return;
    setOpening(true);
    window.scrollTo({ top: 0, behavior: "instant" });
    onOpen?.();
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1500;
    timer.current = setTimeout(() => {
      document.body.classList.remove("locked");
      document.getElementById("invitation-content")?.focus({ preventScroll: true });
    }, duration);
  };
  return (
    <div className={`cover ${ready ? "is-ready" : ""} ${opening ? "is-open" : ""}`} id="cover" aria-hidden={opening} inert={opening}>
      <div className="cover-inner">
        <p className="eyebrow cover-enter cover-enter-down">The Wedding Of</p>
        <h1 className="cover-names cover-enter">
          <span className="cover-name-line">{firstNick}</span>
          <span className="cover-amp">&amp;</span>
          <span className="cover-name-line">{secondNick}</span>
        </h1>
        <p className="cover-date cover-enter">{coverDate}</p>
        <div className="cover-guest cover-enter">
          <small>Kepada Yth. Bapak/Ibu/Sdr.</small>
          <strong>{guestName || "Tamu Undangan"}</strong>
        </div>
        <button type="button" className="btn-open cover-enter" onClick={open} disabled={opening}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          Buka Undangan
        </button>
      </div>
    </div>
  );
}
