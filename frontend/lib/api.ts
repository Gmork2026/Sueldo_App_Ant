import type { Employee, TimesheetRecord, Payroll } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let authToken: string | null = typeof window !== "undefined" ? localStorage.getItem("token") : null;

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== "undefined") localStorage.setItem("token", token);
}

export function clearAuthToken() {
  authToken = null;
  if (typeof window !== "undefined") localStorage.removeItem("token");
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (authToken) h["Authorization"] = `Bearer ${authToken}`;
  return h;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(error.detail || `Error ${res.status}`);
  }

  return res.json();
}

async function requestBlob(
  path: string,
  options: RequestInit = {}
): Promise<Blob> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      ...authHeaders(),
      ...options.headers as Record<string, string>,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(error.detail || `Error ${res.status}`);
  }

  return res.blob();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; user: { id: number; email: string; role: string } }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),
    me: () => request<{ id: number; email: string; role: string; created_at: string }>("/api/auth/me"),
    logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
    register: (email: string, password: string, role = "employee", employeeId?: number) =>
      request<{ id: number; email: string; role: string }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify({ email, password, role, employee_id: employeeId }) }
      ),
    registerByDNI: (dni: string, email: string, password: string) =>
      request<{ id: number; email: string; role: string }>(
        "/api/auth/register-by-dni",
        { method: "POST", body: JSON.stringify({ dni, email, password }) }
      ),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ ok: boolean; message: string }>(
        "/api/auth/change-password",
        { method: "PUT", body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }
      ),
    seed: (email: string, password: string) =>
      request<{ message: string; email: string; password: string }>(
        "/api/auth/seed",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),
    listUsers: () =>
      request<Array<{ id: number; email: string; role: string; created_at: string }>>("/api/auth/users"),
    updateUser: (userId: number, data: { email?: string; role?: string; password?: string }) =>
      request<{ id: number; email: string; role: string; created_at: string }>(
        `/api/auth/users/${userId}`,
        { method: "PUT", body: JSON.stringify(data) }
      ),
    deleteUser: (userId: number) =>
      request<{ ok: boolean }>(`/api/auth/users/${userId}`, { method: "DELETE" }),
    lookupDNI: (dni: string) =>
      request<{ found: boolean; name?: string; employee_id?: number; has_account: boolean }>(
        `/api/auth/lookup-dni/${encodeURIComponent(dni)}`
      ),
    registerSelf: (name: string, dni: string, category: string, legajo: string, email: string, password: string) =>
      request<{ access_token: string; user: { id: number; email: string; role: string } }>(
        "/api/auth/register-self",
        { method: "POST", body: JSON.stringify({ name, dni, category, legajo, email, password }) }
      ),
  },

  employees: {
    list: () => request<Employee[]>("/api/employees"),
    get: (id: number) => request<Employee>(`/api/employees/${id}`),
    create: (data: { name: string; dni: string; category: string; admission_date: string; legajo?: string; user_id?: number }) =>
      request<Employee>(`/api/employees`, { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Employee>(`/api/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/api/employees/${id}`, { method: "DELETE" }),
  },

  timesheet: {
    get: (employeeId: number, month: number, year: number) =>
      request<TimesheetRecord[]>(
        `/api/timesheet/${employeeId}?month=${month}&year=${year}`
      ),
    upsert: (data: { employee_id: number; date: string; entry_time?: string; exit_time?: string; total_hours?: number; is_franco?: boolean; is_holiday?: boolean; holiday_name?: string; notes?: string }) =>
      request<TimesheetRecord>(`/api/timesheet`, { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<TimesheetRecord>(`/api/timesheet/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/api/timesheet/${id}`, { method: "DELETE" }),
    bulk: (data: { employee_id: number; month: number; year: number; entry_time: string; exit_time: string; skip_dates?: string[] }) =>
      request<TimesheetRecord[]>(`/api/timesheet/bulk`, { method: "POST", body: JSON.stringify(data) }),
  },

  payroll: {
    calculate: (employeeId: number, month: number, year: number, dias_vacaciones = 0) =>
      request<Payroll>(
        `/api/payroll/calculate`,
        { method: "POST", body: JSON.stringify({ employee_id: employeeId, month, year, dias_vacaciones }) }
      ),
    list: (employeeId: number) =>
      request<Payroll[]>(
        `/api/payroll/${employeeId}`
      ),
    export: async (payrollId: number) => {
      const blob = await requestBlob(`/api/payroll/${payrollId}/export`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `liquidacion_${payrollId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  },

  categories: {
    list: () => request<{ categories: string[] }>("/api/categories"),
  },

  import: {
    preview: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/import/employees/preview`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Error" }));
        throw new Error(error.detail);
      }
      return res.json();
    },
    execute: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/import/employees/execute?skip_errors=true`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Error" }));
        throw new Error(error.detail);
      }
      return res.json();
    },
  },
};
