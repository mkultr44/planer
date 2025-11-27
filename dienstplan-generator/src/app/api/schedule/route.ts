import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSchedule, type SchedulerEmployee } from "@/lib/scheduler";
import { parseStoredWeekdays } from "@/lib/weekdays";
import { isEmployeeAreaValue, isEmploymentTypeValue } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? undefined;

  const employees = await prisma.employee.findMany();
  const schedulerEmployees: SchedulerEmployee[] = employees
    .map((employee) => {
      if (!isEmployeeAreaValue(employee.area) || !isEmploymentTypeValue(employee.employmentType)) {
        console.warn("Mitarbeiter mit ungültigem Einsatzbereich oder Beschäftigungsart ignoriert", employee.id);
        return null;
      }
      const schedulerEmployee: SchedulerEmployee = {
        id: employee.id,
        name: employee.name,
        monthlyHours: employee.monthlyHours,
        area: employee.area,
        employmentType: employee.employmentType,
        availableWeekdays: parseStoredWeekdays(employee.availableWeekdays),
        weekendAvailability: employee.weekendAvailability
      };
      return schedulerEmployee;
    })
    .filter((entry): entry is SchedulerEmployee => entry !== null);

  const schedule = generateSchedule(schedulerEmployees, { month: month?.trim() || undefined });
  return NextResponse.json(schedule);
}
