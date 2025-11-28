import { getCashierShiftById } from "@/lib/shifts";
import type { EmployeeDto } from "@/types";

const WEEKDAY_LOOKUP: Record<number, string> = {
  0: "So",
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa"
};

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const weekdayOrder = (value: number) => {
  const index = WEEKDAY_ORDER.indexOf(value);
  return index === -1 ? WEEKDAY_ORDER.length + value : index;
};

const AREA_LABELS: Record<EmployeeDto["area"], string> = {
  KASSE: "Kasse",
  BISTRO: "Bistro",
  LAGER: "Lager",
  WERKSTATT: "Werkstatt"
};

const TYPE_LABELS: Record<EmployeeDto["employmentType"], string> = {
  ANGESTELLTER: "Angestellte:r",
  AUSHILFE: "Aushilfe"
};

const formatFixedShifts = (employee: EmployeeDto) => {
  if (!employee.fixedCashierSlots.length) {
    return "-";
  }
  const sorted = employee.fixedCashierSlots
    .slice()
    .sort((a, b) => weekdayOrder(a.weekday) - weekdayOrder(b.weekday));
  const slot = sorted[0];
  const shift = getCashierShiftById(slot.shiftId);
  const weekdays = sorted
    .map((entry) => WEEKDAY_LOOKUP[entry.weekday] ?? "?")
    .join(", ");
  return `${weekdays}${shift ? ` · ${shift.label}` : ""}`;
};

interface Props {
  employees: EmployeeDto[];
  isLoading?: boolean;
}

export function EmployeeList({ employees, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">Teamübersicht</div>
        <div className="card-body text-sm text-slate-500">Teamdaten werden geladen...</div>
      </div>
    );
  }

  if (!employees.length) {
    return (
      <div className="card">
        <div className="card-header">Teamübersicht</div>
        <div className="card-body text-sm text-slate-500">
          Noch keine Mitarbeitenden angelegt.
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="card-header">Teamübersicht</div>
      <div className="card-body overflow-x-auto px-0">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Bereich</th>
              <th className="px-6 py-3">Art</th>
              <th className="px-6 py-3">Stunden/Monat</th>
              <th className="px-6 py-3">Wochentage</th>
              <th className="px-6 py-3">Wochenende</th>
              <th className="px-6 py-3">Feste Kassenschichten</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t border-slate-100">
                <td className="px-6 py-4 font-medium text-slate-900">{employee.name}</td>
                <td className="px-6 py-4 text-slate-600">{AREA_LABELS[employee.area]}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      employee.employmentType === "AUSHILFE"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {TYPE_LABELS[employee.employmentType]}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{employee.monthlyHours} h</td>
                <td className="px-6 py-4 text-slate-600">
                  {employee.availableWeekdays
                    .slice()
                    .sort((a, b) => weekdayOrder(a) - weekdayOrder(b))
                    .map((weekday) => WEEKDAY_LOOKUP[weekday] ?? "?")
                    .join(", ") || "-"}
                </td>
                <td className="px-6 py-4">
                  {employee.weekendAvailability ? (
                    <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                      verfügbar
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      frei
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600">{formatFixedShifts(employee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
