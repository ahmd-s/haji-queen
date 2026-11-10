"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CategoryDTO, ProductDTO } from "@/lib/types";

const ALL_SIZES = ["XS", "S", "M", "L", "XL"];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Loved" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

type Props = {
  categories: CategoryDTO[];
  lockedCategory?: string;
  initialSearch?: string;
};

export function ShopBrowser({ categories, lockedCategory, initialSearch }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState(initialSearch ?? "");
  const [category, setCategory] = useState(lockedCategory ?? "");
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<string>("newest");

  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const firstLoad = useRef(true);

  const colorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      for (const c of p.colors) if (!seen.has(c.name)) seen.set(c.name, c.hex);
    }
    return [...seen.entries()].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const fetchProducts = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true);
      const qs = new URLSearchParams();
      const cat = lockedCategory ?? category;
      if (cat) qs.set("category", cat);
      if (search.trim()) qs.set("search", search.trim());
      colors.forEach((c) => qs.append("color", c));
      sizes.forEach((s) => qs.append("size", s));
      if (maxPrice) qs.set("maxPrice", String(maxPrice));
      if (inStock) qs.set("inStock", "true");
      qs.set("sort", sort);
      qs.set("limit", String(pageNum * 12));
      try {
        const res = await fetch(`/api/products?${qs.toString()}`);
        const data = await res.json();
        setProducts(data.products ?? []);
        setTotal((data.products ?? []).length);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
        firstLoad.current = false;
      }
    },
    [category, colors, inStock, lockedCategory, maxPrice, search, sizes, sort]
  );

  useEffect(() => {
    fetchProducts(1, false);
    setPage(1);
  }, [fetchProducts]);

  // Sync ?search= from URL (header search)
  useEffect(() => {
    const s = params.get("search");
    if (s !== null) setSearch(s);
  }, [params]);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const activeFilterCount =
    colors.length + sizes.length + (maxPrice ? 1 : 0) + (inStock ? 1 : 0) + (!lockedCategory && category ? 1 : 0);

  const clearAll = () => {
    setColors([]);
    setSizes([]);
    setMaxPrice(null);
    setInStock(false);
    if (!lockedCategory) setCategory("");
  };

  const filtersBody = (
    <div className="space-y-8">
      {!lockedCategory && (
        <FilterGroup title="Collection">
          <div className="space-y-2">
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategory(category === c.slug ? "" : c.slug)}
                className={cn(
                  "block w-full text-left text-[13.5px] transition-colors",
                  category === c.slug ? "font-semibold text-gold" : "text-espresso/75 hover:text-espresso"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggle(sizes, setSizes, s)}
              className={cn(
                "h-9 min-w-9 border px-2 text-[12px] font-medium transition-colors",
                sizes.includes(s)
                  ? "border-espresso bg-espresso text-ivory"
                  : "border-border text-espresso/80 hover:border-espresso"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterGroup>

      {colorOptions.length > 0 && (
        <FilterGroup title="Colour">
          <div className="space-y-2">
            {colorOptions.map((c) => (
              <button
                key={c.name}
                onClick={() => toggle(colors, setColors, c.name)}
                className={cn(
                  "flex w-full items-center gap-2.5 py-1 text-left text-[13.5px] transition-colors",
                  colors.includes(c.name) ? "font-semibold text-gold" : "text-espresso/75 hover:text-espresso"
                )}
              >
                <span
                  className="h-4 w-4 rounded-full border border-espresso/20"
                  style={{ backgroundColor: c.hex }}
                />
                {c.name}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Price">
        <div className="space-y-2">
          {[
            { label: "Under ₹3,000", value: 3000 },
            { label: "Under ₹5,000", value: 5000 },
            { label: "Under ₹7,000", value: 7000 },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setMaxPrice(maxPrice === r.value ? null : r.value)}
              className={cn(
                "block w-full text-left text-[13.5px] transition-colors",
                maxPrice === r.value ? "font-semibold text-gold" : "text-espresso/75 hover:text-espresso"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Availability">
        <button
          onClick={() => setInStock(!inStock)}
          className="flex items-center gap-2.5 text-[13.5px] text-espresso/75 hover:text-espresso"
        >
          <span
            className={cn(
              "flex h-4.5 w-4.5 items-center justify-center border",
              inStock ? "border-gold bg-gold text-white" : "border-espresso/30"
            )}
            style={{ width: 18, height: 18 }}
          >
            {inStock ? "✓" : ""}
          </span>
          In stock only
        </button>
      </FilterGroup>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="link-underline text-[12px] font-semibold uppercase tracking-[0.16em] text-gold"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-hq pb-24">
      <div className="flex gap-12">
        {/* Desktop filters */}
        <aside className="hidden w-56 shrink-0 lg:block" aria-label="Product filters">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">{filtersBody}</div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <p className="text-[12px] uppercase tracking-[0.16em] text-taupe">
              {loading && firstLoad.current ? "Loading…" : `${total} piece${total === 1 ? "" : "s"}`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="inline-flex items-center gap-2 border border-border px-3.5 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-espresso lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
              </button>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none border border-border bg-ivory py-2 pl-3.5 pr-9 text-[12px] font-medium uppercase tracking-[0.14em] text-espresso focus:border-gold focus:outline-none"
                  aria-label="Sort products"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-taupe" />
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 pt-8 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-cream" />
                  <div className="mt-4 h-3 w-1/3 bg-cream" />
                  <div className="mt-2 h-4 w-2/3 bg-cream" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl text-espresso">Nothing matches those filters</p>
              <p className="mt-2 text-sm text-taupe">Try removing a filter or exploring another colour.</p>
              <button onClick={clearAll} className="btn-hq-outline mt-6">
                Clear Filters
              </button>
            </div>
          ) : (
            <StaggerGroup className="grid grid-cols-2 gap-x-5 gap-y-10 pt-8 xl:grid-cols-3">
              {products.map((p) => (
                <StaggerItem key={p.id}>
                  <ProductCard product={p} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}

          {/* Load more — total counts loaded set, so offer pagination hint */}
          {!loading && products.length >= 12 && products.length % 12 === 0 && (
            <div className="mt-16 text-center">
              <button
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  fetchProducts(next, true);
                }}
                disabled={loading}
                className="btn-hq-outline"
              >
                {loading ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-espresso/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-ivory">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="font-display text-xl">Filters</p>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{filtersBody}</div>
            <div className="border-t border-border p-4">
              <button onClick={() => setMobileFiltersOpen(false)} className="btn-hq-primary w-full">
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-espresso">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function formatPrice(n: number) {
  return formatINR(n);
}
