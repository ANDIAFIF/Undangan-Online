"use client";

import { useEffect, useState } from "react";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function diffTo(target: number): Parts {
  const total = Math.max(0, Math.floor((target - Date.now()) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export default function Countdown({ dateISO, light = false }: { dateISO: string; light?: boolean }) {
  const target = new Date(dateISO).getTime();
  const [parts, setParts] = useState<Parts | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isNaN(target)) return;
    const tick = () => {
      const next = diffTo(target);
      setParts(next);
      if (next.days + next.hours + next.minutes + next.seconds === 0) setDone(true);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (isNaN(target) || done) return null;

  const cells: [keyof Parts, string][] = [
    ["days", "Hari"],
    ["hours", "Jam"],
    ["minutes", "Menit"],
    ["seconds", "Detik"],
  ];

  return (
    <div className={`countdown ${light ? "section--light" : ""}`} suppressHydrationWarning>
      {cells.map(([key, label]) => (
        <div className="cd-item" key={key}>
          <div className="cd-num">{parts ? String(parts[key]).padStart(2, "0") : "--"}</div>
          <div className="cd-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
