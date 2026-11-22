import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="kicker justify-center">404</p>
      <h1 className="display-1 mt-4 text-espresso">This page has slipped away.</h1>
      <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-espresso/70">
        The page you are looking for does not exist or has moved. Let us guide you back to
        something beautiful.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-hq-primary">
          Return Home
        </Link>
        <Link href="/shop" className="btn-hq-outline">
          Browse The Collection
        </Link>
      </div>
    </div>
  );
}
