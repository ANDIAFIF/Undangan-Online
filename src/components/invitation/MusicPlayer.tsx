"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type MusicHandle = { play: () => void };

const MusicPlayer = forwardRef<MusicHandle, { src: string | null; shouldPlay: boolean }>(
  function MusicPlayer({ src, shouldPlay }, ref) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState(false);
    const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const musicSrc = src?.trim() || undefined;

    const play = (opening = false) => {
      const audio = audioRef.current;
      if (!audio || !musicSrc) return;
      if (startTimer.current) clearTimeout(startTimer.current);
      setError(false);
      if (audio.error) audio.load();
      // Invoke play synchronously inside the user's click, including on iOS.
      // Reference starts audible music 500ms after opening.
      audio.volume = opening ? 0 : 1;
      void audio.play().catch(() => { setPlaying(false); setError(true); });
      if (opening) startTimer.current = setTimeout(() => { audio.currentTime = 0; audio.volume = 1; }, 500);
    };
    useImperativeHandle(ref, () => ({ play: () => play(true) }));
    useEffect(() => () => { if (startTimer.current) clearTimeout(startTimer.current); }, []);

    return <>
      <audio ref={audioRef} src={musicSrc} loop preload="auto"
        onPlaying={() => { setPlaying(true); setError(false); }}
        onPause={() => setPlaying(false)} onError={() => { setPlaying(false); setError(true); }} />
      <button hidden={!shouldPlay || !musicSrc} type="button" className={`music-btn ${playing ? "playing" : ""}`}
        onClick={() => { if (audioRef.current?.paused) play(); else audioRef.current?.pause(); }}
        aria-pressed={playing} aria-label={playing ? "Jeda musik" : "Putar musik"}
        title={error ? "Musik belum diputar. Ketuk untuk mencoba lagi." : playing ? "Jeda musik" : "Putar musik"}>
        <svg className="disc" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity=".55" />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" />
          <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {shouldPlay && error ? <p className="music-notice" role="status">Ketuk tombol musik untuk memutar ulang.</p> : null}
    </>;
  }
);
export default MusicPlayer;
