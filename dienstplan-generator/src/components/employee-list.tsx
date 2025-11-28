"use client";

import { useState } from "react";
import { getCashierShiftById } from "@/lib/shifts";
import type { EmployeeDto } from "@/types";
import { EmployeeForm } from "./employee-form";

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

type ActionFeedback = { type: "success" | "error"; message: string } | null;

interface Props {
  employees: EmployeeDto[];
  isLoading?: boolean;
  onChange?: () => void;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path
      fillRule="evenodd"
      d="M9 3a1 1 0 0 0-.894.553L7.382 5H4a1 1 0 1 0 0 2h.278l.88 12.316A2 2 0 0 0 7.154 21h9.692a2 2 0 0 0 1.996-1.684L19.722 7H20a1 1 0 1 0 0-2h-3.382l-.724-1.447A1 1 0 0 0 15 3H9Zm3 6a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Zm-3 1a1 1 0 0 0-2 0v7a1 1 0 1 0 2 0v-7Zm8 0a1 1 0 0 0-2 0v7a1 1 0 1 0 2 0v-7Z"
      clipRule="evenodd"
    />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-4 w-4">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm14.71-9.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.83 1.82 3.75 3.75 1.99-1.66Z" />
  </svg>
);

export function EmployeeList({ employees, isLoading, onChange }: Props) {
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback>(null);

  const handleDelete = async (employee: EmployeeDto) => {
    if (!window.confirm(`Mitarbeiter:in "${employee.name}" wirklich löschen?`)) {
      return;
    }
    setDeletingId(employee.id);
    setActionFeedback(null);
    try {
      const response = await fetch(`/api/employees/${employee.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.message ?? "Löschen fehlgeschlagen");
      }
      setActionFeedback({
        type: "success",
        message: `Mitarbeiter:in "${employee.name}" wurde gelöscht.`
      });
      onChange?.();
    } catch (error) {
      setActionFeedback({ type: "error", message: (error as Error).message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSaved = (updated: EmployeeDto) => {
    setActionFeedback({ type: "success", message: `Mitarbeiter:in "${updated.name}" wurde aktualisiert.` });
    setEditingEmployee(null);
    onChange?.();
  };

  const actionMessage = actionFeedback ? (
    <div
      className={`mx-6 mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
        actionFeedback.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {actionFeedback.message}
    </div>
  ) : null;

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
        {actionMessage}
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
              <th className="px-6 py-3 text-right">Aktionen</th>
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
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-700"
                      aria-label={`Mitarbeiter:in ${employee.name} bearbeiten`}
                      title="Bearbeiten"
                      onClick={() => {
                        setActionFeedback(null);
                        setEditingEmployee(employee);
                      }}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className="rounded-full p-2 text-rose-600 transition hover:bg-rose-50"
                      aria-label={`Mitarbeiter:in ${employee.name} löschen`}
                      title="Löschen"
                      onClick={() => handleDelete(employee)}
                      disabled={deletingId === employee.id}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/30 px-4 py-10">
          <div className="w-full max-w-3xl">
            <EmployeeForm
              mode="edit"
              employee={editingEmployee}
              onSuccess={handleEditSaved}
              onCancel={() => setEditingEmployee(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
