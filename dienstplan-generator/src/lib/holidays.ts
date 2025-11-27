import { addDays } from "date-fns";

const formatISODate = (date: Date) => date.toISOString().split("T")[0];

function calculateEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month, day));
}

export function getNRWHolidays(year: number): string[] {
  const easterSunday = calculateEasterSunday(year);

  const movable = [
    addDays(easterSunday, -2), // Karfreitag
    addDays(easterSunday, 1), // Ostermontag
    addDays(easterSunday, 39), // Christi Himmelfahrt
    addDays(easterSunday, 50), // Pfingstmontag
    addDays(easterSunday, 60) // Fronleichnam
  ];

  const fixed = [
    new Date(Date.UTC(year, 0, 1)), // Neujahr
    new Date(Date.UTC(year, 4, 1)), // Tag der Arbeit
    new Date(Date.UTC(year, 9, 3)), // Tag der Deutschen Einheit
    new Date(Date.UTC(year, 10, 1)), // Allerheiligen
    new Date(Date.UTC(year, 11, 25)), // 1. Weihnachtstag
    new Date(Date.UTC(year, 11, 26)) // 2. Weihnachtstag
  ];

  const holidays = [...movable, ...fixed].map(formatISODate);
  return Array.from(new Set(holidays));
}

export function createHolidaySet(year: number): Set<string> {
  return new Set(getNRWHolidays(year));
}

export function isNRWHoliday(date: Date, holidaySet: Set<string>): boolean {
  return holidaySet.has(formatISODate(date));
}
