"use client";

import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../lib/api";
import type { Employee, Payroll } from "../../lib/types";

export default function LiquidacionesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<number | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [diasVacaciones, setDiasVacaciones] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    api.employees.list().then((data) => setEmployees(data.filter((e) => e.active)));
  }, []);

  const loadPayrolls = async () => {
    if (!selectedEmp) return;
    setLoading(true);
    try {
      const data = await api.payroll.list(selectedEmp);
      setPayrolls(data);
    } catch { setPayrolls([]); }
    setLoading(false);
  };

  useEffect(() => { loadPayrolls(); }, [selectedEmp]);

  const handleCalculate = async () => {
    if (!selectedEmp) return;
    setCalculating(true);
    try {
      await api.payroll.calculate(selectedEmp, month, year, diasVacaciones);
      await loadPayrolls();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al calcular");
    }
    setCalculating(false);
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const formatMoney = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

  const Breakdown = ({ p }: { p: Payroll }) => (
    <div className="space-y-3 text-sm">
      {/* Horas */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
        <div className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Horas del Mes</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Base requerida</div>
            <div className="font-medium">{p.base_hours} hs</div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Horas trabajadas</div>
            <div className="font-medium">{p.total_hours_worked} hs</div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Horas extras</div>
            <div className="font-bold text-orange-600 dark:text-orange-400">{p.overtime_hours} hs</div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Feriados (L a V)</div>
            <div className="font-medium">{p.holiday_hours} dias</div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Presentismo</div>
            <div className={`font-bold ${p.has_presentismo ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {p.has_presentismo ? "ALCANZADO" : "PERDIDO"}
            </div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Antiguedad</div>
            <div className="font-medium text-cyan-600 dark:text-cyan-400">
              {p.seniority_years} {p.seniority_years === 1 ? "ano" : "anos"} (+{formatMoney(p.seniority_amount)})
            </div>
          </div>
        </div>
      </div>

      {/* Vacaciones */}
      {p.dias_vacaciones > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
          <div className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
            Vacaciones: {p.dias_vacaciones} dias
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <div className="text-muted dark:text-gray-400 text-xs">Dias trabajados</div>
              <div className="font-medium">{p.dias_trabajados} dias</div>
            </div>
            <div>
              <div className="text-muted dark:text-gray-400 text-xs">Basico trabajado</div>
              <div className="font-medium">{formatMoney(p.pago_basico_trabajado)}</div>
            </div>
            <div>
              <div className="text-muted dark:text-gray-400 text-xs">Pago vacaciones</div>
              <div className="font-medium">{formatMoney(p.pago_vacaciones)}</div>
            </div>
            <div>
              <div className="text-muted dark:text-gray-400 text-xs">Plus vacacional</div>
              <div className="font-bold text-yellow-600 dark:text-yellow-400">+{formatMoney(p.plus_vacacional)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Composicion Salarial */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
        <div className="font-semibold mb-2">Composicion Salarial</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Basico</div>
            <div className="font-medium">{formatMoney(p.basic_salary)}</div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Presentismo</div>
            <div className="font-medium">{formatMoney(p.presentismo)}</div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Antiguedad</div>
            <div className="font-medium">{formatMoney(p.seniority_amount)}</div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Horas extras</div>
            <div className="font-medium">{formatMoney(p.overtime_amount)}</div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Feriados</div>
            <div className="font-medium">{formatMoney(p.holiday_amount)}</div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">Viaticos</div>
            <div className="font-medium">{formatMoney(p.viaticos)}</div>
          </div>
          <div>
            <div className="text-muted dark:text-gray-400 text-xs">No remunerativo</div>
            <div className="font-medium">{formatMoney(p.non_remunerative)}</div>
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
        <div className="font-semibold text-green-700 dark:text-green-300 mb-2">Resumen Salarial</div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted dark:text-gray-400">Remunerativo</span>
            <span className="font-medium">{formatMoney(p.gross_salary)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted dark:text-gray-400">No remunerativo</span>
            <span className="font-medium">{formatMoney(p.viaticos + p.non_remunerative)}</span>
          </div>
          <div className="border-t border-green-200 dark:border-green-800 pt-1.5">
            <div className="flex justify-between">
              <span className="text-muted dark:text-gray-400">Desc. 17% cargas sociales</span>
              <span className="text-red-600 dark:text-red-400">-{formatMoney(p.deduccion_porcentaje)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted dark:text-gray-400">Obra Social (cuota fija)</span>
              <span className="text-red-600 dark:text-red-400">-{formatMoney(p.deduccion_os_fija)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm mt-1">
              <span className="text-muted dark:text-gray-400">Total retenciones</span>
              <span className="text-red-600 dark:text-red-400">-{formatMoney(p.deductions)}</span>
            </div>
          </div>
          <div className="border-t border-green-200 dark:border-green-800 pt-1.5 flex justify-between text-lg">
            <span className="font-bold">NETO A COBRAR</span>
            <span className="font-bold text-green-700 dark:text-green-400">{formatMoney(p.net_salary)}</span>
          </div>
        </div>
      </div>

      {/* SAC */}
      {p.sac_neto > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
          <div className="font-semibold text-amber-700 dark:text-amber-300 mb-2">
            Sueldo Anual Complementario (SAC)
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted dark:text-gray-400">SAC Bruto</span>
              <span className="font-medium">{formatMoney(p.sac_bruto)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted dark:text-gray-400">Desc. 17% cargas sociales</span>
              <span className="text-red-600 dark:text-red-400">-{formatMoney(p.sac_deducciones)}</span>
            </div>
            <div className="border-t border-amber-200 dark:border-amber-800 pt-1.5 flex justify-between font-bold">
              <span>SAC NETO A COBRAR</span>
              <span className="text-amber-600 dark:text-amber-400">{formatMoney(p.sac_neto)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Liquidaciones</h1>

      <div className="flex gap-4 mb-6 flex-wrap items-end">
        <div>
          <label className="block text-xs text-muted dark:text-gray-400 mb-1">Empleado</label>
          <select value={selectedEmp || ""} onChange={(e) => setSelectedEmp(Number(e.target.value))} className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white">
            <option value="">Seleccionar empleado</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted dark:text-gray-400 mb-1">Mes</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white">
            {monthNames.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted dark:text-gray-400 mb-1">Año</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm bg-input-bg dark:bg-gray-700 dark:text-white">
            {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted dark:text-gray-400 mb-1">Días vacaciones</label>
          <input type="number" min="0" max="30" value={diasVacaciones} onChange={(e) => setDiasVacaciones(Number(e.target.value))} className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-sm w-20 bg-input-bg dark:bg-gray-700 dark:text-white" />
        </div>
        <button
          onClick={handleCalculate}
          disabled={!selectedEmp || calculating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
        >
          {calculating ? "Calculando..." : "Calcular Liquidación"}
        </button>
      </div>

      {selectedEmp && (
        loading ? (
          <div className="text-muted dark:text-gray-400">Cargando...</div>
        ) : payrolls.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">No hay liquidaciones para este empleado</div>
        ) : (
          <div className="space-y-3">
            {payrolls.map((p) => {
              const isExpanded = expandedId === p.id;
              return (
                <div key={p.id} className="bg-card dark:bg-gray-800 rounded-xl shadow border border-border dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-sm">{monthNames[p.month - 1]} {p.year}</span>
                      <span className="text-xs text-muted dark:text-gray-400 hidden sm:inline">
                        Básico: {formatMoney(p.basic_salary)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-green-700 dark:text-green-400 text-sm">{formatMoney(p.net_salary)}</span>
                      <svg className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => api.payroll.export(p.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                        >
                          Exportar Excel
                        </button>
                      </div>
                      <Breakdown p={p} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </AppLayout>
  );
}
