type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getDateParts(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function getUtcStartForParts(parts: DateParts, timeZone: string) {
  const targetMs = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0);
  let candidateMs = targetMs;

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = getDateParts(new Date(candidateMs), timeZone);
    const actualMs = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    candidateMs += targetMs - actualMs;
  }

  return new Date(candidateMs);
}

export function getZonedDayStart(date: Date, timeZone: string) {
  return getUtcStartForParts(getDateParts(date, timeZone), timeZone);
}

export function getZonedDaysAgoStart(date: Date, timeZone: string, days: number) {
  const parts = getDateParts(date, timeZone);
  const calendarDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  calendarDate.setUTCDate(calendarDate.getUTCDate() - days);

  return getUtcStartForParts(
    {
      year: calendarDate.getUTCFullYear(),
      month: calendarDate.getUTCMonth() + 1,
      day: calendarDate.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone,
  );
}

// Start of a calendar date ("YYYY-MM-DD") in the given timezone, as a UTC instant.
export function getZonedDateStart(dateKey: string, timeZone: string, addDays = 0) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  calendarDate.setUTCDate(calendarDate.getUTCDate() + addDays);

  return getUtcStartForParts(
    {
      year: calendarDate.getUTCFullYear(),
      month: calendarDate.getUTCMonth() + 1,
      day: calendarDate.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone,
  );
}

// Formats a UTC instant as local wall-clock time ("YYYY-MM-DD HH:mm") in the given timezone.
export function formatZonedDateTime(date: Date, timeZone: string) {
  const { year, month, day, hour, minute } = getDateParts(date, timeZone);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}`;
}

export function getDeviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

export function isValidTimezone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

// Today's calendar date ("YYYY-MM-DD") in the given timezone.
export function getZonedTodayKey(timeZone: string | null | undefined, now = new Date()) {
  const zone = timeZone && isValidTimezone(timeZone) ? timeZone : "UTC";
  return formatZonedDateTime(now, zone).slice(0, 10);
}
