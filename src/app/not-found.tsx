import Link from "next/link";
import { Wordmark } from "@/components/storefront/wordmark";
import { hanken, newsreader, wordmark } from "@/lib/fonts";
import "./(store)/store.css";

export default function NotFound() {
  return (
    <div className={`hq ${newsreader.variable} ${hanken.variable} ${wordmark.variable}`}>
      <header className="wrap flex justify-center py-7">
        <Link href="/" aria-label="Haji Queens, home">
          <Wordmark />
        </Link>
      </header>
      <main className="wrap flex flex-1 flex-col justify-center pb-28">
        <h1 className="t-hero max-w-[14ch]">We could not find that page</h1>
        <p className="t-body mt-6">It may have moved, or the piece may no longer be listed.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/new-arrivals" className="btn btn-solid">
            See new arrivals
          </Link>
          <Link href="/" className="btn btn-line">
            Go to the homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
