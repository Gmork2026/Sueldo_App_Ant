"use client";

import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import { api } from "../../lib/api";

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handlePreview = async () => {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const data = await api.import.preview(file);
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al previsualizar");
    }
    setLoading(false);
  };

  const handleExecute = async () => {
    if (!file) return;
    if (!confirm("¿Confirmar importación?")) return;
    setError("");
    setLoading(true);
    try {
      const data = await api.import.execute(file);
      setResult(data);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Importar Empleados desde Excel</h1>

      <div className="bg-card dark:bg-gray-800 rounded-xl shadow p-6 border border-border dark:border-gray-700 max-w-2xl">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Subí un archivo Excel (.xlsx) con los datos de los empleados.
          El sistema reconoce estas columnas: <strong>VIGILADOR</strong> (nombre), <strong>DNI</strong>, <strong>CATEGORIA</strong>, <strong>F. ALTA</strong> (fecha de alta en la empresa), <strong>MES ALTA</strong>, <strong>LEG</strong> (legajo), <strong>MAIL</strong>.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Nota: &quot;Fecha de Alta&quot; es la fecha en que el empleado ingresó a la empresa, no es un horario ni día de semana.
        </p>

        <div className="mb-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setPreview(null);
              setResult(null);
            }}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={!file || loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Previsualizar"}
          </button>
          {preview && (
            <button
              onClick={handleExecute}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
            >
              Confirmar Importación
            </button>
          )}
        </div>

        {error && <div className="mt-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">{error}</div>}

        {preview && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Vista previa</h3>
            <pre className="text-xs text-blue-700 dark:text-blue-400 overflow-auto max-h-64">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        )}

        {result && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Importación completada</h3>
            <pre className="text-xs text-green-700 dark:text-green-400 overflow-auto max-h-64">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
