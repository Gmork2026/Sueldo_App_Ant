"use client";

import { useEffect, useState, useMemo } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Employee, TimesheetRecord } from "../../lib/types";

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function dayOfWeek(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getDay();
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function FichadasPage() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<number | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<TimesheetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    entry_time: "",
    exit_time: "",
    is_franco: false,
    notes: "",
  });

  useEffect(() => {
    api.employees.list().then((data) => {
      setEmployees(data.filter((e) => e.active));
    });
  }, []);

  const loadRecords = async () => {
    if (!selectedEmp) return;
    setLoading(true);
    try {
      const data = await api.timesheet.get(selectedEmp, month, year);
      setRecords(data);
    } catch {
      setRecords([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, [selectedEmp, month, year]);

  const recordMap = useMemo(() => {
    const map: Record<string, TimesheetRecord> = {};
    records.forEach((r) => { map[r.date] = r; });
    return map;
  }, [records]);

  const totalHours = useMemo(
    () => records.reduce((sum, r) => sum + r.total_hours, 0),
    [records]
  );

  const totalWorkDays = useMemo(
    () => records.filter((r) => !r.is_franco).length,
    [records]
  );

  const totalFrancos = useMemo(
    () => records.filter((r) => r.is_franco).length,
    [records]
  );

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDay(dateStr);
    const existing = recordMap[dateStr];
    if (existing) {
      setForm({
        entry_time: existing.entry_time || "",
        exit_time: existing.exit_time || "",
        is_franco: existing.is_franco,
        notes: existing.notes || "",
      });
    } else {
      setForm({ entry_time: "", exit_time: "", is_franco: false, notes: "" });
    }
  };

  const handleSave = async () => {
    if (!selectedEmp || !selectedDay) return;
    setSaving(true);
    try {
      const data: Parameters<typeof api.timesheet.upsert>[0] = {
        employee_id: selectedEmp,
        date: selectedDay,
        entry_time: form.entry_time || undefined,
        exit_time: form.exit_time || undefined,
        is_franco: form.is_franco,
        notes: form.notes || undefined,
      };
      if (!form.entry_time && !form.exit_time && !form.is_franco) {
        data.total_hours = 0;
      }
      await api.timesheet.upsert(data);
      await loadRecords();
      setSelectedDay(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al guardar");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedDay || !recordMap[selectedDay]) return;
    if (!confirm("¿Eliminar este registro?")) return;
    await api.timesheet.delete(recordMap[selectedDay].id);
    await loadRecords();
    setSelectedDay(null);
  };

  const calcAutoHours = () => {
    if (!form.entry_time || !form.exit_time) return "";
    const [eh, em] = form.entry_time.split(":").map(Number);
    const [xh, xm] = form.exit_time.split(":").map(Number);
    const diff = (xh * 60 + xm - eh * 60 - em) / 60;
    return diff > 0 ? diff.toFixed(2) : "";
  };

  const numDays = daysInMonth(year, month);
  const firstDay = dayOfWeek(year, month, 1);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= numDays; d++) calendarDays.push(d);

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
          {MONTH_NAMES.map((name, i) => (
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 border text-center">
            <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</div>
            <div className="text-xs text-gray-500">Horas totales</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border text-center">
            <div className="text-2xl font-bold text-green-600">{totalWorkDays}</div>
            <div className="text-xs text-gray-500">Días trabajados</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border text-center">
            <div className="text-2xl font-bold text-purple-600">{totalFrancos}</div>
            <div className="text-xs text-gray-500">Francos</div>
          </div>
        </div>
      )}

      {selectedEmp && (
        <div className="bg-white rounded-xl shadow border p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">{MONTH_NAMES[month - 1]} {year}</h2>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;

              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const rec = recordMap[dateStr];
              const isSelected = selectedDay === dateStr;
              const isToday = new Date().toISOString().slice(0, 10) === dateStr;

              let bg = "bg-gray-50 hover:bg-gray-100";
              let textColor = "text-gray-700";
              if (rec?.is_franco) { bg = "bg-purple-50 hover:bg-purple-100"; textColor = "text-purple-700"; }
              else if (rec?.is_holiday) { bg = "bg-orange-50 hover:bg-orange-100"; textColor = "text-orange-700"; }
              else if (rec && rec.total_hours > 0) { bg = "bg-green-50 hover:bg-green-100"; textColor = "text-green-700"; }

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative p-1.5 rounded-lg text-left transition-colors min-h-[60px] sm:min-h-[70px] border ${bg} ${isSelected ? "ring-2 ring-blue-500" : "border-transparent"} ${isToday ? "ring-1 ring-blue-300" : ""}`}
                >
                  <div className={`text-xs font-bold ${textColor}`}>{day}</div>
                  {rec?.is_franco && <div className="text-[10px] text-purple-600 font-medium">Franco</div>}
                  {rec?.is_holiday && <div className="text-[10px] text-orange-600 font-medium truncate">{rec.holiday_name || "Fer."}</div>}
                  {rec && !rec.is_franco && rec.total_hours > 0 && (
                    <div className="text-[10px] text-green-600 font-medium">{rec.total_hours}h</div>
                  )}
                  {rec && !rec.is_franco && rec.entry_time && (
                    <div className="text-[9px] text-gray-400 truncate">{rec.entry_time}-{rec.exit_time || "?"}</div>
                  )}
                </button>
              );
            })}
          </div>

          {loading && <div className="text-center text-gray-400 text-sm mt-3">Cargando...</div>}
        </div>
      )}

      {selectedDay && (
        <div className="bg-white rounded-xl shadow p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Entrada</label>
              <input
                type="time"
                value={form.entry_time}
                onChange={(e) => setForm({ ...form, entry_time: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Salida</label>
              <input
                type="time"
                value={form.exit_time}
                onChange={(e) => setForm({ ...form, exit_time: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            {form.entry_time && form.exit_time && (
              <div className="bg-blue-50 px-3 py-2 rounded-lg text-sm text-blue-700 font-medium">
                = {calcAutoHours()}hs
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_franco}
                onChange={(e) => setForm({ ...form, is_franco: e.target.checked })}
                id="franco"
                className="rounded"
              />
              <label htmlFor="franco" className="text-sm">Franco</label>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-gray-500 mb-1">Notas</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Opcional"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
              {recordMap[selectedDay] && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
