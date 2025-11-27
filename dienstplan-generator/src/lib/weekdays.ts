const clampWeekday = (value: unknown): number | null => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  const normalized = ((Math.trunc(numeric) % 7) + 7) % 7;
  return normalized;
};

export const normalizeWeekdays = (values: readonly unknown[]): number[] => {
  const normalized = new Set<number>();
  for (const value of values) {
    const weekday = clampWeekday(value);
    if (weekday !== null) {
      normalized.add(weekday);
    }
  }
  return Array.from(normalized);
};

export const serializeWeekdays = (values: readonly unknown[]): string => {
  return JSON.stringify(normalizeWeekdays(values));
};

export const parseStoredWeekdays = (value: unknown): number[] => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return normalizeWeekdays(parsed);
      }
      return [];
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return normalizeWeekdays(value);
  }

  return [];
};
