"use client";

import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../lib/api";
import type { Employee, TimesheetRecord } from "../../lib/types";

export default function FichadasPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<number | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<TimesheetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ date: "", entry_time: "", exit_time: "", total_hours: 0, is_franco: false, notes: "" });

  useEffect(() => {
    api.employees.list().then((data) => setEmployees(data.filter((e) => e.active)));
  }, []);

  const loadRecords = async () => {
    if (!selectedEmp) return;
    setLoading(true);
    try {
      const data = await api.timesheet.get(selectedEmp, month, year);
      setRecords(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, [selectedEmp, month, year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    await api.timesheet.upsert({ employee_id: selectedEmp, ...form });
    setForm({ date: "", entry_time: "", exit_time: "", total_hours: 0, is_franco: false, notes: "" });
    loadRecords();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este registro?")) return;
    await api.timesheet.delete(id);
    loadRecords();
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Fichadas</h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        <select
          value={selectedEmp || ""}
          onChange={(e) => setSelectedEmp(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">Seleccionar empleado</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>

        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm">
          {monthNames.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm">
          {[2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {selectedEmp && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 border">
          <h2 className="text-lg font-semibold mb-4">Agregar fichada</h2>
          <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Entrada</label>
              <input type="time" value={form.entry_time} onChange={(e) => setForm({ ...form, entry_time: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Salida</label>
              <input type="time" value={form.exit_time} onChange={(e) => setForm({ ...form, exit_time: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Horas</label>
              <input type="number" step="0.5" min="0" value={form.total_hours} onChange={(e) => setForm({ ...form, total_hours: Number(e.target.value) })} className="px-3 py-2 border rounded-lg text-sm w-20" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_franco} onChange={(e) => setForm({ ...form, is_franco: e.target.checked })} id="franco" className="rounded" />
              <label htmlFor="franco" className="text-sm">Franco</label>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notas</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" placeholder="Opcional" />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap">
              Guardar
            </button>
          </form>
        </div>
      )}

      {selectedEmp && (
        loading ? (
          <div className="text-gray-500">Cargando...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay fichadas para este mes</div>
        ) : (
          <div className="bg-white rounded-xl shadow border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium">Entrada</th>
                  <th className="text-left px-4 py-3 font-medium">Salida</th>
                  <th className="text-left px-4 py-3 font-medium">Horas</th>
                  <th className="text-left px-4 py-3 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium">Notas</th>
                  <th className="text-right px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3">{r.entry_time || "-"}</td>
                    <td className="px-4 py-3">{r.exit_time || "-"}</td>
                    <td className="px-4 py-3 font-medium">{r.total_hours}</td>
                    <td className="px-4 py-3">
                      {r.is_franco ? <span className="text-purple-600 text-xs font-medium">Franco</span> :
                       r.is_holiday ? <span className="text-orange-600 text-xs font-medium">{r.holiday_name || "Feriado"}</span> :
                       <span className="text-green-600 text-xs font-medium">Trabajo</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.notes || ""}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline text-xs">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-gray-50 border-t text-sm font-medium">
              Total horas: {records.reduce((sum, r) => sum + r.total_hours, 0).toFixed(2)}
            </div>
          </div>
        )
      )}
    </AppLayout>
  );
}
