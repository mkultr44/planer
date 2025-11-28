"use client";

import { useEffect, useState } from "react";
import type { CreateEmployeePayload, EmployeeAreaValue, EmploymentTypeValue } from "@/types";
import { CASHIER_SHIFT_OPTIONS, type CashierShiftId } from "@/lib/shifts";

const AREA_OPTIONS: { label: string; value: EmployeeAreaValue; description: string }[] = [
  { label: "Kasse", value: "KASSE", description: "Fixe Schichten laut Vorgaben" },
  { label: "Bistro", value: "BISTRO", description: "Flexible Tagesplanung" },
  { label: "Lager", value: "LAGER", description: "Flexible Tagesplanung" },
  { label: "Werkstatt", value: "WERKSTATT", description: "Nur werktags" }
];

const TYPE_OPTIONS: { label: string; value: EmploymentTypeValue; description: string }[] = [
  { label: "Angestellte:r", value: "ANGESTELLTER", description: "Kann bei Engpässen flexibler eingeplant werden" },
  { label: "Aushilfe", value: "AUSHILFE", description: "Striktes Stundenlimit & Schichtabstände" }
];

const WEEKDAY_OPTIONS = [
  { label: "Mo", value: 1 },
  { label: "Di", value: 2 },
  { label: "Mi", value: 3 },
  { label: "Do", value: 4 },
  { label: "Fr", value: 5 }
];

const FIXED_SHIFT_WEEKDAY_OPTIONS = [
  { label: "So", value: 0 },
  { label: "Mo", value: 1 },
  { label: "Di", value: 2 },
  { label: "Mi", value: 3 },
  { label: "Do", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 }
];

interface Props {
  onCreated?: () => void;
}

export function EmployeeForm({ onCreated }: Props) {
  const [formState, setFormState] = useState<CreateEmployeePayload>({
    name: "",
    monthlyHours: 80,
    area: "KASSE",
    employmentType: "ANGESTELLTER",
    availableWeekdays: [1, 2, 3, 4, 5],
    weekendAvailability: false,
    fixedCashierSlots: []
  });
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(formState.availableWeekdays);
  const [fixedCashierDays, setFixedCashierDays] = useState<number[]>([]);
  const [fixedShiftId, setFixedShiftId] = useState<CashierShiftId>("W-2");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const eligibleForFixedShift = formState.area === "KASSE" && formState.employmentType === "ANGESTELLTER";

  useEffect(() => {
    if (!eligibleForFixedShift) {
      setFixedCashierDays([]);
    }
  }, [eligibleForFixedShift]);

  const toggleWeekday = (value: number) => {
    setSelectedWeekdays((prev) => {
      if (prev.includes(value)) {
        return prev.filter((day) => day !== value);
      }
      return [...prev, value];
    });
  };

  const toggleFixedDay = (value: number) => {
    setFixedCashierDays((prev) => {
      if (prev.includes(value)) {
        return prev.filter((day) => day !== value);
      }
      return [...prev, value];
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    const payload: CreateEmployeePayload = {
      ...formState,
      monthlyHours: Number(formState.monthlyHours),
      availableWeekdays: selectedWeekdays,
      fixedCashierSlots:
        eligibleForFixedShift && fixedCashierDays.length
          ? fixedCashierDays.map((weekday) => ({ weekday, shiftId: fixedShiftId }))
          : []
    };

    if (!payload.availableWeekdays.length) {
      setFeedback({ type: "error", message: "Bitte mindestens einen Wochentag auswählen." });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.message ?? "Speichern fehlgeschlagen");
      }

      setFeedback({ type: "success", message: "Mitarbeiter:in wurde gespeichert." });
      setFormState((prev) => ({ ...prev, name: "" }));
      setSelectedWeekdays(payload.availableWeekdays);
      setFixedCashierDays([]);
      setFixedShiftId("W-2");
      onCreated?.();
    } catch (error) {
      setFeedback({ type: "error", message: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="card flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="card-header">Mitarbeiter anlegen</div>
      <div className="card-body flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Name
            <input
              className="rounded-xl border border-slate-300 px-4 py-2 text-base focus:border-brand-500 focus:outline-none"
              type="text"
              required
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Monatliches Stundenkontingent
            <input
              className="rounded-xl border border-slate-300 px-4 py-2 text-base focus:border-brand-500 focus:outline-none"
              type="number"
              min={1}
              max={300}
              required
              value={formState.monthlyHours}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, monthlyHours: Number(event.target.value) }))
              }
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Tätigkeitsbereich
            <select
              className="rounded-xl border border-slate-300 px-4 py-2 text-base focus:border-brand-500 focus:outline-none"
              value={formState.area}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, area: event.target.value as EmployeeAreaValue }))
              }
            >
              {AREA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              {AREA_OPTIONS.find((item) => item.value === formState.area)?.description}
            </p>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Beschäftigungsart
            <select
              className="rounded-xl border border-slate-300 px-4 py-2 text-base focus:border-brand-500 focus:outline-none"
              value={formState.employmentType}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  employmentType: event.target.value as EmploymentTypeValue
                }))
              }
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              {TYPE_OPTIONS.find((item) => item.value === formState.employmentType)?.description}
            </p>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Verfügbarkeit (Wochentage)</span>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_OPTIONS.map((weekday) => (
              <label
                key={weekday.value}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition ${
                  selectedWeekdays.includes(weekday.value)
                    ? "border-brand-500 bg-brand-500/10 text-brand-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedWeekdays.includes(weekday.value)}
                  onChange={() => toggleWeekday(weekday.value)}
                />
                {weekday.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Mindestens ein Wochentag muss ausgewählt sein. Für Wochenenden separate Checkbox nutzen.
          </p>
        </div>

        <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={formState.weekendAvailability}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, weekendAvailability: event.target.checked }))
            }
          />
          Auch an Wochenenden & NRW-Feiertagen verfügbar
        </label>

        {eligibleForFixedShift && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Feste Kassenschichten</p>
                <p className="text-xs text-slate-500">Nur für Angestellte in der Kasse.</p>
              </div>
              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                value={fixedShiftId}
                onChange={(event) => setFixedShiftId(event.target.value as CashierShiftId)}
              >
                {CASHIER_SHIFT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {FIXED_SHIFT_WEEKDAY_OPTIONS.map((weekday) => (
                <label
                  key={weekday.value}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    fixedCashierDays.includes(weekday.value)
                      ? "border-brand-500 bg-brand-500/10 text-brand-700"
                      : "border-slate-300 text-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={fixedCashierDays.includes(weekday.value)}
                    onChange={() => toggleFixedDay(weekday.value)}
                  />
                  {weekday.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Beispiel: Mo, Di, Mi + Mittelschicht = feste Zuordnung zu diesen Schichten. Wochenend-Tage erfordern
              zusätzlich die Wochenend-Checkbox oben.
            </p>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Speichern..." : "Mitarbeiter speichern"}
          </button>
          <p className="text-xs text-slate-500">
            Aushilfen werden im Kassenplan automatisch mit Pausen zwischen den Einsätzen verteilt.
          </p>
        </div>
      </div>
    </form>
  );
}
