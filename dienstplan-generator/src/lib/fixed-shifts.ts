import type { FixedCashierSlot } from "@/types";
import { isCashierShiftId } from "./shifts";
import { clampWeekday } from "./weekdays";

const normalizeSlot = (slot: any): FixedCashierSlot | null => {
  const weekday = clampWeekday(slot?.weekday);
  const shiftId = slot?.shiftId;
  if (weekday === null || !isCashierShiftId(shiftId)) {
    return null;
  }
  return { weekday, shiftId };
};

export const normalizeFixedCashierSlots = (slots: readonly unknown[]): FixedCashierSlot[] => {
  const normalized: FixedCashierSlot[] = [];
  const seen = new Set<string>();

  for (const raw of slots) {
    const slot = normalizeSlot(raw);
    if (!slot) continue;
    const key = `${slot.weekday}-${slot.shiftId}`;
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push(slot);
    }
  }

  return normalized;
};

export const serializeFixedCashierSlots = (slots: readonly unknown[]): string => {
  return JSON.stringify(normalizeFixedCashierSlots(slots));
};

export const parseStoredFixedCashierSlots = (value: unknown): FixedCashierSlot[] => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return normalizeFixedCashierSlots(parsed);
      }
      return [];
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return normalizeFixedCashierSlots(value);
  }

  return [];
};
