import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { buildEmployeePersistenceData, employeeSchema, mapEmployee } from "@/lib/employees";

const parseId = (value: string): number | null => {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
};

type RouteContext = {
  params: Promise<Record<string, string | string[] | undefined>>;
};

const notFoundResponse = () => NextResponse.json({ message: "Mitarbeiter:in nicht gefunden" }, { status: 404 });

const extractId = async (context: RouteContext) => {
  const params = (await context.params) ?? {};
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  return rawId ?? "";
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const employeeId = parseId(await extractId(context));
  if (!employeeId) {
    return NextResponse.json({ message: "Ungültige Mitarbeiter-ID" }, { status: 400 });
  }

  const existing = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!existing) {
    return notFoundResponse();
  }

  try {
    const payload = await request.json();
    const parsed = employeeSchema.parse(payload);
    const data = buildEmployeePersistenceData(parsed);
    const employee = await prisma.employee.update({ where: { id: employeeId }, data });
    return NextResponse.json({ data: mapEmployee(employee) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: error.errors[0]?.message ?? "Ungültige Eingabe" }, { status: 422 });
    }
    console.error(`Fehler beim Aktualisieren von Mitarbeiter ${employeeId}`, error);
    return NextResponse.json({ message: "Aktualisierung fehlgeschlagen" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const employeeId = parseId(await extractId(context));
  if (!employeeId) {
    return NextResponse.json({ message: "Ungültige Mitarbeiter-ID" }, { status: 400 });
  }

  const existing = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!existing) {
    return notFoundResponse();
  }

  try {
    await prisma.employee.delete({ where: { id: employeeId } });
    return NextResponse.json({ data: true });
  } catch (error) {
    console.error(`Fehler beim Löschen von Mitarbeiter ${employeeId}`, error);
    return NextResponse.json({ message: "Löschen fehlgeschlagen" }, { status: 500 });
  }
}
