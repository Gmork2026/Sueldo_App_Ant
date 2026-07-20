"use client";

import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Employee } from "../../lib/types";

export default function EmpleadosPage() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", dni: "", category: "", admission_date: "", legajo: "" });
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await api.employees.list();
      setEmployees(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await api.employees.update(editing.id, form);
      } else {
        await api.employees.create(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", dni: "", category: "", admission_date: "", legajo: "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ name: emp.name, dni: emp.dni, category: emp.category, admission_date: emp.admission_date, legajo: emp.legajo || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Desactivar este empleado?")) return;
    await api.employees.delete(id);
    load();
  };

  const categories = [
    "Vigilador", "Cabo", "Sargento", "Suboficial",
    "Oficial", "Jefe de Seguridad", "Director", "Gerente", "Cajero"
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Empleados</h1>
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setForm({ name: "", dni: "", category: "", admission_date: "", legajo: "" }); setShowForm(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + Nuevo Empleado
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 border">
          <h2 className="text-lg font-semibold mb-4">{editing ? "Editar Empleado" : "Nuevo Empleado"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-3 py-2 border rounded-lg" />
            <input placeholder="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required className="px-3 py-2 border rounded-lg" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="px-3 py-2 border rounded-lg">
              <option value="">Seleccionar categoría</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" placeholder="Fecha de ingreso" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} required className="px-3 py-2 border rounded-lg" />
            <input placeholder="Legajo (opcional)" value={form.legajo} onChange={(e) => setForm({ ...form, legajo: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                {editing ? "Guardar Cambios" : "Crear Empleado"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm">
                Cancelar
              </button>
            </div>
            {error && <div className="text-red-600 text-sm md:col-span-2">{error}</div>}
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Cargando empleados...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No hay empleados cargados
          {isAdmin && <p className="text-sm mt-2">Creá uno nuevo o importá desde Excel</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">DNI</th>
                <th className="text-left px-4 py-3 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 font-medium">Legajo</th>
                <th className="text-left px-4 py-3 font-medium">Ingreso</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                {isAdmin && <th className="text-right px-4 py-3 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{emp.name}</td>
                  <td className="px-4 py-3">{emp.dni}</td>
                  <td className="px-4 py-3">{emp.category}</td>
                  <td className="px-4 py-3">{emp.legajo || "-"}</td>
                  <td className="px-4 py-3">{emp.admission_date}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${emp.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {emp.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:underline text-xs">Editar</button>
                      <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:underline text-xs">Desactivar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
