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
