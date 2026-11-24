"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Sheet, SheetHeader } from "@/components/storefront/sheet";
import { formatINR } from "@/lib/money";
import { COLOUR_FAMILIES, categoryLabel, colourFamilies, hasPrice, isSoldOut, merchandise } from "@/lib/storefront";
import { cn } from "@/lib/utils";
import type { CategoryDTO, ProductDTO } from "@/lib/types";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

const PRICE_BANDS = [
  { id: "0-2000", label: `Under ${formatINR(2000)}`, min: 0, max: 1999.99 },
  { id: "2000-3000", label: `${formatINR(2000)} to ${formatINR(3000)}`, min: 2000, max: 3000 },
  { id: "3000-5000", label: `${formatINR(3000)} to ${formatINR(5000)}`, min: 3000.01, max: 5000 },
  { id: "5000-", label: `Above ${formatINR(5000)}`, min: 5000.01, max: Infinity },
];

const AVAILABILITY = [
  { id: "ready", label: "Ready to dispatch", test: (p: ProductDTO) => p.purchasable && p.availability !== "PRE_ORDER" },
  { id: "preorder", label: "Pre-order", test: (p: ProductDTO) => p.purchasable && p.availability === "PRE_ORDER" },
  { id: "enquiry", label: "Order by enquiry", test: (p: ProductDTO) => !p.purchasable && !isSoldOut(p) },
];

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s);
  return i >= 0 ? i : 100 + (Number(s) || 0);
};

type Filters = { colour: string[]; size: string[]; price: string[]; availability: string[] };
const EMPTY: Filters = { colour: [], size: [], price: [], availability: [] };
const KEYS = Object.keys(EMPTY) as (keyof Filters)[];

function matches(p: ProductDTO, f: Filters, skip?: keyof Filters): boolean {
  if (skip !== "colour" && f.colour.length && !p.colors.some((c) => colourFamilies(c).some((x) => f.colour.includes(x))))
    return false;
  if (skip !== "size" && f.size.length && !p.sizes.some((s) => f.size.includes(s))) return false;
  if (
    skip !== "price" &&
    f.price.length &&
    !(hasPrice(p) && PRICE_BANDS.some((b) => f.price.includes(b.id) && p.price >= b.min && p.price <= b.max))
  )
    return false;
  if (
    skip !== "availability" &&
    f.availability.length &&
    !AVAILABILITY.some((a) => f.availability.includes(a.id) && a.test(p))
  )
    return false;
  return true;
}

/**
 * The whole list arrives with the page, so filtering is instant and every
 * filter value shows how many pieces it leads to.
 */
export function ShopBrowser({
  products,
  categories,
  active,
  editorial = false,
}: {
  products: ProductDTO[];
  categories: CategoryDTO[];
  /** "all", "new" or a category slug. */
  active: string;
  /** Lead with one larger piece when nothing is filtered. */
  editorial?: boolean;
}) {
  const params = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => {
    const f = { ...EMPTY };
    for (const k of KEYS) f[k] = params.get(k)?.split(",").filter(Boolean) ?? [];
    return f;
  });
  const [sort, setSort] = useState<Sort>(() => {
    const s = params.get("sort");
    return SORTS.some((x) => x.value === s) ? (s as Sort) : "featured";
  });
  const [panelOpen, setPanelOpen] = useState(false);

  // Keep the address shareable without triggering a navigation.
  useEffect(() => {
    const next = new URLSearchParams();
    const search = new URLSearchParams(window.location.search).get("search");
    if (search) next.set("search", search);
    for (const k of KEYS) if (filters[k].length) next.set(k, filters[k].join(","));
    if (sort !== "featured") next.set("sort", sort);
    const qs = next.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [filters, sort]);

  const toggle = (key: keyof Filters, value: string) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  const clear = () => setFilters(EMPTY);

  const shown = useMemo(() => {
    const list = products.filter((p) => matches(p, filters));
    if (sort === "featured") return merchandise(list);
    if (sort === "newest") return list;
    return [...list].sort((a, b) => {
      if (hasPrice(a) !== hasPrice(b)) return hasPrice(a) ? -1 : 1;
      return sort === "price-asc" ? a.price - b.price : b.price - a.price;
    });
  }, [products, filters, sort]);

  const facets = useMemo(() => {
    const pool = (key: keyof Filters) => products.filter((p) => matches(p, filters, key));
    const colourPool = pool("colour");
    const sizePool = pool("size");
    const pricePool = pool("price");
    const availPool = pool("availability");
    return {
      colour: COLOUR_FAMILIES.map((f) => ({
        ...f,
        n: colourPool.filter((p) => p.colors.some((c) => colourFamilies(c).includes(f.name))).length,
      })).filter((f) => products.some((p) => p.colors.some((c) => colourFamilies(c).includes(f.name)))),
      size: [...new Set(products.flatMap((p) => p.sizes))]
        .sort((a, b) => sizeRank(a) - sizeRank(b))
        .map((s) => ({ name: s, n: sizePool.filter((p) => p.sizes.includes(s)).length })),
      price: PRICE_BANDS.map((b) => ({
        ...b,
        n: pricePool.filter((p) => hasPrice(p) && p.price >= b.min && p.price <= b.max).length,
      })).filter((b) => b.n > 0 || filters.price.includes(b.id)),
      availability: AVAILABILITY.map((a) => ({ ...a, n: availPool.filter(a.test).length })).filter((a) =>
        products.some(a.test)
      ),
    };
  }, [products, filters]);

  const chips = KEYS.flatMap((key) =>
    filters[key].map((value) => ({
      key,
      value,
      label:
        key === "price"
          ? (PRICE_BANDS.find((b) => b.id === value)?.label ?? value)
          : key === "availability"
            ? (AVAILABILITY.find((a) => a.id === value)?.label ?? value)
            : key === "size"
              ? `Size ${value}`
              : value,
    }))
  );

  const tabs = [
    { id: "all", label: "Everything", href: "/shop" },
    { id: "new", label: "New arrivals", href: "/new-arrivals" },
    ...categories.map((c) => ({ id: c.slug, label: categoryLabel(c), href: `/category/${c.slug}` })),
  ];

  const lead = editorial && chips.length === 0 && sort === "featured" && shown.length >= 5 && shown[0].images.length > 0;
  const resultText = `${shown.length} ${shown.length === 1 ? "piece" : "pieces"}`;

  return (
    <div className="pb-[var(--section)]">
      {/* Collections, filter and sort */}
      <div className="sticky top-16 z-30 border-b border-sand bg-paper xl:top-[4.75rem]">
        <div className="wrap flex flex-col md:flex-row md:items-center md:justify-between md:gap-8">
          <nav
            aria-label="Collections"
            className="-mx-[var(--gutter)] flex min-w-0 gap-6 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                aria-current={t.id === active ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap border-b-2 py-3.5 text-[0.9375rem] transition-colors",
                  t.id === active ? "border-ink" : "border-transparent text-ink-soft hover:text-ink"
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="-mx-[var(--gutter)] flex shrink-0 items-center justify-between gap-6 border-t border-sand px-[var(--gutter)] text-[0.9375rem] md:mx-0 md:border-0 md:px-0">
            <button type="button" onClick={() => setPanelOpen(true)} className="min-h-12 hover:text-olive">
              Filter{chips.length > 0 && <span className="price"> ({chips.length})</span>}
            </button>
            <label className="flex min-h-12 items-center gap-1.5">
              <span className="text-ink-soft">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="appearance-none bg-transparent py-2 pr-1 [field-sizing:content] text-right hover:text-olive focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="wrap pt-6">
        <div className="flex min-h-9 flex-wrap items-center gap-x-5 gap-y-2 text-[0.9375rem]">
          <p className="text-ink-soft" role="status">
            {resultText}
          </p>
          {chips.map((c) => (
            <button
              key={c.key + c.value}
              type="button"
              onClick={() => toggle(c.key, c.value)}
              className="inline-flex min-h-9 items-center gap-2 bg-shell px-3 hover:bg-sand"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label}
              <X className="size-3.5" strokeWidth={1.6} />
            </button>
          ))}
          {chips.length > 0 && (
            <button type="button" onClick={clear} className="link py-1">
              Clear all
            </button>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="py-20 md:py-28">
            <p className="t-head max-w-[18ch]">
              {products.length === 0 ? "Nothing here just yet." : "No pieces match all of those."}
            </p>
            <p className="mt-3 max-w-[46ch] text-ink-soft">
              {products.length === 0
                ? "Try another word, or look through the whole collection."
                : "Remove a filter to see more, or tell us what you are looking for and we will help."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {chips.length > 0 ? (
                <button type="button" onClick={clear} className="btn btn-solid">
                  Clear filters
                </button>
              ) : (
                <Link href="/shop" className="btn btn-solid">
                  Shop everything
                </Link>
              )}
              <Link href="/contact" className="btn btn-line">
                Ask us
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 md:gap-y-14 xl:grid-cols-4">
            {shown.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                priority={i < 4}
                families={filters.colour}
                feature={lead && i === 0}
                className={lead && i === 0 ? "col-span-2 md:row-span-2" : undefined}
                sizes={lead && i === 0 ? "(max-width: 767px) 100vw, (max-width: 1279px) 66vw, 50vw" : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={panelOpen} onClose={() => setPanelOpen(false)} label="Filter pieces">
        <SheetHeader title="Filter" onClose={() => setPanelOpen(false)} closeLabel="Close filters" />
        <div className="flex-1 divide-y divide-sand overflow-y-auto overscroll-contain px-6">
          <Group title="Colour">
            <div className="grid grid-cols-2 gap-x-4">
              {facets.colour.map((f) => (
                <Option
                  key={f.name}
                  checked={filters.colour.includes(f.name)}
                  disabled={f.n === 0}
                  onChange={() => toggle("colour", f.name)}
                  count={f.n}
                  swatch={f.swatch}
                >
                  {f.name}
                </Option>
              ))}
            </div>
          </Group>
          <Group title="Size">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2 pt-1">
              {facets.size.map((s) => {
                const on = filters.size.includes(s.name);
                return (
                  <button
                    key={s.name}
                    type="button"
                    aria-pressed={on}
                    disabled={s.n === 0 && !on}
                    onClick={() => toggle("size", s.name)}
                    className={cn(
                      "h-12 border text-[0.9375rem] transition-colors disabled:text-ink-soft/50",
                      on ? "border-ink bg-ink text-paper" : "border-[#cbbba6] enabled:hover:border-ink"
                    )}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-ink-soft">Numbers are abaya lengths.</p>
          </Group>
          <Group title="Price">
            {facets.price.map((b) => (
              <Option key={b.id} checked={filters.price.includes(b.id)} onChange={() => toggle("price", b.id)} count={b.n}>
                <span className="price">{b.label}</span>
              </Option>
            ))}
          </Group>
          <Group title="Availability">
            {facets.availability.map((a) => (
              <Option
                key={a.id}
                checked={filters.availability.includes(a.id)}
                disabled={a.n === 0}
                onChange={() => toggle("availability", a.id)}
                count={a.n}
              >
                {a.label}
              </Option>
            ))}
          </Group>
        </div>
        <div className="flex shrink-0 gap-2.5 border-t border-sand px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" onClick={clear} disabled={chips.length === 0} className="btn btn-line !px-6">
            Clear
          </button>
          <button type="button" onClick={() => setPanelOpen(false)} className="btn btn-solid flex-1">
            Show {resultText}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="py-6">
      <legend className="float-left mb-3 w-full font-medium">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function Option({
  checked,
  disabled,
  onChange,
  count,
  swatch,
  children,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  count: number;
  swatch?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 items-center gap-3 text-[0.9688rem] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-olive",
        disabled && !checked && "!cursor-not-allowed opacity-45"
      )}
    >
      <input type="checkbox" checked={checked} disabled={disabled && !checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "size-5 shrink-0 transition-shadow",
          swatch ? "rounded-full" : "border",
          swatch
            ? checked
              ? "shadow-[0_0_0_2px_var(--color-paper),0_0_0_3.5px_var(--color-ink)]"
              : "shadow-[0_0_0_1px_rgb(42_32_26/.16)]"
            : checked
              ? "border-ink bg-ink shadow-[inset_0_0_0_3px_var(--color-paper)]"
              : "border-[#b9a994]"
        )}
        style={swatch ? { background: swatch } : undefined}
      />
      <span className={cn("flex-1", checked && "font-medium")}>{children}</span>
      <span className="price text-sm text-ink-soft">{count}</span>
    </label>
  );
}
