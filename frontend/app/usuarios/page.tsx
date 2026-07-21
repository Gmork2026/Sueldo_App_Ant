"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "../../components/AppLayout";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export default function UsuariosPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ email: "", password: "", role: "employee" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push("/empleados");
    }
  }, [isSuperAdmin, loading, router]);

  const load = async () => {
    try {
      const data = await api.auth.listUsers();
      setUsers(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        const payload: { email?: string; role?: string; password?: string } = {
          email: form.email,
          role: form.role,
        };
        if (form.password) payload.password = form.password;
        await api.auth.updateUser(editing.id, payload);
      } else {
        if (!form.password) {
          setError("La contraseña es obligatoria para nuevos usuarios");
          return;
        }
        await api.auth.register(form.email, form.password, form.role);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ email: "", password: "", role: "employee" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleEdit = (user: User) => {
    setEditing(user);
    setForm({ email: user.email, password: "", role: user.role });
    setShowForm(true);
  };

  const handleDelete = async (id: number, email: string) => {
    if (!confirm(`¿Eliminar usuario ${email}?`)) return;
    try {
      await api.auth.deleteUser(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const roleBadge = (role: string) => {
    if (role === "superadmin") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Super Admin</span>;
    if (role === "admin") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Admin</span>;
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Empleado</span>;
  };

  if (!isSuperAdmin && !loading) {
    return null;
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button
          onClick={() => { setEditing(null); setForm({ email: "", password: "", role: "employee" }); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + Nuevo Usuario
        </button>
      </div>

      {showForm && (
        <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-6 mb-6 border border-border dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">{editing ? "Editar Usuario" : "Nuevo Usuario"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white"
            />
            <input
              placeholder={editing ? "Nueva contraseña (vacío = no cambiar)" : "Contraseña"}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing}
              className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-input-bg dark:bg-gray-700 dark:text-white"
            >
              <option value="employee">Empleado</option>
              <option value="admin">Administrador</option>
            </select>
            <div className="flex gap-2 md:col-span-3">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                {editing ? "Guardar Cambios" : "Crear Usuario"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm dark:text-white">
                Cancelar
              </button>
            </div>
            {error && <div className="text-red-600 dark:text-red-400 text-sm md:col-span-3">{error}</div>}
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-muted dark:text-gray-400">Cargando usuarios...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          No hay usuarios. Usá <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">POST /api/auth/seed</code> para crear el primer superadmin.
        </div>
      ) : (
        <div className="bg-card dark:bg-gray-800 rounded-xl shadow border border-border dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-border dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Rol</th>
                <th className="text-left px-4 py-3 font-medium">Creado</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3 text-muted dark:text-gray-400">{new Date(u.created_at).toLocaleDateString("es-AR")}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleEdit(u)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(u.id, u.email)} className="text-red-600 dark:text-red-400 hover:underline text-xs">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
