import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { buildEmployeePersistenceData, employeeSchema, mapEmployee } from "@/lib/employees";

export async function GET() {
  const employees = await prisma.employee.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: employees.map(mapEmployee) });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = employeeSchema.parse(payload);
    const data = buildEmployeePersistenceData(parsed);
    const employee = await prisma.employee.create({
      data
    });

    return NextResponse.json({ data: mapEmployee(employee) }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: error.errors[0]?.message ?? "Ungültige Eingabe" }, { status: 422 });
    }
    console.error("Fehler beim Speichern", error);
    return NextResponse.json({ message: "Speichern fehlgeschlagen" }, { status: 500 });
  }
}
