"use client";

import {
  Users,
  FolderKanban,
  Workflow,
  Activity,
  TrendingUp,
  UserPlus,
  FileText,
  Zap,
  Settings2,
  ArrowUpRight,
  Clock,
} from "lucide-react";

const stats = [
  {
    label: "Total Users",
    value: "1,247",
    change: "+12%",
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  {
    label: "Active Projects",
    value: "38",
    change: "+4%",
    icon: FolderKanban,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    label: "Flows Created",
    value: "156",
    change: "+23%",
    icon: Workflow,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    label: "API Calls Today",
    value: "12,891",
    change: "+8%",
    icon: Activity,
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-400/10",
    border: "border-fuchsia-400/20",
  },
];

const recentActivity = [
  { text: "New user registered", detail: "john@example.com", time: "2 min ago", icon: UserPlus, color: "text-emerald-400" },
  { text: "Flow executed successfully", detail: "Project: Brand Assets", time: "8 min ago", icon: Zap, color: "text-amber-400" },
  { text: "Project created", detail: "Marketing Campaign Q1", time: "23 min ago", icon: FolderKanban, color: "text-blue-400" },
  { text: "API rate limit warning", detail: "HuggingFace provider at 85%", time: "1 hr ago", icon: Activity, color: "text-red-400" },
  { text: "User updated settings", detail: "sarah@example.com", time: "2 hr ago", icon: Settings2, color: "text-gray-400" },
  { text: "New flow published", detail: "Character Pipeline v2", time: "3 hr ago", icon: Workflow, color: "text-fuchsia-400" },
];

const quickActions = [
  { label: "Manage Users", description: "View and manage user accounts", icon: Users, color: "text-blue-400", bg: "hover:bg-blue-400/5" },
  { label: "View Logs", description: "Monitor system activity logs", icon: FileText, color: "text-emerald-400", bg: "hover:bg-emerald-400/5" },
  { label: "API Usage", description: "Check provider quotas and usage", icon: Activity, color: "text-fuchsia-400", bg: "hover:bg-fuchsia-400/5" },
  { label: "System Settings", description: "Configure global preferences", icon: Settings2, color: "text-gray-400", bg: "hover:bg-gray-400/5" },
];

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BackofficeDashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-6">
        <h1 className="text-2xl font-bold text-white">Welcome back, Admin</h1>
        <p className="mt-1 text-sm text-gray-400">{formatDate()}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border ${stat.border} ${stat.bg} p-5 transition-colors`}
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">Recent Activity</h2>
            <Clock className="w-4 h-4 text-gray-500" />
          </div>
          <div className="space-y-1">
            {recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-800/50"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/80 shrink-0">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{item.text}</p>
                  <p className="text-xs text-gray-500 truncate">{item.detail}</p>
                </div>
                <span className="text-[11px] text-gray-600 whitespace-nowrap shrink-0">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className={`w-full flex items-center gap-3 rounded-lg border border-gray-800 px-4 py-3 text-left transition-colors ${action.bg}`}
              >
                <action.icon className={`w-4 h-4 ${action.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
