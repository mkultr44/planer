import type { EmployeeAreaValue } from "./index";

export type ScheduleShiftKind = "CASHIER" | "AREA";
export type ScheduleShiftStatus = "ASSIGNED" | "OPEN" | "CLOSED";

export interface ShiftAssignmentDto {
  id: string;
  kind: ScheduleShiftKind;
  area: EmployeeAreaValue;
  label: string;
  start: string | null;
  end: string | null;
  hours: number;
  employee?: {
    id: number;
    name: string;
    employmentType: "ANGESTELLTER" | "AUSHILFE";
  };
  status: ScheduleShiftStatus;
  note?: string;
}

export interface ScheduleDayDto {
  dateISO: string;
  readableDate: string;
  weekdayIndex: number;
  weekdayName: string;
  type: "WORKDAY" | "WEEKEND" | "HOLIDAY";
  shifts: ShiftAssignmentDto[];
}

export interface ScheduleSummaryDto {
  totalCashierShifts: number;
  filledCashierShifts: number;
  totalAreaSlots: number;
  filledAreaSlots: number;
}

export interface GeneratedScheduleDto {
  monthKey: string;
  monthLabel: string;
  generatedAt: string;
  days: ScheduleDayDto[];
  summary: ScheduleSummaryDto;
  warnings: string[];
}
