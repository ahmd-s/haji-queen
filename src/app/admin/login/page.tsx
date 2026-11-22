"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        setLoading(false);
        return;
      }
      router.push(params.get("from") || "/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-5">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="mt-10 border border-border bg-white p-8">
          <div className="flex items-center gap-2 text-taupe">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em]">
              Admin Access
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl text-espresso">Sign In</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input
                id="email"
                type="email"
                className="field-hq"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                type="password"
                className="field-hq"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="border border-destructive/30 bg-destructive/5 p-2.5 text-[13px] text-destructive">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-hq-primary w-full">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-taupe">
          Protected area for Haji Queens staff. Access is logged and credentials are managed by
          the business.
        </p>
      </div>
    </div>
  );
}
