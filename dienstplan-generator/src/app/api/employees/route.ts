import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeWeekdays, parseStoredWeekdays, serializeWeekdays } from "@/lib/weekdays";
import type { EmployeeDto } from "@/types";
import { EMPLOYEE_AREAS, EMPLOYMENT_TYPES } from "@/types";

const employeeSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben."),
  monthlyHours: z.number().int().positive().max(400),
  area: z.enum(EMPLOYEE_AREAS),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  availableWeekdays: z.array(z.number().int().min(0).max(6)).nonempty("Mindestens ein Wochentag ist erforderlich."),
  weekendAvailability: z.boolean()
});

const mapEmployee = (employee: any): EmployeeDto => ({
  id: employee.id,
  name: employee.name,
  monthlyHours: employee.monthlyHours,
  area: employee.area,
  employmentType: employee.employmentType,
  availableWeekdays: parseStoredWeekdays(employee.availableWeekdays),
  weekendAvailability: employee.weekendAvailability,
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

    const employee = await prisma.employee.create({
      data: {
        name: parsed.name,
        monthlyHours: parsed.monthlyHours,
        area: parsed.area,
        employmentType: parsed.employmentType,
        availableWeekdays: serializeWeekdays(availableWeekdays),
        weekendAvailability: parsed.weekendAvailability
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
