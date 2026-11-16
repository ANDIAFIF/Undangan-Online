"use client";

import { useEffect, useRef, useState } from "react";
import { useInvitationOpened } from "./InvitationState";

export default function Reveal({ children, delay = 0, className = "", variant = "slide-up" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: "slide-up" | "slide-down" | "zoom-in" | "zoom-out";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const opened = useInvitationOpened();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!opened) return;
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    // Same trigger as the reference: element top < viewport height - 100px.
    // Reset when scrolling back below the threshold so the entrance can replay.
    const update = () => {
      frame = 0;
      setVisible(el.getBoundingClientRect().top < window.innerHeight - 100);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [opened]);

  return <div ref={ref} className={`reveal reveal--${variant} ${visible ? "is-visible" : ""} ${className}`}
    style={delay ? { transitionDelay: `${delay}ms` } : undefined}>{children}</div>;
}
