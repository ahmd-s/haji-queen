"use client";

import Link from "next/link";

export default function StoreError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="wrap flex min-h-[64vh] flex-col justify-center py-20">
      <h1 className="t-title max-w-[16ch]">This page did not load</h1>
      <p className="t-body mt-5">Something went wrong on our side. Your bag and wishlist are safe. Please try again.</p>
      <div className="mt-9 flex flex-wrap gap-3">
        <button type="button" onClick={() => retry()} className="btn btn-solid">
          Try again
        </button>
        <Link href="/" className="btn btn-line">
          Go to the homepage
        </Link>
      </div>
    </div>
  );
}
