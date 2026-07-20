"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth";
import Logo from "./Logo";

const navItems = [
  { href: "/empleados", label: "Empleados", icon: "👥" },
  { href: "/fichadas", label: "Fichadas", icon: "📋" },
  { href: "/liquidaciones", label: "Liquidaciones", icon: "💰" },
  { href: "/importar", label: "Importar Excel", icon: "📥", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col min-h-screen">
      <div className="p-4 border-b border-white/10">
        <Logo size="md" />
        <p className="text-xs mt-1 opacity-70 text-[var(--sidebar-text)]">Liquidación de sueldos</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-[var(--sidebar-active)] text-white"
                    : "hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="px-3 py-2 text-xs opacity-70 truncate">{user?.email}</div>
        <div className="px-3 py-1 text-xs">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isAdmin ? "bg-blue-600 text-white" : "bg-white/20 text-white"}`}>
            {isAdmin ? "Admin" : "Empleado"}
          </span>
        </div>
        <button
          onClick={logout}
          className="w-full mt-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
