import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSchedule, type SchedulerEmployee } from "@/lib/scheduler";
import { parseStoredWeekdays } from "@/lib/weekdays";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? undefined;

  const employees = await prisma.employee.findMany();
  const schedulerEmployees: SchedulerEmployee[] = employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    monthlyHours: employee.monthlyHours,
    area: employee.area,
    employmentType: employee.employmentType,
    availableWeekdays: parseStoredWeekdays(employee.availableWeekdays),
    weekendAvailability: employee.weekendAvailability
  }));

  const schedule = generateSchedule(schedulerEmployees, { month: month?.trim() || undefined });
  return NextResponse.json(schedule);
}
