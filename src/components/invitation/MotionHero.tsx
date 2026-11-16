"use client";
import { useInvitationOpened } from "./InvitationState";
export default function MotionHero({ firstNick, secondNick, date }: { firstNick: string; secondNick: string; date: string }) {
  const opened = useInvitationOpened();
  return <section className="motion-hero" id="beranda" aria-label="Pembukaan undangan">
    <div className="opening-poster is-visible" aria-hidden="true" />
    <div className={`opening-titles ${opened ? "is-visible" : ""}`} aria-hidden={!opened} inert={!opened}>
      <p className="opening-eyebrow">The Wedding Of</p>
      <p className="opening-names">{firstNick}<br />&amp;<br />{secondNick}</p>
      <p className="opening-date">{date}</p>
      <a className="opening-scroll" href="#mempelai" aria-label="Gulir ke kedua mempelai"><span /><span /></a>
    </div>
  </section>;
}
