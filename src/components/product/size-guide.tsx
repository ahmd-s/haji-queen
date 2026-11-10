"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ROWS: { size: string; bust: string; waist: string; hips: string; length: string }[] = [
  { size: "XS", bust: '32" / 81cm', waist: '26" / 66cm', hips: '35" / 89cm', length: '54" / 137cm' },
  { size: "S", bust: '34" / 86cm', waist: '28" / 71cm', hips: '37" / 94cm', length: '55" / 140cm' },
  { size: "M", bust: '36" / 91cm', waist: '30" / 76cm', hips: '39" / 99cm', length: '56" / 142cm' },
  { size: "L", bust: '38" / 97cm', waist: '32" / 81cm', hips: '41" / 104cm', length: '56" / 142cm' },
  { size: "XL", bust: '40" / 102cm', waist: '34" / 86cm', hips: '43" / 109cm', length: '57" / 145cm' },
];

export function SizeGuideDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-ivory sm:rounded-none">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-espresso">Size Guide</DialogTitle>
          <DialogDescription className="text-[13px] text-taupe">
            Measurements are body measurements, not garment measurements. Between sizes? We
            recommend sizing up — or book a custom measurement and we will assist personally.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-espresso/20 text-left">
                <th className="py-2.5 pr-4 font-semibold uppercase tracking-[0.14em] text-espresso">Size</th>
                <th className="py-2.5 pr-4 font-semibold uppercase tracking-[0.14em] text-espresso">Bust</th>
                <th className="py-2.5 pr-4 font-semibold uppercase tracking-[0.14em] text-espresso">Waist</th>
                <th className="py-2.5 pr-4 font-semibold uppercase tracking-[0.14em] text-espresso">Hips</th>
                <th className="py-2.5 font-semibold uppercase tracking-[0.14em] text-espresso">Length</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.size} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-4 font-semibold text-espresso">{r.size}</td>
                  <td className="py-2.5 pr-4 text-espresso/75">{r.bust}</td>
                  <td className="py-2.5 pr-4 text-espresso/75">{r.waist}</td>
                  <td className="py-2.5 pr-4 text-espresso/75">{r.hips}</td>
                  <td className="py-2.5 text-espresso/75">{r.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-taupe">
          Need a precise fit?{" "}
          <a href="/custom-measurements" className="underline decoration-gold underline-offset-2 hover:text-gold">
            Book your measurement
          </a>{" "}
          and our team will guide you.
        </p>
      </DialogContent>
    </Dialog>
  );
}
