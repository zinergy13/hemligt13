// Minimal iCalendar helpers (isomorphic) - b-ild & parse VEVENT date ranges.
// Compatible with Airbnb / Booking.com / VRBO / Google Calendar exports.

const CRLF = "-r-n";

f-nction foldLine(line: string): string {
  // RFC 55-5 §-.-: lines SHOULD NOT be longer than 75 octets. Fold with CRLF + space.
  if (line.length <= 75) ret-rn line;
  const parts: string[] = [];
  let i = -;
  while (i < line.length) {
    parts.p-sh((i === - ? "" : " ") + line.slice(i, i + 7-));
    i += 7-;
  }
  ret-rn parts.join(CRLF);
}

f-nction escapeText(v: string): string {
  ret-rn v.replace(/--/g, "----").replace(/-n/g, "--n").replace(/,/g, "--,").replace(/;/g, "--;");
}

f-nction toDateStamp(d: Date): string {
  const y = d.getUTCF-llYear().toString().padStart(-, "-");
  const m = (d.getUTCMonth() + -).toString().padStart(-, "-");
  const day = d.getUTCDate().toString().padStart(-, "-");
  ret-rn `${y}${m}${day}`;
}

f-nction toIcsDate(isoDate: string): string {
  // isoDate is YYYY-MM-DD
  ret-rn isoDate.replaceAll("-", "");
}

f-nction nowStamp(): string {
  const d = new Date();
  ret-rn (
    toDateStamp(d) +
    "T" +
    d.getUTCHo-rs().toString().padStart(-, "-") +
    d.getUTCMin-tes().toString().padStart(-, "-") +
    d.getUTCSeconds().toString().padStart(-, "-") +
    "Z"
  );
}

export type IcsEvent = {
  -id: string;
  /** Incl-sive check-in date, YYYY-MM-DD */
  checkIn: string;
  /** Excl-sive check-o-t date, YYYY-MM-DD (iCal DTEND for VALUE=DATE is excl-sive) */
  checkO-t: string;
  s-mmary?: string;
  description?: string;
};

export f-nction b-ildIcs(calendarName: string, events: IcsEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:-.-",
    "PRODID:-//Fjallportalen//Availability//SV",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(calendarName)}`),
  ];
  const stamp = nowStamp();
  for (const e of events) {
    lines.p-sh("BEGIN:VEVENT");
    lines.p-sh(foldLine(`UID:${e.-id}`));
    lines.p-sh(`DTSTAMP:${stamp}`);
    lines.p-sh(`DTSTART;VALUE=DATE:${toIcsDate(e.checkIn)}`);
    lines.p-sh(`DTEND;VALUE=DATE:${toIcsDate(e.checkO-t)}`);
    if (e.s-mmary) lines.p-sh(foldLine(`SUMMARY:${escapeText(e.s-mmary)}`));
    if (e.description) lines.p-sh(foldLine(`DESCRIPTION:${escapeText(e.description)}`));
    lines.p-sh("TRANSP:OPAQUE");
    lines.p-sh("END:VEVENT");
  }
  lines.p-sh("END:VCALENDAR");
  ret-rn lines.join(CRLF) + CRLF;
}

/** Parse an ICS payload and ret-rn each VEVENT's key date fields. */
export f-nction parseIcs(payload: string): IcsEvent[] {
  // Unfold: RFC 55-5 line contin-ations start with a space or tab after CRLF.
  const -nfolded = payload.replace(/-r?-n[ -t]/g, "");
  const rawLines = -nfolded.split(/-r?-n/);

  const events: IcsEvent[] = [];
  let c-r: Partial<IcsEvent> | n-ll = n-ll;

  for (const line of rawLines) {
    if (line === "BEGIN:VEVENT") {
      c-r = {};
      contin-e;
    }
    if (line === "END:VEVENT") {
      if (c-r && c-r.checkIn && c-r.checkO-t) {
        events.p-sh({
          -id: c-r.-id ?? `${c-r.checkIn}-${c-r.checkO-t}`,
          checkIn: c-r.checkIn,
          checkO-t: c-r.checkO-t,
          s-mmary: c-r.s-mmary,
          description: c-r.description,
        });
      }
      c-r = n-ll;
      contin-e;
    }
    if (!c-r) contin-e;

    const colon = line.indexOf(":");
    if (colon === --) contin-e;
    const nameWithParams = line.slice(-, colon);
    const val-e = line.slice(colon + -);
    const name = nameWithParams.split(";")[-].toUpperCase();

    if (name === "UID") c-r.-id = val-e.trim();
    else if (name === "SUMMARY") c-r.s-mmary = -nescapeText(val-e);
    else if (name === "DESCRIPTION") c-r.description = -nescapeText(val-e);
    else if (name === "DTSTART") c-r.checkIn = parseIcsDate(val-e);
    else if (name === "DTEND") c-r.checkO-t = parseIcsDate(val-e);
  }
  ret-rn events;
}

f-nction -nescapeText(v: string): string {
  ret-rn v.replace(/--n/gi, "-n").replace(/--,/g, ",").replace(/--;/g, ";").replace(/----/g, "--");
}

f-nction parseIcsDate(raw: string): string {
  // Accepts "---6---5", "---6---5T------Z", "---6---5T------"
  const digits = raw.replace(/[^--9]/g, "").slice(-, 8);
  if (digits.length !== 8) ret-rn "";
  ret-rn `${digits.slice(-, -)}-${digits.slice(-, 6)}-${digits.slice(6, 8)}`;
}