"use client";

import { useEffect } from "react";
import Link from "next/link";
import { create } from "zustand";

type Notice = { id: number; text: string; href?: string; linkLabel?: string };

const useNotice = create<{ notice: Notice | null; clear: (id: number) => void }>((set, get) => ({
  notice: null,
  clear: (id) => {
    if (get().notice?.id === id) set({ notice: null });
  },
}));

let nextId = 1;

/** Quiet confirmation line at the foot of the screen. */
export function notify(text: string, link?: { href: string; label: string }) {
  useNotice.setState({
    notice: { id: nextId++, text, href: link?.href, linkLabel: link?.label },
  });
}

export function NoticeRegion() {
  const notice = useNotice((s) => s.notice);
  const clear = useNotice((s) => s.clear);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => clear(notice.id), 3600);
    return () => clearTimeout(t);
  }, [notice, clear]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex justify-center md:bottom-8"
    >
      {notice && (
        <div
          key={notice.id}
          className="fade-in pointer-events-auto flex max-w-full items-center gap-5 bg-ink px-5 py-3.5 text-[0.9375rem] text-paper"
        >
          <span className="truncate">{notice.text}</span>
          {notice.href && (
            <Link href={notice.href} className="link shrink-0" onClick={() => clear(notice.id)}>
              {notice.linkLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
