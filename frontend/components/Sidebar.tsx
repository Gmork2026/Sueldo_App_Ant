"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth";
import Logo from "./Logo";
import { ThemeToggle } from "../lib/theme";

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout, isAdmin, isSuperAdmin, isEmployee } = useAuth();

  const navItems = [
    ...(!isEmployee ? [
      { href: "/empleados", label: "Empleados", icon: "👥" },
    ] : []),
    { href: "/fichadas", label: "Ficha horas", icon: "📋" },
    ...(!isEmployee ? [
      { href: "/liquidaciones", label: "Liquidaciones", icon: "💰" },
      { href: "/importar", label: "Importar Excel", icon: "📥" },
    ] : []),
    ...(isSuperAdmin ? [
      { href: "/usuarios", label: "Usuarios", icon: "🔑" },
    ] : []),
    { href: "/perfil", label: "Mi Perfil", icon: "⚙️" },
  ];

  const roleLabel = isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Empleado";
  const roleColor = isSuperAdmin ? "bg-purple-600" : isAdmin ? "bg-blue-600" : "bg-white/20 dark:bg-white/10";

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col
        transition-transform duration-200 ease-in-out
        md:static md:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Logo size="md" />
          <button onClick={onClose} className="md:hidden text-white/60 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="px-4 pb-3 text-xs opacity-70 text-[var(--sidebar-text)] border-b border-white/10">Liquidación de sueldos</p>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
          <div className="flex items-center justify-between mb-2">
            <div className="px-3 py-2 text-xs opacity-70 truncate flex-1">{user?.email}</div>
            <ThemeToggle className="text-[var(--sidebar-text)] hover:text-white hover:bg-white/10" />
          </div>
          <div className="px-3 py-1 text-xs">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${roleColor}`}>
              {roleLabel}
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
    </>
  );
}
