"use client";

import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Employee } from "../../lib/types";

const CATEGORIES = [
  "Vigilador General",
  "Vigilador Bombero",
  "Administrativo",
  "Vigilador Principal",
  "Verificación de Eventos",
  "Operador de Monitoreo",
  "Guía Técnico",
  "Instalador Sist. Electrónicos",
  "Controlador de Admisión y Permanencia General",
];

export default function EmpleadosPage() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", dni: "", category: "", admission_date: "", legajo: "" });
  const [error, setError] = useState("");

  const [createUser, setCreateUser] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", password: "", role: "employee" });
  const [showLinkAccount, setShowLinkAccount] = useState<number | null>(null);
  const [linkForm, setLinkForm] = useState({ email: "", password: "", role: "employee" });

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
        const emp = await api.employees.create(form);
        if (createUser && userForm.email && userForm.password) {
          try {
            await api.auth.register(userForm.email, userForm.password, userForm.role, emp.id);
          } catch (err) {
            setError("Empleado creado pero error al crear cuenta: " + (err instanceof Error ? err.message : "Error"));
            setShowForm(false);
            setEditing(null);
            load();
            return;
          }
        }
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", dni: "", category: "", admission_date: "", legajo: "" });
      setCreateUser(false);
      setUserForm({ email: "", password: "", role: "employee" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ name: emp.name, dni: emp.dni, category: emp.category, admission_date: emp.admission_date, legajo: emp.legajo || "" });
    setCreateUser(false);
    setUserForm({ email: "", password: "", role: "employee" });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Desactivar este empleado?")) return;
    await api.employees.delete(id);
    load();
  };

  const handleLinkAccount = async (empId: number) => {
    setError("");
    try {
      await api.auth.register(linkForm.email, linkForm.password, linkForm.role, empId);
      setShowLinkAccount(null);
      setLinkForm({ email: "", password: "", role: "employee" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cuenta");
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Empleados</h1>
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setForm({ name: "", dni: "", category: "", admission_date: "", legajo: "" }); setCreateUser(false); setUserForm({ email: "", password: "", role: "employee" }); setShowForm(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + Nuevo Empleado
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-6 mb-6 border border-border dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">{editing ? "Editar Empleado" : "Nuevo Empleado"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white" />
            <input placeholder="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white">
              <option value="">Seleccionar categoría</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div>
              <label className="block text-xs text-muted dark:text-gray-400 mb-1">Fecha de Alta</label>
              <input type="date" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} required className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg w-full bg-input-bg dark:bg-gray-700 dark:text-white" />
            </div>
            <input placeholder="Legajo (opcional)" value={form.legajo} onChange={(e) => setForm({ ...form, legajo: e.target.value })} className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white" />

            {!editing && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createUser}
                    onChange={(e) => setCreateUser(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Crear cuenta de usuario para este empleado</span>
                </label>
              </div>
            )}

            {createUser && !editing && (
              <>
                <input type="email" placeholder="Email del empleado" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white" />
                <input type="password" placeholder="Contraseña temporal" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white" />
                {isSuperAdmin && (
                  <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white">
                    <option value="employee">Empleado</option>
                    <option value="admin">Administrador</option>
                  </select>
                )}
              </>
            )}

            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                {editing ? "Guardar Cambios" : "Crear Empleado"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm dark:text-white">
                Cancelar
              </button>
            </div>
            {error && <div className="text-red-600 dark:text-red-400 text-sm md:col-span-2">{error}</div>}
          </form>
        </div>
      )}

      {showLinkAccount !== null && (
        <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-6 mb-6 border border-border dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Crear cuenta de usuario</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleLinkAccount(showLinkAccount); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="email" placeholder="Email del empleado" value={linkForm.email} onChange={(e) => setLinkForm({ ...linkForm, email: e.target.value })} required className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white" />
            <input type="password" placeholder="Contraseña temporal" value={linkForm.password} onChange={(e) => setLinkForm({ ...linkForm, password: e.target.value })} required className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white" />
            {isSuperAdmin && (
              <select value={linkForm.role} onChange={(e) => setLinkForm({ ...linkForm, role: e.target.value })} className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white">
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
            )}
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Crear Cuenta</button>
              <button type="button" onClick={() => { setShowLinkAccount(null); setLinkForm({ email: "", password: "", role: "employee" }); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm dark:text-white">Cancelar</button>
            </div>
            {error && <div className="text-red-600 dark:text-red-400 text-sm md:col-span-2">{error}</div>}
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-muted dark:text-gray-400">Cargando empleados...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          No hay empleados cargados
          {isAdmin && <p className="text-sm mt-2">Creá uno nuevo o importá desde Excel</p>}
        </div>
      ) : (
        <div className="bg-card dark:bg-gray-800 rounded-xl shadow border border-border dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-border dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">DNI</th>
                <th className="text-left px-4 py-3 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 font-medium">Legajo</th>
                <th className="text-left px-4 py-3 font-medium">Fecha Alta</th>
                <th className="text-left px-4 py-3 font-medium">Cuenta</th>
                {isAdmin && <th className="text-right px-4 py-3 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium">{emp.name}</td>
                  <td className="px-4 py-3">{emp.dni}</td>
                  <td className="px-4 py-3">{emp.category}</td>
                  <td className="px-4 py-3">{emp.legajo || "-"}</td>
                  <td className="px-4 py-3">{emp.admission_date}</td>
                  <td className="px-4 py-3">
                    {emp.user_id ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Con cuenta</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Sin cuenta</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit(emp)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">Editar</button>
                      {!emp.user_id && (
                        <button onClick={() => { setShowLinkAccount(emp.id); setLinkForm({ email: "", password: "", role: "employee" }); }} className="text-green-600 dark:text-green-400 hover:underline text-xs">Crear cuenta</button>
                      )}
                      <button onClick={() => handleDelete(emp.id)} className="text-red-600 dark:text-red-400 hover:underline text-xs">Desactivar</button>
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
