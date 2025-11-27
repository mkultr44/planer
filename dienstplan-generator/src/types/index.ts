export const EMPLOYEE_AREAS = ["KASSE", "BISTRO", "LAGER", "WERKSTATT"] as const;
export const EMPLOYEE_AREA = {
  KASSE: EMPLOYEE_AREAS[0],
  BISTRO: EMPLOYEE_AREAS[1],
  LAGER: EMPLOYEE_AREAS[2],
  WERKSTATT: EMPLOYEE_AREAS[3]
} as const;
export type EmployeeAreaValue = (typeof EMPLOYEE_AREAS)[number];

export const EMPLOYMENT_TYPES = ["ANGESTELLTER", "AUSHILFE"] as const;
export const EMPLOYMENT_TYPE = {
  ANGESTELLTER: EMPLOYMENT_TYPES[0],
  AUSHILFE: EMPLOYMENT_TYPES[1]
} as const;
export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPES)[number];

export interface EmployeeDto {
  id: number;
  name: string;
  monthlyHours: number;
  area: EmployeeAreaValue;
  employmentType: EmploymentTypeValue;
  availableWeekdays: number[];
  weekendAvailability: boolean;
  createdAt: string;
}

export interface CreateEmployeePayload {
  name: string;
  monthlyHours: number;
  area: EmployeeAreaValue;
  employmentType: EmploymentTypeValue;
  availableWeekdays: number[];
  weekendAvailability: boolean;
}

export interface ServiceResponse<T> {
  data: T;
  message?: string;
}
