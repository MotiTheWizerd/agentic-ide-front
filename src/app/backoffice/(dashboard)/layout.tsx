"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { isBoAuthenticated } from "@/lib/backoffice-auth";
import { BackofficeSidebar } from "@/components/backoffice/backoffice-sidebar";
import { GradientText } from "@/components/landing/gradient-text";

export default function BackofficeDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isBoAuthenticated()) {
      router.replace("/backoffice/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div className="h-screen flex bg-gray-950 text-white">
      <BackofficeSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <GradientText className="text-lg font-bold">Backoffice</GradientText>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Admin</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xs font-semibold select-none">
              A
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
