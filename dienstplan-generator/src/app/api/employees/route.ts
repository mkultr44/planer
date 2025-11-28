import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeFixedCashierSlots, parseStoredFixedCashierSlots, serializeFixedCashierSlots } from "@/lib/fixed-shifts";
import { CASHIER_SHIFT_IDS } from "@/lib/shifts";
import { normalizeWeekdays, parseStoredWeekdays, serializeWeekdays } from "@/lib/weekdays";
import type { EmployeeDto } from "@/types";
import {
  EMPLOYEE_AREA,
  EMPLOYEE_AREAS,
  EMPLOYMENT_TYPE,
  EMPLOYMENT_TYPES,
  isEmployeeAreaValue,
  isEmploymentTypeValue
} from "@/types";

const employeeSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben."),
  monthlyHours: z.number().int().positive().max(400),
  area: z.enum(EMPLOYEE_AREAS),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  availableWeekdays: z.array(z.number().int().min(0).max(6)).nonempty("Mindestens ein Wochentag ist erforderlich."),
  weekendAvailability: z.boolean(),
  fixedCashierSlots: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        shiftId: z.enum(CASHIER_SHIFT_IDS)
      })
    )
    .optional()
});

const mapEmployee = (employee: any): EmployeeDto => ({
  id: employee.id,
  name: employee.name,
  monthlyHours: employee.monthlyHours,
  area: isEmployeeAreaValue(employee.area) ? employee.area : EMPLOYEE_AREA.KASSE,
  employmentType: isEmploymentTypeValue(employee.employmentType) ? employee.employmentType : EMPLOYMENT_TYPE.ANGESTELLTER,
  availableWeekdays: parseStoredWeekdays(employee.availableWeekdays),
  weekendAvailability: employee.weekendAvailability,
  fixedCashierSlots:
    employee.area === EMPLOYEE_AREA.KASSE && employee.employmentType === EMPLOYMENT_TYPE.ANGESTELLTER
      ? parseStoredFixedCashierSlots(employee.fixedCashierSlots)
      : [],
  createdAt: employee.createdAt instanceof Date ? employee.createdAt.toISOString() : employee.createdAt
});

export async function GET() {
  const employees = await prisma.employee.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: employees.map(mapEmployee) });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = employeeSchema.parse(payload);
    const availableWeekdays = normalizeWeekdays(parsed.availableWeekdays);
    const fixedCashierSlots =
      parsed.area === EMPLOYEE_AREA.KASSE && parsed.employmentType === EMPLOYMENT_TYPE.ANGESTELLTER
        ? normalizeFixedCashierSlots(parsed.fixedCashierSlots ?? [])
        : [];

    const employee = await prisma.employee.create({
      data: {
        name: parsed.name,
        monthlyHours: parsed.monthlyHours,
        area: parsed.area,
        employmentType: parsed.employmentType,
        availableWeekdays: serializeWeekdays(availableWeekdays),
        weekendAvailability: parsed.weekendAvailability,
        fixedCashierSlots: serializeFixedCashierSlots(fixedCashierSlots)
      }
    });

    return NextResponse.json({ data: mapEmployee(employee) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0]?.message ?? "Ungültige Eingabe" }, { status: 422 });
    }
    console.error("Fehler beim Speichern", error);
    return NextResponse.json({ message: "Speichern fehlgeschlagen" }, { status: 500 });
  }
}
