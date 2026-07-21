export interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export interface Employee {
  id: number;
  user_id: number | null;
  name: string;
  legajo: string | null;
  dni: string;
  category: string;
  admission_date: string;
  active: boolean;
}

export interface TimesheetRecord {
  id: number;
  employee_id: number;
  date: string;
  entry_time: string | null;
  exit_time: string | null;
  total_hours: number;
  is_franco: boolean;
  is_holiday: boolean;
  holiday_name: string | null;
  notes: string | null;
}

export interface Payroll {
  id: number;
  employee_id: number;
  month: number;
  year: number;
  basic_salary: number;
  seniority_years: number;
  seniority_amount: number;
  presentismo: number;
  has_presentismo: boolean;
  overtime_hours: number;
  overtime_amount: number;
  holiday_hours: number;
  holiday_amount: number;
  night_hours: number;
  night_amount: number;
  viaticos: number;
  non_remunerative: number;
  gross_salary: number;
  deductions: number;
  deduccion_porcentaje: number;
  deduccion_os_fija: number;
  net_salary: number;
  sac_bruto: number;
  sac_deducciones: number;
  sac_neto: number;
  base_hours: number;
  total_hours_worked: number;
  dias_vacaciones: number;
  dias_trabajados: number;
  pago_basico_trabajado: number;
  pago_vacaciones: number;
  plus_vacacional: number;
  calculated_at: string;
}

export interface Category {
  id: number;
  name: string;
}
