"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmployeeForm } from "./employee-form";
import { EmployeeList } from "./employee-list";
import { SchedulePreview } from "./schedule-preview";
import type { EmployeeDto } from "@/types";
import type { GeneratedScheduleDto } from "@/types/schedule";

const getCurrentMonthValue = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

export function PlannerDashboard() {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [month, setMonth] = useState(getCurrentMonthValue);
  const [schedule, setSchedule] = useState<GeneratedScheduleDto | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) {
        throw new Error("Teamdaten konnten nicht geladen werden.");
      }
      const result = await response.json();
      setEmployees(result.data ?? []);
    } catch (error) {
      console.error(error);
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const generateSchedule = async () => {
    setIsGenerating(true);
    setScheduleError(null);
    try {
      const response = await fetch(`/api/schedule?month=${month}`);
      if (!response.ok) {
        throw new Error("Dienstplan konnte nicht erstellt werden.");
      }
      const result = await response.json();
      setSchedule(result);
    } catch (error) {
      setSchedule(null);
      setScheduleError((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const employeeCountByArea = useMemo(() => {
    return employees.reduce<Record<string, number>>((acc, employee) => {
      acc[employee.area] = (acc[employee.area] ?? 0) + 1;
      return acc;
    }, {});
  }, [employees]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Dienstplan-Generator</p>
          <h1 className="text-3xl font-bold text-slate-900">Planung für NRW-Standorte</h1>
          <p className="text-sm text-slate-500">
            Erstelle dein Team, hinterlege Verfügbarkeiten und generiere zu 100 % belegte Kassenschichten inklusive
            Feiertagen in Nordrhein-Westfalen.
          </p>
        </div>
        {employees.length > 0 && (
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {Object.entries(employeeCountByArea).map(([area, count]) => (
              <span key={area} className="rounded-full bg-slate-100 px-3 py-1">
                {area}: {count}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <EmployeeForm onSuccess={fetchEmployees} />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <EmployeeList employees={employees} isLoading={isLoadingEmployees} onChange={fetchEmployees} />
          <div className="card">
            <div className="card-header flex flex-wrap items-center justify-between gap-3">
              <span>Einstellungen</span>
              <div className="flex items-center gap-3 text-sm">
                <label className="text-slate-600">
                  Monat
                  <input
                    type="month"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                    className="ml-2 rounded-xl border border-slate-300 px-3 py-1 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </label>
                <button className="btn-primary" onClick={generateSchedule} disabled={isGenerating}>
                  {isGenerating ? "Berechnung läuft..." : "Dienstplan generieren"}
                </button>
              </div>
            </div>
            {scheduleError && <div className="card-body text-sm text-rose-500">{scheduleError}</div>}
          </div>
          <SchedulePreview schedule={schedule} isLoading={isGenerating && !schedule} employees={employees} />
        </div>
      </div>
    </div>
  );
}
