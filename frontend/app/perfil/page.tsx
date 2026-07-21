"use client";

import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

export default function PerfilPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const roleLabel = user?.role === "superadmin" ? "Super Admin" : user?.role === "admin" ? "Administrador" : "Empleado";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (newPassword.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar contraseña");
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>

      <div className="max-w-lg">
        <div className="bg-card dark:bg-gray-800 rounded-xl shadow border border-border dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Información de cuenta</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted dark:text-gray-400">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted dark:text-gray-400">Rol:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                user?.role === "superadmin" ? "bg-purple-600" :
                user?.role === "admin" ? "bg-blue-600" : "bg-gray-500"
              }`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card dark:bg-gray-800 rounded-xl shadow border border-border dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4">Cambiar contraseña</h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-4">
              Contraseña actualizada correctamente.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-input-bg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-input-bg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la nueva contraseña"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-input-bg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
