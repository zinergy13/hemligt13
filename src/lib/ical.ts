// Minimal iCalendar helpers (isomorphic) - build & parse VEVENT date ranges.
// Compatible with Airbnb / Booking.com / VRBO / Google Calendar exports.

const CRLF = "\r\n";

function foldLine(line: string): string {
  // RFC 5545 §3.1: lines SHOULD NOT be longer than 75 octets. Fold with CRLF + space.
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    parts.push((i === 0 ? "" : " ") + line.slice(i, i + 74));
    i += 74;
  }
  return parts.join(CRLF);
}

function escapeText(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function toDateStamp(d: Date): string {
  const y = d.getUTCFullYear().toString().padStart(4, "0");
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}${m}${day}`;
}

function toIcsDate(isoDate: string): string {
  // isoDate is YYYY-MM-DD
  return isoDate.replaceAll("-", "");
}

function nowStamp(): string {
  const d = new Date();
  return (
    toDateStamp(d) +
    "T" +
    d.getUTCHours().toString().padStart(2, "0") +
    d.getUTCMinutes().toString().padStart(2, "0") +
    d.getUTCSeconds().toString().padStart(2, "0") +
    "Z"
  );
}

export type IcsEvent = {
  uid: string;
  /** Inclusive check-in date, YYYY-MM-DD */
  checkIn: string;
  /** Exclusive check-out date, YYYY-MM-DD (iCal DTEND for VALUE=DATE is exclusive) */
  checkOut: string;
  summary?: string;
  description?: string;
};

export function buildIcs(calendarName: string, events: IcsEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fjallportalen//Availability//SV",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(calendarName)}`),
  ];
  const stamp = nowStamp();
  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${e.uid}`));
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(e.checkIn)}`);
    lines.push(`DTEND;VALUE=DATE:${toIcsDate(e.checkOut)}`);
    if (e.summary) lines.push(foldLine(`SUMMARY:${escapeText(e.summary)}`));
    if (e.description) lines.push(foldLine(`DESCRIPTION:${escapeText(e.description)}`));
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join(CRLF) + CRLF;
}

/** Parse an ICS payload and return each VEVENT's key date fields. */
export function parseIcs(payload: string): IcsEvent[] {
  // Unfold: RFC 5545 line continuations start with a space or tab after CRLF.
  const unfolded = payload.replace(/\r?\n[ \t]/g, "");
  const rawLines = unfolded.split(/\r?\n/);

  const events: IcsEvent[] = [];
  let cur: Partial<IcsEvent> | null = null;

  for (const line of rawLines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur && cur.checkIn && cur.checkOut) {
        events.push({
          uid: cur.uid ?? `${cur.checkIn}-${cur.checkOut}`,
          checkIn: cur.checkIn,
          checkOut: cur.checkOut,
          summary: cur.summary,
          description: cur.description,
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const nameWithParams = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const name = nameWithParams.split(";")[0].toUpperCase();

    if (name === "UID") cur.uid = value.trim();
    else if (name === "SUMMARY") cur.summary = unescapeText(value);
    else if (name === "DESCRIPTION") cur.description = unescapeText(value);
    else if (name === "DTSTART") cur.checkIn = parseIcsDate(value);
    else if (name === "DTEND") cur.checkOut = parseIcsDate(value);
  }
  return events;
}

function unescapeText(v: string): string {
  return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function parseIcsDate(raw: string): string {
  // Accepts "20260215", "20260215T140000Z", "20260215T140000"
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);
  if (digits.length !== 8) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}