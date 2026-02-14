"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  BarChart3,
  Settings2,
  LogOut,
} from "lucide-react";
import { clearBoTokens } from "@/lib/backoffice-auth";

const navItems = [
  { href: "/backoffice", icon: LayoutDashboard, label: "Dashboard", color: "text-blue-400" },
  { href: "/backoffice/users", icon: Users, label: "Users", color: "text-emerald-400" },
  { href: "/backoffice/projects", icon: FolderKanban, label: "Projects", color: "text-amber-400" },
  { href: "/backoffice/analytics", icon: BarChart3, label: "Analytics", color: "text-fuchsia-400" },
  { href: "/backoffice/settings", icon: Settings2, label: "Settings", color: "text-gray-400" },
];

export function BackofficeSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearBoTokens();
    router.replace("/backoffice/login");
  };

  return (
    <aside className="w-14 border-r border-gray-800 bg-gray-950 flex flex-col items-center py-3 gap-1 shrink-0">
      {navItems.map((item) => {
        const isActive =
          item.href === "/backoffice"
            ? pathname === "/backoffice"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              isActive
                ? "bg-gray-800 text-white"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive ? item.color : ""}`} />
            <span className="absolute left-full ml-2 px-2 py-1 text-[11px] font-medium text-white bg-gray-800 border border-gray-700 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {item.label}
            </span>
          </Link>
        );
      })}

      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="relative group flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800/50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 text-[11px] font-medium text-white bg-gray-800 border border-gray-700 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
