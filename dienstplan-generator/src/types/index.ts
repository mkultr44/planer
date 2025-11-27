export type EmployeeAreaValue = "KASSE" | "BISTRO" | "LAGER" | "WERKSTATT";
export type EmploymentTypeValue = "ANGESTELLTER" | "AUSHILFE";

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
