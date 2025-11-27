import { format } from "date-fns";
import { de } from "date-fns/locale";
import { EmployeeArea, EmploymentType } from "@prisma/client";
import { createHolidaySet, isNRWHoliday } from "./holidays";

const WEEKDAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"] as const;

interface ShiftTemplate {
  id: string;
  label: string;
  start: string;
  end: string;
  hours: number;
}

const WEEKDAY_SHIFTS: ShiftTemplate[] = [
  { id: "W-1", label: "Frühdienst", start: "06:00", end: "13:00", hours: 7 },
  { id: "W-2", label: "Mittelschicht", start: "13:00", end: "18:00", hours: 5 },
  { id: "W-3", label: "Spätdienst", start: "18:00", end: "22:00", hours: 4 }
];

const WEEKEND_SHIFTS: ShiftTemplate[] = [
  { id: "WE-1", label: "Frühdienst", start: "07:00", end: "13:00", hours: 6 },
  { id: "WE-2", label: "Mittelschicht", start: "13:00", end: "18:00", hours: 5 },
  { id: "WE-3", label: "Spätdienst", start: "18:00", end: "22:00", hours: 4 }
];

const AREA_LABELS: Record<Exclude<EmployeeArea, EmployeeArea.KASSE>, string> = {
  [EmployeeArea.BISTRO]: "Bistro-Tagesdienst",
  [EmployeeArea.LAGER]: "Lager-Einsatz",
  [EmployeeArea.WERKSTATT]: "Werkstatt-Einsatz"
};

const NON_CASHIER_AREAS: Array<Exclude<EmployeeArea, EmployeeArea.KASSE>> = [
  EmployeeArea.BISTRO,
  EmployeeArea.LAGER,
  EmployeeArea.WERKSTATT
];

const WORKDAY_AREA_HOURS = 8;
const WEEKEND_AREA_HOURS = 6;

export interface SchedulerEmployee {
  id: number;
  name: string;
  monthlyHours: number;
  area: EmployeeArea;
  employmentType: EmploymentType;
  availableWeekdays: number[]; // 0 = Sonntag ... 6 = Samstag
  weekendAvailability: boolean;
}

interface MutableEmployee extends SchedulerEmployee {
  remainingHours: number;
  lastCashierDay: number | null;
  lastAreaDay: number | null;
  assignedCashierShifts: number;
  assignedAreaShifts: number;
}

export type ShiftKind = "CASHIER" | "AREA";

export interface AssignedEmployee {
  id: number;
  name: string;
  employmentType: EmploymentType;
}

export interface ShiftAssignment {
  id: string;
  kind: ShiftKind;
  area: EmployeeArea;
  label: string;
  start: string | null;
  end: string | null;
  hours: number;
  employee?: AssignedEmployee;
  status: "ASSIGNED" | "OPEN" | "CLOSED";
  note?: string;
}

export interface ScheduleDay {
  dateISO: string;
  readableDate: string;
  weekdayIndex: number;
  weekdayName: string;
  type: "WORKDAY" | "WEEKEND" | "HOLIDAY";
  shifts: ShiftAssignment[];
}

export interface ScheduleSummary {
  totalCashierShifts: number;
  filledCashierShifts: number;
  totalAreaSlots: number;
  filledAreaSlots: number;
}

export interface GeneratedSchedule {
  monthKey: string;
  monthLabel: string;
  generatedAt: string;
  days: ScheduleDay[];
  summary: ScheduleSummary;
  warnings: string[];
}

export interface GenerateScheduleOptions {
  month?: string; // e.g. 2024-05
}

const formatISODate = (date: Date) => date.toISOString().split("T")[0];

const sanitizeWeekdays = (values: number[]): number[] => {
  const seen = new Set<number>();
  const normalized: number[] = [];
  values.forEach((value) => {
    const normalizedValue = ((value % 7) + 7) % 7;
    if (!seen.has(normalizedValue)) {
      seen.add(normalizedValue);
      normalized.push(normalizedValue);
    }
  });
  return normalized;
};

export function generateSchedule(
  employees: SchedulerEmployee[],
  options?: GenerateScheduleOptions
): GeneratedSchedule {
  const now = new Date();
  const target = resolveTargetMonth(options?.month, now);
  const monthKey = `${target.year}-${ `${target.monthIndex + 1}`.padStart(2, "0") }`;
  const monthLabel = format(new Date(target.year, target.monthIndex, 1), "LLLL yyyy", { locale: de });
  const holidaySet = createHolidaySet(target.year);

  const mutableEmployees: MutableEmployee[] = employees.map((employee) => ({
    ...employee,
    availableWeekdays: sanitizeWeekdays(employee.availableWeekdays ?? []),
    remainingHours: employee.monthlyHours,
    lastCashierDay: null,
    lastAreaDay: null,
    assignedCashierShifts: 0,
    assignedAreaShifts: 0
  }));

  const summary: ScheduleSummary = {
    totalCashierShifts: 0,
    filledCashierShifts: 0,
    totalAreaSlots: 0,
    filledAreaSlots: 0
  };

  const warnings: string[] = [];
  const days: ScheduleDay[] = [];

  const totalDays = daysInMonth(target.year, target.monthIndex);

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(Date.UTC(target.year, target.monthIndex, day));
    const isoDate = formatISODate(date);
    const weekdayIndex = date.getUTCDay();
    const weekdayName = WEEKDAY_NAMES[weekdayIndex];
    const weekend = weekdayIndex === 0 || weekdayIndex === 6;
    const holiday = isNRWHoliday(date, holidaySet);
    const weekendOrHoliday = weekend || holiday;
    const dayType: ScheduleDay["type"] = holiday ? "HOLIDAY" : weekend ? "WEEKEND" : "WORKDAY";
    const assignmentsToday = new Set<number>();

    const scheduleDay: ScheduleDay = {
      dateISO: isoDate,
      readableDate: format(date, "EEE, dd.MM.", { locale: de }),
      weekdayIndex,
      weekdayName,
      type: dayType,
      shifts: []
    };

    const cashierTemplates = weekendOrHoliday ? WEEKEND_SHIFTS : WEEKDAY_SHIFTS;

    cashierTemplates.forEach((template, index) => {
      summary.totalCashierShifts += 1;
      const selection = selectCashierEmployee(mutableEmployees, {
        dayNumber: day,
        weekdayIndex,
        shift: template,
        assignmentsToday,
        weekendOrHoliday
      });

      if (selection) {
        const { employee } = selection;
        scheduleDay.shifts.push({
          id: `${isoDate}-cashier-${template.id}`,
          kind: "CASHIER",
          area: EmployeeArea.KASSE,
          label: `Kasse ${template.label}`,
          start: template.start,
          end: template.end,
          hours: template.hours,
          employee: {
            id: employee.id,
            name: employee.name,
            employmentType: employee.employmentType
          },
          status: "ASSIGNED"
        });
        summary.filledCashierShifts += 1;
        assignmentsToday.add(employee.id);
        employee.remainingHours -= template.hours;
        employee.lastCashierDay = day;
        employee.assignedCashierShifts += 1;
      } else {
        const note = `Keine verfügbare Person für Kasse (${template.start}-${template.end}) am ${isoDate}`;
        warnings.push(note);
        scheduleDay.shifts.push({
          id: `${isoDate}-cashier-${template.id}`,
          kind: "CASHIER",
          area: EmployeeArea.KASSE,
          label: `Kasse ${template.label}`,
          start: template.start,
          end: template.end,
          hours: template.hours,
          status: "OPEN",
          note
        });
      }
    });

    NON_CASHIER_AREAS.forEach((areaKey) => {
      if (areaKey === EmployeeArea.WERKSTATT && weekendOrHoliday) {
        scheduleDay.shifts.push({
          id: `${isoDate}-${areaKey}-closed`,
          kind: "AREA",
          area: areaKey,
          label: AREA_LABELS[areaKey],
          start: null,
          end: null,
          hours: 0,
          status: "CLOSED",
          note: "Werkstatt ist am Wochenende/Feiertag geschlossen."
        });
        return;
      }

      const hasAreaEmployees = mutableEmployees.some((employee) => employee.area === areaKey);
      if (!hasAreaEmployees) {
        summary.totalAreaSlots += 1;
        const note = `Kein Personal für ${AREA_LABELS[areaKey]} angelegt.`;
        warnings.push(note);
        scheduleDay.shifts.push({
          id: `${isoDate}-${areaKey}-missing`,
          kind: "AREA",
          area: areaKey,
          label: AREA_LABELS[areaKey],
          start: null,
          end: null,
          hours: weekendOrHoliday ? WEEKEND_AREA_HOURS : WORKDAY_AREA_HOURS,
          status: "OPEN",
          note
        });
        return;
      }

      summary.totalAreaSlots += 1;
      const slotHours = weekendOrHoliday ? WEEKEND_AREA_HOURS : WORKDAY_AREA_HOURS;
      const selection = selectAreaEmployee(mutableEmployees, {
        dayNumber: day,
        weekdayIndex,
        assignmentsToday,
        weekendOrHoliday,
        slotHours,
        area: areaKey
      });

      if (selection) {
        const { employee } = selection;
        scheduleDay.shifts.push({
          id: `${isoDate}-${areaKey}`,
          kind: "AREA",
          area: areaKey,
          label: AREA_LABELS[areaKey],
          start: null,
          end: null,
          hours: slotHours,
          employee: {
            id: employee.id,
            name: employee.name,
            employmentType: employee.employmentType
          },
          status: "ASSIGNED"
        });
        summary.filledAreaSlots += 1;
        assignmentsToday.add(employee.id);
        employee.remainingHours -= slotHours;
        employee.lastAreaDay = day;
        employee.assignedAreaShifts += 1;
      } else {
        const reason = weekendOrHoliday
          ? `Keine freigegebenen Ressourcen für ${AREA_LABELS[areaKey]} am ${isoDate} (Wochenende/Feiertag).`
          : `Kein verfügbares Personal für ${AREA_LABELS[areaKey]} am ${isoDate}.`;
        warnings.push(reason);
        scheduleDay.shifts.push({
          id: `${isoDate}-${areaKey}`,
          kind: "AREA",
          area: areaKey,
          label: AREA_LABELS[areaKey],
          start: null,
          end: null,
          hours: slotHours,
          status: "OPEN",
          note: reason
        });
      }
    });

    days.push(scheduleDay);
  }

  if (!mutableEmployees.length) {
    warnings.push("Es sind keine Mitarbeitenden angelegt - Dienstplan enthält nur Platzhalter.");
  }

  return {
    monthKey,
    monthLabel,
    generatedAt: new Date().toISOString(),
    days,
    summary,
    warnings
  };
}

function resolveTargetMonth(month: string | undefined, fallback: Date) {
  if (!month) {
    return { year: fallback.getFullYear(), monthIndex: fallback.getMonth() };
  }
  const [yearPart, monthPart] = month.split("-");
  const parsedYear = Number(yearPart);
  const parsedMonth = Number(monthPart) - 1;

  if (Number.isNaN(parsedYear) || Number.isNaN(parsedMonth) || parsedMonth < 0 || parsedMonth > 11) {
    return { year: fallback.getFullYear(), monthIndex: fallback.getMonth() };
  }

  return { year: parsedYear, monthIndex: parsedMonth };
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

interface CashierSelectionContext {
  dayNumber: number;
  weekdayIndex: number;
  shift: ShiftTemplate;
  assignmentsToday: Set<number>;
  weekendOrHoliday: boolean;
}

function selectCashierEmployee(
  employees: MutableEmployee[],
  context: CashierSelectionContext
) {
  const relevant = employees.filter((employee) => employee.area === EmployeeArea.KASSE);

  let candidates = relevant.filter((employee) => {
    if (employee.remainingHours < context.shift.hours) {
      return false;
    }
    if (context.assignmentsToday.has(employee.id)) {
      return false;
    }
    if (context.weekendOrHoliday) {
      return employee.weekendAvailability;
    }
    return employee.availableWeekdays.includes(context.weekdayIndex);
  });

  if (!candidates.length) {
    return null;
  }

  const preferred = candidates.filter((employee) => {
    if (employee.employmentType !== EmploymentType.AUSHILFE) {
      return true;
    }
    if (employee.lastCashierDay === null) {
      return true;
    }
    return context.dayNumber - employee.lastCashierDay > 1;
  });

  const pool = preferred.length ? preferred : candidates;
  const sorted = [...pool].sort((a, b) => {
    const spacingA = a.lastCashierDay === null ? Number.POSITIVE_INFINITY : context.dayNumber - a.lastCashierDay;
    const spacingB = b.lastCashierDay === null ? Number.POSITIVE_INFINITY : context.dayNumber - b.lastCashierDay;

    if (a.employmentType === EmploymentType.AUSHILFE || b.employmentType === EmploymentType.AUSHILFE) {
      if (spacingA !== spacingB) {
        return spacingB - spacingA;
      }
    }

    if (a.remainingHours !== b.remainingHours) {
      return b.remainingHours - a.remainingHours;
    }

    if (a.assignedCashierShifts !== b.assignedCashierShifts) {
      return a.assignedCashierShifts - b.assignedCashierShifts;
    }

    return a.name.localeCompare(b.name, "de");
  });

  return { employee: sorted[0] };
}

interface AreaSelectionContext {
  dayNumber: number;
  weekdayIndex: number;
  assignmentsToday: Set<number>;
  weekendOrHoliday: boolean;
  slotHours: number;
  area: Exclude<EmployeeArea, EmployeeArea.KASSE>;
}

function selectAreaEmployee(
  employees: MutableEmployee[],
  context: AreaSelectionContext
) {
  const relevant = employees.filter((employee) => employee.area === context.area);
  if (!relevant.length) {
    return null;
  }

  let candidates = relevant.filter((employee) => {
    if (employee.remainingHours < context.slotHours) {
      return false;
    }
    if (context.assignmentsToday.has(employee.id)) {
      return false;
    }
    if (context.weekendOrHoliday) {
      return employee.weekendAvailability;
    }
    return employee.availableWeekdays.includes(context.weekdayIndex);
  });

  if (!candidates.length) {
    return null;
  }

  const sorted = [...candidates].sort((a, b) => {
    if (a.remainingHours !== b.remainingHours) {
      return b.remainingHours - a.remainingHours;
    }
    const lastA = a.lastAreaDay ?? -Infinity;
    const lastB = b.lastAreaDay ?? -Infinity;
    if (lastA !== lastB) {
      return lastA - lastB;
    }
    return a.name.localeCompare(b.name, "de");
  });

  return { employee: sorted[0] };
}
