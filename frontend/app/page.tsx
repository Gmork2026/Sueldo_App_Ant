"use client";

import { useAuth } from "../lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/empleados" : "/login");
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-500">Cargando...</div>
    </div>
  );
}
