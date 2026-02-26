// All time operations use UTC server time ONLY

export function nowUTC(): Date {
  return new Date();
}

export function toUTC(dateStr: string): Date {
  return new Date(dateStr);
}

export function isOverlapping(
  newStart: Date,
  newEnd: Date,
  existingStart: Date,
  existingEnd: Date
): boolean {
  return existingStart <= newEnd && existingEnd >= newStart;
}

export function isLate(endDate: Date, returnDate: Date | null): boolean {
  if (returnDate) return false;
  return nowUTC() > endDate;
}

export function isActiveNow(startDate: Date, endDate: Date, returnDate: Date | null): boolean {
  if (returnDate) return false;
  const now = nowUTC();
  return now >= startDate && now <= endDate;
}

export function isUpcoming(startDate: Date): boolean {
  return startDate > nowUTC();
}
