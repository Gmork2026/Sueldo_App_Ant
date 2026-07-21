"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "../../components/Logo";
import { api } from "../../lib/api";

export default function RegistroPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [dni, setDni] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSearchDNI = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.registerByDNI(dni, "temp@temp.com", "temp123");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      if (msg.includes("ya tiene una cuenta")) {
        setError("Este DNI ya tiene una cuenta asociada. Iniciá sesión normalmente.");
        setLoading(false);
        return;
      }
      if (msg.includes("No se encontró")) {
        setError("No se encontró un empleado activo con ese DNI. Verificá con tu administrador.");
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  };

  const handleSearchDNIOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.auth.lookupDNI(dni);
      if (!result.found) {
        setError("No se encontró un empleado activo con ese DNI.");
        setLoading(false);
        return;
      }
      if (result.has_account) {
        setError("Este empleado ya tiene una cuenta asociada. Iniciá sesión normalmente.");
        setLoading(false);
        return;
      }
      setEmployeeName(result.name!);
      setStep(2);
    } catch {
      setError("Error al buscar empleado.");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.registerByDNI(dni, email, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-700 mb-2">Cuenta creada</h1>
          <p className="text-gray-600 mb-6">
            Tu cuenta fue creada exitosamente. Ya podés iniciar sesión.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <Logo size="lg" />
          <p className="text-gray-500 mt-3 text-sm">Creá tu cuenta de empleado</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSearchDNIOnly} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ingresá tu DNI"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !dni}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Buscar mi ficha"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm">
              Empleado encontrado: <strong>{employeeName}</strong>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí tu contraseña"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Creando cuenta..." : "Crear mi cuenta"}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setEmployeeName(""); setError(""); }}
              className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Volver
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Iniciá sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
