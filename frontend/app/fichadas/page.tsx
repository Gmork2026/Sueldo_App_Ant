"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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

function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const DIURNA_START = 360;  // 06:00
const DIURNA_END = 1260;   // 21:00
const REGULAR_HOURS_PER_DAY = 8;

function calcShiftHours(entry: string, exit: string) {
  const start = timeToMinutes(entry);
  let end = timeToMinutes(exit);
  if (end <= start) end += 24 * 60;

  const totalMinutes = end - start;
  const totalHours = totalMinutes / 60;

  let diurnasMin = 0;
  let nocturnasMin = 0;
  let cursor = start;

  while (cursor < end) {
    const nextBoundary =
      cursor % (24 * 60) < DIURNA_START
        ? Math.min(end, cursor + (DIURNA_START - (cursor % (24 * 60))))
        : cursor % (24 * 60) < DIURNA_END
          ? Math.min(end, cursor + (DIURNA_END - (cursor % (24 * 60))))
          : Math.min(end, cursor + (24 * 60 - (cursor % (24 * 60))));

    const periodStart = cursor % (24 * 60);
    if (periodStart >= DIURNA_START && periodStart < DIURNA_END) {
      diurnasMin += nextBoundary - cursor;
    } else {
      nocturnasMin += nextBoundary - cursor;
    }
    cursor = nextBoundary;
  }

  return {
    total: totalHours,
    diurnas: diurnasMin / 60,
    nocturnas: nocturnasMin / 60,
    extras: Math.max(0, totalHours - REGULAR_HOURS_PER_DAY),
  };
}

export default function FichadasPage() {
  const { isAdmin, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<number | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<TimesheetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkFilling, setBulkFilling] = useState(false);

  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const lastClickedDay = useRef<string | null>(null);

  const [bulkForm, setBulkForm] = useState({
    entry_time: "",
    exit_time: "",
    is_franco: false,
    notes: "",
  });

  const [form, setForm] = useState({
    entry_time: "",
    exit_time: "",
    is_franco: false,
    notes: "",
  });

  useEffect(() => {
    api.employees.list().then((data) => {
      const active = data.filter((e) => e.active);
      setEmployees(active);
      if (!isAdmin && active.length === 1) {
        setSelectedEmp(active[0].id);
      }
      if (isAdmin && user) {
        const myEmp = active.find((e) => e.user_id === user.id);
        if (myEmp) setSelectedEmp(myEmp.id);
      }
    });
  }, [isAdmin, user]);

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

  const totalHolidaysWorked = useMemo(
    () => records.filter((r) => r.is_holiday && !r.is_franco && r.total_hours > 0).length,
    [records]
  );

  const totalDiurnas = useMemo(() => {
    return records.reduce((sum, r) => {
      if (r.is_franco || !r.entry_time || !r.exit_time) return sum;
      const { diurnas } = calcShiftHours(r.entry_time, r.exit_time);
      return sum + diurnas;
    }, 0);
  }, [records]);

  const totalNocturnas = useMemo(() => {
    return records.reduce((sum, r) => {
      if (r.is_franco || !r.entry_time || !r.exit_time) return sum;
      const { nocturnas } = calcShiftHours(r.entry_time, r.exit_time);
      return sum + nocturnas;
    }, 0);
  }, [records]);

  const totalExtras = useMemo(() => {
    return records.reduce((sum, r) => {
      if (r.is_franco || !r.entry_time || !r.exit_time) return sum;
      const { extras } = calcShiftHours(r.entry_time, r.exit_time);
      return sum + extras;
    }, 0);
  }, [records]);

  const toggleMultiSelectMode = useCallback(() => {
    setMultiSelectMode((prev) => {
      if (prev) setSelectedDays(new Set());
      return !prev;
    });
    setSelectedDay(null);
  }, []);

  const toggleDaySelection = useCallback((ds: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(ds)) next.delete(ds);
      else next.add(ds);
      return next;
    });
  }, []);

  const selectRange = useCallback((from: string, to: string) => {
    const [fy, fm, fd] = from.split("-").map(Number);
    const [ty, tm, td] = to.split("-").map(Number);
    const fromDate = new Date(fy, fm - 1, fd);
    const toDate = new Date(ty, tm - 1, td);
    if (fromDate > toDate) {
      const temp = fromDate.getTime();
      fromDate.setTime(toDate.getTime());
      toDate.setTime(temp);
    }
    const newSet = new Set<string>();
    const cursor = new Date(fromDate);
    while (cursor <= toDate) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      const d = cursor.getDate();
      newSet.add(dateStr(y, m, d));
      cursor.setDate(cursor.getDate() + 1);
    }
    setSelectedDays(newSet);
  }, []);

  const handleDayClick = useCallback((day: number, e: React.MouseEvent) => {
    const ds = dateStr(year, month, day);

    if (e.shiftKey && lastClickedDay.current && multiSelectMode) {
      selectRange(lastClickedDay.current, ds);
      lastClickedDay.current = ds;
      return;
    }

    if (multiSelectMode) {
      lastClickedDay.current = ds;
      toggleDaySelection(ds);
      return;
    }

    lastClickedDay.current = ds;
    setSelectedDay(ds);
    setSelectedDays(new Set());
    const existing = recordMap[ds];
    if (existing) {
      setForm({
        entry_time: existing.entry_time || "",
        exit_time: existing.exit_time || "",
        is_franco: existing.is_franco,
        notes: existing.notes || "",
      });
    } else {
      setForm({ entry_time: "07:00", exit_time: "15:00", is_franco: false, notes: "" });
    }
  }, [year, month, multiSelectMode, recordMap, toggleDaySelection, selectRange]);

  const selectAllDays = useCallback(() => {
    const num = daysInMonth(year, month);
    const all = new Set<string>();
    for (let d = 1; d <= num; d++) all.add(dateStr(year, month, d));
    setSelectedDays(all);
  }, [year, month]);

  const clearSelection = useCallback(() => {
    setSelectedDays(new Set());
  }, []);

  const calcBulkAutoHours = () => {
    if (!bulkForm.entry_time || !bulkForm.exit_time) return "";
    const [eh, em] = bulkForm.entry_time.split(":").map(Number);
    const [xh, xm] = bulkForm.exit_time.split(":").map(Number);
    const diff = (xh * 60 + xm - eh * 60 - em) / 60;
    return diff > 0 ? diff.toFixed(2) : "";
  };

  const handleBulkSave = async () => {
    if (!selectedEmp || selectedDays.size === 0) return;
    setBulkSaving(true);
    try {
      const dates = Array.from(selectedDays).sort();
      for (const ds of dates) {
        const data: Parameters<typeof api.timesheet.upsert>[0] = {
          employee_id: selectedEmp,
          date: ds,
          entry_time: bulkForm.entry_time || undefined,
          exit_time: bulkForm.exit_time || undefined,
          is_franco: bulkForm.is_franco,
          notes: bulkForm.notes || undefined,
        };
        if (!bulkForm.entry_time && !bulkForm.exit_time && !bulkForm.is_franco) {
          data.total_hours = 0;
        }
        await api.timesheet.upsert(data);
      }
      await loadRecords();
      setSelectedDays(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al guardar");
    }
    setBulkSaving(false);
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

  const handleBulkFill = async () => {
    if (!selectedEmp) return;
    if (!confirm(`Rellenar días vacíos de ${MONTH_NAMES[month - 1]} con horario 07:00-15:00?\n\nLos días con registros existentes no se modifican. Los domingos se omiten.`)) return;
    setBulkFilling(true);
    try {
      const created = await api.timesheet.bulk({
        employee_id: selectedEmp,
        month,
        year,
        entry_time: "07:00",
        exit_time: "15:00",
      });
      await loadRecords();
      alert(`Se crearon ${created.length} registros.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al rellenar");
    }
    setBulkFilling(false);
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
        {isAdmin ? (
          <select
            value={selectedEmp || ""}
            onChange={(e) => setSelectedEmp(Number(e.target.value))}
            className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white"
          >
            <option value="">Seleccionar empleado</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        ) : employees.length === 1 ? (
          <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium">{employees[0]?.name}</div>
        ) : null}

        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white">
          {MONTH_NAMES.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white">
          {[2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {selectedEmp && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
          <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-3 border border-border dark:border-gray-700 text-center">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalHours.toFixed(1)}</div>
            <div className="text-[10px] text-muted dark:text-gray-400">Horas totales</div>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-3 border border-border dark:border-gray-700 text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{totalWorkDays}</div>
            <div className="text-[10px] text-muted dark:text-gray-400">Días trabajados</div>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-3 border border-border dark:border-gray-700 text-center">
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{totalFrancos}</div>
            <div className="text-[10px] text-muted dark:text-gray-400">Francos</div>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-3 border border-border dark:border-gray-700 text-center">
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{totalHolidaysWorked}</div>
            <div className="text-[10px] text-muted dark:text-gray-400">Feriados trabajados</div>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-3 border border-border dark:border-gray-700 text-center">
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{totalDiurnas.toFixed(1)}</div>
            <div className="text-[10px] text-muted dark:text-gray-400">Horas diurnas</div>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-3 border border-border dark:border-gray-700 text-center">
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{totalNocturnas.toFixed(1)}</div>
            <div className="text-[10px] text-muted dark:text-gray-400">Horas nocturnas</div>
          </div>
          <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-3 border border-border dark:border-gray-700 text-center">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{totalExtras.toFixed(1)}</div>
            <div className="text-[10px] text-muted dark:text-gray-400">Horas extras</div>
          </div>
        </div>
      )}

      {selectedEmp && (
        <div className="bg-card dark:bg-gray-800 rounded-xl shadow border border-border dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{MONTH_NAMES[month - 1]} {year}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMultiSelectMode}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  multiSelectMode
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {multiSelectMode ? "Salir selección" : "Seleccionar varios"}
              </button>
              {multiSelectMode && (
                <>
                  <button onClick={selectAllDays} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600">
                    Todos
                  </button>
                  <button onClick={clearSelection} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600">
                    Limpiar
                  </button>
                  {selectedDays.size > 0 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{selectedDays.size} día{selectedDays.size !== 1 ? "s" : ""}</span>
                  )}
                </>
              )}
            </div>
          </div>

          {multiSelectMode && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">Click para seleccionar/deseleccionar · Shift+click para seleccionar rango</div>
          )}

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted dark:text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;

              const ds = dateStr(year, month, day);
              const rec = recordMap[ds];
              const isSelectedSingle = selectedDay === ds;
              const isSelectedMulti = selectedDays.has(ds);
              const isToday = new Date().toISOString().slice(0, 10) === ds;

              let bg = "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700";
              let textColor = "text-gray-700 dark:text-gray-200";
              if (rec?.is_franco) { bg = "bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50"; textColor = "text-purple-700 dark:text-purple-300"; }
              else if (rec?.is_holiday) { bg = "bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50"; textColor = "text-orange-700 dark:text-orange-300"; }
              else if (rec && rec.total_hours > 0) { bg = "bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50"; textColor = "text-green-700 dark:text-green-300"; }

              const ringClass = multiSelectMode && isSelectedMulti
                ? "ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/40"
                : isSelectedSingle
                  ? "ring-2 ring-blue-500"
                  : isToday
                    ? "ring-1 ring-blue-300 dark:ring-blue-600"
                    : "border-transparent";

              return (
                <button
                  key={day}
                  onClick={(e) => handleDayClick(day, e)}
                  className={`relative p-1.5 rounded-lg text-left transition-colors min-h-[60px] sm:min-h-[70px] border ${bg} ${ringClass}`}
                >
                  {multiSelectMode && (
                    <div className={`absolute top-1 right-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelectedMulti ? "bg-blue-500 border-blue-500" : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700"
                    }`}>
                      {isSelectedMulti && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div className={`text-xs font-bold ${textColor}`}>{day}</div>
                  {rec?.is_franco && <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Franco</div>}
                  {rec?.is_holiday && <div className="text-[10px] text-orange-600 dark:text-orange-400 font-medium truncate">{rec.holiday_name || "Fer."}</div>}
                  {rec && !rec.is_franco && rec.total_hours > 0 && (
                    <div className="text-[10px] text-green-600 dark:text-green-400 font-medium">{rec.total_hours}h</div>
                  )}
                  {rec && !rec.is_franco && rec.entry_time && (
                    <div className="text-[9px] text-gray-400 dark:text-gray-500 truncate">{rec.entry_time}-{rec.exit_time || "?"}</div>
                  )}
                </button>
              );
            })}
          </div>

          {loading && <div className="text-center text-gray-400 dark:text-gray-500 text-sm mt-3">Cargando...</div>}

          <div className="flex justify-center mt-3">
            <button
              onClick={handleBulkFill}
              disabled={bulkFilling}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium disabled:opacity-50"
            >
              {bulkFilling ? "Rellenando..." : "Rellenar mes (07:00-15:00)"}
            </button>
          </div>
        </div>
      )}

      {multiSelectMode && selectedDays.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow p-6 border border-blue-200 dark:border-blue-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
              Editar {selectedDays.size} día{selectedDays.size !== 1 ? "s" : ""} seleccionado{selectedDays.size !== 1 ? "s" : ""}
            </h2>
            <button onClick={clearSelection} className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xl">&times;</button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div>
              <label className="block text-xs text-muted dark:text-gray-400 mb-1">Entrada</label>
              <input
                type="time"
                value={bulkForm.entry_time}
                onChange={(e) => setBulkForm({ ...bulkForm, entry_time: e.target.value })}
                className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-muted dark:text-gray-400 mb-1">Salida</label>
              <input
                type="time"
                value={bulkForm.exit_time}
                onChange={(e) => setBulkForm({ ...bulkForm, exit_time: e.target.value })}
                className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white"
              />
            </div>
            {bulkForm.entry_time && bulkForm.exit_time && (
              <div className="bg-blue-100 dark:bg-blue-800/40 px-3 py-2 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-medium">
                = {calcBulkAutoHours()}hs
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bulkForm.is_franco}
                onChange={(e) => setBulkForm({ ...bulkForm, is_franco: e.target.checked })}
                id="bulk-franco"
                className="rounded"
              />
              <label htmlFor="bulk-franco" className="text-sm">Franco</label>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-muted dark:text-gray-400 mb-1">Notas</label>
              <input
                type="text"
                value={bulkForm.notes}
                onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white"
                placeholder="Opcional"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkSave}
                disabled={bulkSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 font-medium"
              >
                {bulkSaving ? "Guardando..." : `Aplicar a ${selectedDays.size} día${selectedDays.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDay && (
        <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-6 border border-border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            <button onClick={() => setSelectedDay(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div>
              <label className="block text-xs text-muted dark:text-gray-400 mb-1">Entrada</label>
              <input
                type="time"
                value={form.entry_time}
                onChange={(e) => setForm({ ...form, entry_time: e.target.value })}
                className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-muted dark:text-gray-400 mb-1">Salida</label>
              <input
                type="time"
                value={form.exit_time}
                onChange={(e) => setForm({ ...form, exit_time: e.target.value })}
                className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white"
              />
            </div>
            {form.entry_time && form.exit_time && (
              <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-medium">
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
              <label className="block text-xs text-muted dark:text-gray-400 mb-1">Notas</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white"
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
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm"
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
