import { z } from "zod";
import {
  EMPLOYEE_AREA,
  EMPLOYEE_AREAS,
  EMPLOYMENT_TYPE,
  EMPLOYMENT_TYPES,
  isEmployeeAreaValue,
  isEmploymentTypeValue,
  type EmployeeDto
} from "@/types";
import { CASHIER_SHIFT_IDS } from "./shifts";
import {
  normalizeFixedCashierSlots,
  parseStoredFixedCashierSlots,
  serializeFixedCashierSlots
} from "./fixed-shifts";
import { normalizeWeekdays, parseStoredWeekdays, serializeWeekdays } from "./weekdays";

const CASHIER_SHIFT_ID_ENUM = [
  CASHIER_SHIFT_IDS[0],
  ...CASHIER_SHIFT_IDS.slice(1)
] as [typeof CASHIER_SHIFT_IDS[number], ...typeof CASHIER_SHIFT_IDS[number][]];

export const employeeSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben."),
  monthlyHours: z.number().int().positive().max(400),
  area: z.enum(EMPLOYEE_AREAS),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  availableWeekdays: z
    .array(z.number().int().min(0).max(6))
    .nonempty("Mindestens ein Wochentag ist erforderlich."),
  weekendAvailability: z.boolean(),
  fixedCashierSlots: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        shiftId: z.enum(CASHIER_SHIFT_ID_ENUM)
      })
    )
    .optional()
});

export type EmployeePayload = z.infer<typeof employeeSchema>;

export const buildEmployeePersistenceData = (payload: EmployeePayload) => {
  const availableWeekdays = normalizeWeekdays(payload.availableWeekdays ?? []);
  const fixedCashierSlots =
    payload.area === EMPLOYEE_AREA.KASSE && payload.employmentType === EMPLOYMENT_TYPE.ANGESTELLTER
      ? normalizeFixedCashierSlots(payload.fixedCashierSlots ?? [])
      : [];

  return {
    name: payload.name,
    monthlyHours: payload.monthlyHours,
    area: payload.area,
    employmentType: payload.employmentType,
    availableWeekdays: serializeWeekdays(availableWeekdays),
    weekendAvailability: payload.weekendAvailability,
    fixedCashierSlots: serializeFixedCashierSlots(fixedCashierSlots)
  };
};

export const mapEmployee = (employee: any): EmployeeDto => ({
  id: employee.id,
  name: employee.name,
  monthlyHours: employee.monthlyHours,
  area: isEmployeeAreaValue(employee.area) ? employee.area : EMPLOYEE_AREA.KASSE,
  employmentType: isEmploymentTypeValue(employee.employmentType)
    ? employee.employmentType
    : EMPLOYMENT_TYPE.ANGESTELLTER,
  availableWeekdays: parseStoredWeekdays(employee.availableWeekdays),
  weekendAvailability: employee.weekendAvailability,
  fixedCashierSlots:
    employee.area === EMPLOYEE_AREA.KASSE && employee.employmentType === EMPLOYMENT_TYPE.ANGESTELLTER
      ? parseStoredFixedCashierSlots(employee.fixedCashierSlots)
      : [],
  createdAt: employee.createdAt instanceof Date ? employee.createdAt.toISOString() : employee.createdAt
});
