"use client";

import Link from "next/link";
import { Sheet, SheetHeader } from "@/components/storefront/sheet";
import type { ProductDTO } from "@/lib/types";

/** General body-measurement reference for lettered sizes. */
const BODY: Record<string, [string, string][]> = {
  XS: [["32", "81"], ["26", "66"], ["35", "89"]],
  S: [["34", "86"], ["28", "71"], ["37", "94"]],
  M: [["36", "91"], ["30", "76"], ["39", "99"]],
  L: [["38", "97"], ["32", "81"], ["41", "104"]],
  XL: [["40", "102"], ["34", "86"], ["43", "109"]],
};

export function isLengthSized(sizes: string[]): boolean {
  return sizes.length > 0 && sizes.every((s) => /^\d{2}$/.test(s));
}

export function SizeGuide({
  product,
  open,
  onClose,
}: {
  product: ProductDTO;
  open: boolean;
  onClose: () => void;
}) {
  const byLength = isLengthSized(product.sizes);
  const listed = product.sizes.filter((s) => BODY[s]);
  const unlisted = product.sizes.filter((s) => !BODY[s]);

  return (
    <Sheet open={open} onClose={onClose} side="center" label="Size guide">
      <SheetHeader title="Size guide" onClose={onClose} closeLabel="Close size guide" />
      <div className="space-y-8 px-6 py-7">
        {product.sizeNotes && (
          <section>
            <h3 className="font-medium">{product.name}</h3>
            <p className="mt-1.5 text-ink-soft">{product.sizeNotes}</p>
          </section>
        )}

        {byLength ? (
          <section>
            <h3 className="font-medium">How abaya lengths work</h3>
            <p className="mt-1.5 text-ink-soft">
              The number is the length of the garment, not a dress size. This piece comes in{" "}
              {product.sizes.join(", ")}. A taller frame, or heels, usually calls for a higher number.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 marker:text-ink text-ink-soft">
              <li>Stand straight in the shoes you plan to wear.</li>
              <li>Measure from the highest point of your shoulder, beside the neck.</li>
              <li>Run the tape down to where you want the hem to fall, usually just above the floor.</li>
              <li>An abaya you already love? Lay it flat and measure it the same way.</li>
            </ol>
          </section>
        ) : listed.length > 0 ? (
          <section>
            <h3 className="font-medium">General body measurements</h3>
            <p className="mt-1.5 text-ink-soft">
              A starting point for choosing your size. These are body measurements, not the measurements of this garment.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="price w-full min-w-[24rem] border-collapse text-left text-[0.9375rem]">
                <thead>
                  <tr className="border-b border-ink">
                    {["Size", "Bust", "Waist", "Hips"].map((h) => (
                      <th key={h} scope="col" className="py-2.5 pr-4 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listed.map((s) => (
                    <tr key={s} className="border-b border-sand">
                      <th scope="row" className="py-2.5 pr-4 font-medium">
                        {s}
                      </th>
                      {BODY[s].map(([inch, cm], i) => (
                        <td key={i} className="py-2.5 pr-4">
                          {inch} in <span className="text-ink-soft">/ {cm} cm</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {unlisted.length > 0 && (
              <p className="mt-3 text-sm text-ink-soft">
                For {unlisted.join(" and ")}, send us your measurements and we will check the fit for you.
              </p>
            )}
          </section>
        ) : (
          <section>
            <h3 className="font-medium">Sized with you</h3>
            <p className="mt-1.5 text-ink-soft">
              This piece has no fixed size chart. Tell us your measurements and we will confirm the right size before
              you order.
            </p>
          </section>
        )}

        <section className="border-t border-sand pt-6">
          <h3 className="font-medium">Not sure?</h3>
          <p className="mt-1.5 text-ink-soft">We would rather help you choose than have it come back.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/contact?product=${product.slug}`} className="btn btn-solid">
              Ask about sizing
            </Link>
            <Link href="/custom-measurements" className="btn btn-line">
              Send my measurements
            </Link>
          </div>
        </section>
      </div>
    </Sheet>
  );
}
