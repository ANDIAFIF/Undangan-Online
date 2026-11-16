type IcsEvent = {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
};

function toIcsDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
  );
}

function escape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Buat file .ics sederhana (RFC 5545) untuk dua acara. */
export function buildIcs(events: IcsEvent[]): string {
  const now = toIcsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Undangan Digital//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  events.forEach((e, i) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${Date.now()}-${i}@undangan`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDate(e.start)}`,
      `DTEND:${toIcsDate(e.end)}`,
      `SUMMARY:${escape(e.title)}`,
      e.description ? `DESCRIPTION:${escape(e.description)}` : "DESCRIPTION:",
      e.location ? `LOCATION:${escape(e.location)}` : "LOCATION:",
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
