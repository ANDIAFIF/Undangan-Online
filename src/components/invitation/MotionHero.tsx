"use client";

import { useEffect, useRef, useState } from "react";
import { useInvitationOpened } from "./InvitationState";

/** Original theme video; reveal text at media time 9s, not a wall-clock timer. */
export default function MotionHero({ firstNick, secondNick, date }: {
  firstNick: string; secondNick: string; date: string;
}) {
  const opened = useInvitationOpened();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [textVisible, setTextVisible] = useState(false);
  const [finished, setFinished] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!opened) return;
    const video = videoRef.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let fallback: ReturnType<typeof setTimeout>;
    const showPoster = () => { video.pause(); setTextVisible(true); setFinished(true); };
    if (motion.matches || failed) { showPoster(); return; }
    const onMotion = () => { if (motion.matches) showPoster(); };
    motion.addEventListener("change", onMotion);
    // A broken or indefinitely stalled stream must not hide the invitation text.
    fallback = setTimeout(() => { if (video.currentTime < 9) showPoster(); }, 15000);
    void video.play().catch(showPoster);
    return () => { clearTimeout(fallback); motion.removeEventListener("change", onMotion); video.pause(); };
  }, [opened, failed]);

  return (
    <section className="motion-hero" id="beranda" aria-label="Pembukaan undangan">
      <video ref={videoRef} className="opening-video" src="/video/bugis-opening.mp4"
        poster="/img/theme/bugishijau.jpeg" muted playsInline preload="auto" aria-hidden="true"
        onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 9) setTextVisible(true); }}
        onEnded={() => { setTextVisible(true); setFinished(true); }}
        onError={() => setFailed(true)} />
      <div className={`opening-poster ${finished ? "is-visible" : ""}`} aria-hidden="true" />
      <div className={`opening-titles ${textVisible ? "is-visible" : ""}`} aria-hidden={!textVisible} inert={!textVisible}>
        <p className="opening-eyebrow">The Wedding Of</p>
        <p className="opening-names">{firstNick}<br />&amp;<br />{secondNick}</p>
        <p className="opening-date">{date}</p>
        <a className="opening-scroll" href="#mempelai" aria-label="Gulir ke kedua mempelai">
          <span /><span />
        </a>
      </div>
    </section>
  );
}
