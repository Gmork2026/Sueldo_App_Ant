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

  useEffect(() => {
    api.employees.list().then((data) => setEmployees(data.filter((e) => e.active)));
  }, []);

  const loadPayrolls = async () => {
    if (!selectedEmp) return;
    setLoading(true);
    try {
      const data = await api.payroll.list(selectedEmp);
      setPayrolls(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadPayrolls(); }, [selectedEmp]);

  const handleCalculate = async () => {
    if (!selectedEmp) return;
    setCalculating(true);
    try {
      await api.payroll.calculate(selectedEmp, month, year, diasVacaciones);
      loadPayrolls();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al calcular");
    }
    setCalculating(false);
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const formatMoney = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Liquidaciones</h1>

      <div className="flex gap-4 mb-6 flex-wrap items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Empleado</label>
          <select value={selectedEmp || ""} onChange={(e) => setSelectedEmp(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Seleccionar empleado</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mes</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm">
            {monthNames.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Año</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm">
            {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Días vacaciones</label>
          <input type="number" min="0" max="30" value={diasVacaciones} onChange={(e) => setDiasVacaciones(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm w-20" />
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
          <div className="text-gray-500">Cargando...</div>
        ) : payrolls.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay liquidaciones para este empleado</div>
        ) : (
          <div className="bg-white rounded-xl shadow border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Período</th>
                  <th className="text-right px-4 py-3 font-medium">Básico</th>
                  <th className="text-right px-4 py-3 font-medium">Bruto</th>
                  <th className="text-right px-4 py-3 font-medium">Deducciones</th>
                  <th className="text-right px-4 py-3 font-medium">Neto</th>
                  <th className="text-right px-4 py-3 font-medium">SAC Neto</th>
                  <th className="text-right px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{monthNames[p.month - 1]} {p.year}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(p.basic_salary)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(p.gross_salary)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatMoney(p.deductions)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(p.net_salary)}</td>
                    <td className="px-4 py-3 text-right">{p.sac_neto > 0 ? formatMoney(p.sac_neto) : "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => api.payroll.export(p.id)} className="text-blue-600 hover:underline text-xs">Exportar Excel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </AppLayout>
  );
}
