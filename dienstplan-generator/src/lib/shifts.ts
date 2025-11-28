import { EMPLOYEE_AREA, type EmployeeAreaValue } from "@/types";

type ShiftTemplateDefinition = {
  id: string;
  label: string;
  start: string;
  end: string;
  hours: number;
};

export const CASHIER_WEEKDAY_SHIFTS = [
  { id: "W-1", label: "Frühdienst", start: "06:00", end: "13:00", hours: 7 },
  { id: "W-2", label: "Mittelschicht", start: "13:00", end: "18:00", hours: 5 },
  { id: "W-3", label: "Spätdienst", start: "18:00", end: "22:00", hours: 4 }
] as const satisfies readonly ShiftTemplateDefinition[];

export const CASHIER_WEEKEND_SHIFTS = [
  { id: "WE-1", label: "Frühdienst", start: "07:00", end: "13:00", hours: 6 },
  { id: "WE-2", label: "Mittelschicht", start: "13:00", end: "18:00", hours: 5 },
  { id: "WE-3", label: "Spätdienst", start: "18:00", end: "22:00", hours: 4 }
] as const satisfies readonly ShiftTemplateDefinition[];

export type CashierShiftId =
  | (typeof CASHIER_WEEKDAY_SHIFTS)[number]["id"]
  | (typeof CASHIER_WEEKEND_SHIFTS)[number]["id"];

export interface ShiftTemplate {
  id: CashierShiftId;
  label: string;
  start: string;
  end: string;
  hours: number;
}

export const CASHIER_SHIFT_IDS = [
  ...CASHIER_WEEKDAY_SHIFTS.map((shift) => shift.id),
  ...CASHIER_WEEKEND_SHIFTS.map((shift) => shift.id)
] as const;

export const CASHIER_SHIFT_OPTIONS: Array<{ id: CashierShiftId; label: string }> = [
  { id: "W-1", label: "Frühdienst (Mo-Fr · 06:00-13:00)" },
  { id: "W-2", label: "Mittelschicht (Mo-Fr · 13:00-18:00)" },
  { id: "W-3", label: "Spätdienst (Mo-Fr · 18:00-22:00)" },
  { id: "WE-1", label: "Frühdienst (Wochenende/Feiertag · 07:00-13:00)" },
  { id: "WE-2", label: "Mittelschicht (Wochenende/Feiertag · 13:00-18:00)" },
  { id: "WE-3", label: "Spätdienst (Wochenende/Feiertag · 18:00-22:00)" }
];

export const AREA_LABELS: Record<Exclude<EmployeeAreaValue, typeof EMPLOYEE_AREA.KASSE>, string> = {
  [EMPLOYEE_AREA.BISTRO]: "Bistro-Einsatz",
  [EMPLOYEE_AREA.LAGER]: "Lager-Einsatz",
  [EMPLOYEE_AREA.WERKSTATT]: "Werkstatt-Einsatz"
};

export const NON_CASHIER_AREAS: Array<Exclude<EmployeeAreaValue, typeof EMPLOYEE_AREA.KASSE>> = [
  EMPLOYEE_AREA.BISTRO,
  EMPLOYEE_AREA.LAGER,
  EMPLOYEE_AREA.WERKSTATT
];

export interface AreaShiftTemplate {
  label: string;
  start: string | null;
  end: string | null;
  hours: number;
  closed?: boolean;
  note?: string;
}

export const getAreaShiftTemplate = (
  area: Exclude<EmployeeAreaValue, typeof EMPLOYEE_AREA.KASSE>,
  weekendOrHoliday: boolean
): AreaShiftTemplate => {
  if (area === EMPLOYEE_AREA.BISTRO) {
    return weekendOrHoliday
      ? { label: AREA_LABELS[area], start: "06:00", end: "08:00", hours: 2 }
      : { label: AREA_LABELS[area], start: "05:00", end: "07:00", hours: 2 };
  }

  if (area === EMPLOYEE_AREA.LAGER) {
    return { label: AREA_LABELS[area], start: "15:00", end: "17:00", hours: 2 };
  }

  if (area === EMPLOYEE_AREA.WERKSTATT) {
    if (weekendOrHoliday) {
      return {
        label: AREA_LABELS[area],
        start: null,
        end: null,
        hours: 0,
        closed: true,
        note: "Werkstatt ist am Wochenende/Feiertag geschlossen."
      };
    }
    return { label: AREA_LABELS[area], start: "15:00", end: "18:00", hours: 3 };
  }

  return { label: AREA_LABELS[area], start: null, end: null, hours: weekendOrHoliday ? 6 : 8 };
};

export const isCashierShiftId = (value: unknown): value is CashierShiftId => {
  return typeof value === "string" && (CASHIER_SHIFT_IDS as readonly string[]).includes(value);
};

export const getCashierShiftById = (id: CashierShiftId | string) => {
  return [...CASHIER_WEEKDAY_SHIFTS, ...CASHIER_WEEKEND_SHIFTS].find((shift) => shift.id === id);
};
