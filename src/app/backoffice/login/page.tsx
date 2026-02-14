"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { setBoTokens } from "@/lib/backoffice-auth";
import api from "@/lib/api";

export default function BackofficeLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/backoffice/login", {
        identifier: email,
        password,
      });
      setBoTokens(data.access_token, data.refresh_token);
      router.push("/backoffice");
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: unknown } } }
      )?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg || "").join(", "));
      } else {
        setError("Unable to connect to server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to main app */}
        <Link
          href="/home"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to main app
        </Link>

        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center">
            <Shield className="h-10 w-10 text-purple-400" />
          </div>
          <h1 className="mb-2 text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Backoffice
          </h1>
          <p className="text-sm text-gray-400">Admin Panel</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/60 p-8 shadow-xl shadow-black/20 backdrop-blur-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-200">
            Sign in to admin
          </h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="bo-email"
                className="mb-1.5 block text-sm font-medium text-gray-400"
              >
                Email
              </label>
              <input
                id="bo-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full rounded-lg border border-gray-600 bg-gray-900/70 px-4 py-2.5 text-white placeholder-gray-500 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label
                htmlFor="bo-password"
                className="mb-1.5 block text-sm font-medium text-gray-400"
              >
                Password
              </label>
              <input
                id="bo-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-gray-600 bg-gray-900/70 px-4 py-2.5 text-white placeholder-gray-500 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-2.5 font-semibold shadow-lg shadow-purple-500/20 transition-all hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
