"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

export default function AdminSecurityPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please re-enter the new password." });
      return;
    }
    if (newPassword.length < 12) {
      toast({ title: "Password too short", description: "Use at least 12 characters." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Could not change password", description: data.error });
        return;
      }
      toast({ title: "Password changed", description: "Please sign in again with your new password." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.push("/admin/login");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Account</p>
      <h1 className="mt-1 font-display text-3xl text-espresso">Security</h1>
      <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-taupe">
        Change the admin password. Changing it signs out every admin session immediately.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 max-w-lg border border-espresso/10 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center bg-gold/10 text-gold">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h2 className="font-display text-xl text-espresso">Change password</h2>
            <p className="text-[12px] text-taupe">Use at least 12 characters.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Field
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <Field
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <Field
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 bg-espresso px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-gold hover:text-espresso disabled:opacity-50"
        >
          {saving ? "Saving…" : "Change password"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-taupe">
        {label}
      </span>
      <input
        required
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-espresso/15 bg-ivory px-3 py-2.5 text-[13px] text-espresso outline-none focus:border-gold"
      />
    </label>
  );
}
