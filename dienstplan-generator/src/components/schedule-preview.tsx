import type { GeneratedScheduleDto } from "@/types/schedule";

interface Props {
  schedule: GeneratedScheduleDto | null;
  isLoading?: boolean;
}

const TYPE_COLORS: Record<GeneratedScheduleDto["days"][number]["type"], string> = {
  WORKDAY: "bg-emerald-50 text-emerald-700",
  WEEKEND: "bg-amber-50 text-amber-700",
  HOLIDAY: "bg-sky-50 text-sky-700"
};

const STATUS_BADGES: Record<string, string> = {
  ASSIGNED: "bg-emerald-100 text-emerald-800",
  OPEN: "bg-rose-100 text-rose-800",
  CLOSED: "bg-slate-100 text-slate-500"
};

export function SchedulePreview({ schedule, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">Dienstplan</div>
        <div className="card-body text-sm text-slate-500">Dienstplan wird berechnet...</div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="card">
        <div className="card-header">Dienstplan</div>
        <div className="card-body text-sm text-slate-500">
          Noch kein Dienstplan generiert. Wähle einen Monat und starte die Berechnung.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span>Dienstplan</span>
          <span className="text-xs font-normal text-slate-500">{schedule.monthLabel}</span>
        </div>
        <span className="text-xs font-medium text-slate-400">
          Stand: {new Date(schedule.generatedAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </div>
      <div className="card-body flex flex-col gap-6">
        <div className="grid gap-3 md:grid-cols-2">
          <SummaryTile
            title="Kasse"
            primary={`${schedule.summary.filledCashierShifts}/${schedule.summary.totalCashierShifts}`}
            secondary="besetzte Schichten"
          />
          <SummaryTile
            title="Weitere Bereiche"
            primary={`${schedule.summary.filledAreaSlots}/${schedule.summary.totalAreaSlots}`}
            secondary="besetzte Einsätze"
          />
        </div>

        {schedule.warnings.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900">
            <p className="font-semibold">Hinweise</p>
            <ul className="list-disc pl-5">
              {schedule.warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {schedule.days.map((day) => (
            <div key={day.dateISO} className="rounded-2xl border border-slate-100 bg-slate-50/60">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">{day.readableDate}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{day.weekdayName}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${TYPE_COLORS[day.type]}`}>
                  {day.type === "HOLIDAY" ? "Feiertag" : day.type === "WEEKEND" ? "Wochenende" : "Werktag"}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {day.shifts.map((shift) => (
                  <div key={shift.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {shift.label}
                        {shift.area !== "KASSE" && <span className="text-slate-400"> · {shift.area}</span>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {shift.start && shift.end ? `${shift.start} – ${shift.end} · ` : ""}
                        {shift.hours} h
                      </p>
                      {shift.note && <p className="text-xs text-slate-400">{shift.note}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGES[shift.status]}`}>
                        {shift.status === "ASSIGNED"
                          ? shift.employee?.name
                          : shift.status === "CLOSED"
                          ? "geschlossen"
                          : "unbesetzt"}
                      </span>
                      {shift.employee && (
                        <p className="text-xs text-slate-500">{shift.employee.employmentType === "AUSHILFE" ? "Aushilfe" : "Angestellte:r"}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  title,
  primary,
  secondary
}: {
  title: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{primary}</p>
      <p className="text-xs text-slate-500">{secondary}</p>
    </div>
  );
}
