"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminFetch, errorMessage } from "@/components/admin/api";
import { ProductForm } from "@/components/admin/product-form";
import { ProductStatusBadge, productStatusOf } from "@/components/admin/status";
import {
  AdminModal,
  AdminPageHeader,
  AdminSearchInput,
  AdminTableScroll,
  AdminToolbar,
  BulkBar,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterSelect,
  LoadingState,
  PaginationBar,
  SmallButton,
  Td,
  Th,
  TableHeadRow,
} from "@/components/admin/ui";
import type { AdminProduct, Pagination } from "@/lib/admin-types";
import { formatINR } from "@/lib/money";

type ProductsResponse = { products: AdminProduct[]; pagination: Pagination };

type BulkAction = "publish" | "unpublish";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction | "">("");
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (categoryId !== "all") params.set("categoryId", categoryId);
      const data = await adminFetch<ProductsResponse>(`/api/admin/products?${params.toString()}`);
      setProducts(data.products ?? []);
      setPagination(
        data.pagination ?? { page, pageSize: 25, total: 0, totalPages: 1 }
      );
      setSelected(new Set());
    } catch (err) {
      setError(errorMessage(err, "Products could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, categoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    adminFetch<{ categories: { id: string; name: string }[] }>("/api/admin/categories")
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => undefined);
  }, []);

  const applyBulk = async () => {
    if (!bulkAction || selected.size === 0) return;
    setBusy(true);
    try {
      const result = await adminFetch<{
        updated: string[];
        skipped: { name: string; reason: string }[];
      }>("/api/admin/products/bulk", {
        method: "PATCH",
        body: JSON.stringify({ ids: [...selected], action: bulkAction }),
      });
      toast({
        title:
          bulkAction === "publish"
            ? `${result.updated.length} product${result.updated.length === 1 ? "" : "s"} published`
            : `${result.updated.length} product${result.updated.length === 1 ? "" : "s"} hidden`,
        description:
          result.skipped.length > 0
            ? `${result.skipped.length} skipped: ${result.skipped[0].reason}`
            : undefined,
      });
      setSelected(new Set());
      setBulkAction("");
      await load();
    } catch (err) {
      toast({ title: "Could not update products", description: errorMessage(err) });
    } finally {
      setBusy(false);
      setConfirmBulk(false);
    }
  };

  const removeProduct = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      toast({ title: "Product deleted", description: "Past order records are kept safe." });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast({ title: "Could not delete product", description: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected = products.length > 0 && products.every((p) => selected.has(p.id));
  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) products.forEach((p) => next.delete(p.id));
      else products.forEach((p) => next.add(p.id));
      return next;
    });
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Add pieces, upload photos, set prices and control what customers can see."
        actions={
          <SmallButton tone="primary" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" /> Add product
          </SmallButton>
        }
      />

      <AdminToolbar>
        <form
          className="flex flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchDraft.trim());
            setPage(1);
          }}
        >
          <AdminSearchInput
            value={searchDraft}
            onChange={setSearchDraft}
            placeholder="Search by name, SKU or web address"
          />
          <SmallButton type="submit">
            <Search className="h-3.5 w-3.5" /> Search
          </SmallButton>
        </form>
        <FilterSelect
          label="Product state"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All states" },
            { value: "live", label: "Live in store" },
            { value: "hidden", label: "Hidden" },
            { value: "pending", label: "Pending approval" },
          ]}
        />
        <FilterSelect
          label="Category"
          value={categoryId}
          onChange={(value) => {
            setCategoryId(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All categories" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </AdminToolbar>

      <div className="mt-4">
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <LoadingState label="Loading products…" /> : null}
        {!loading && !error && products.length === 0 ? (
          <EmptyState
            title={search || status !== "all" ? "No products match this view" : "No products yet"}
            description={
              search || status !== "all"
                ? "Try a different search or clear the filters."
                : "Add your first product to start building the catalogue."
            }
            action={
              search || status !== "all" ? (
                <SmallButton
                  onClick={() => {
                    setSearchDraft("");
                    setSearch("");
                    setStatus("all");
                    setCategoryId("all");
                    setPage(1);
                  }}
                >
                  Clear filters
                </SmallButton>
              ) : (
                <SmallButton tone="primary" onClick={() => setEditing("new")}>
                  Add product
                </SmallButton>
              )
            }
          />
        ) : null}
        {!loading && !error && products.length > 0 ? (
          <>
            <AdminTableScroll minWidth={900}>
              <thead>
                <TableHeadRow>
                  <Th>
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={togglePage}
                      aria-label="Select all products on this page"
                      className="h-4 w-4 accent-gold"
                    />
                  </Th>
                  <Th>Product</Th>
                  <Th>State</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Category</Th>
                  <Th right>Actions</Th>
                </TableHeadRow>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/70 last:border-0">
                    <Td>
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelection(p.id)}
                        aria-label={`Select ${p.name}`}
                        className="h-4 w-4 accent-gold"
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        {p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-12 w-10 shrink-0 border border-border object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-10 shrink-0 items-center justify-center border border-dashed border-border text-[9px] text-taupe">
                            No photo
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-espresso">{p.name}</p>
                          <p className="text-[11px] text-taupe">
                            {p.sku ?? p.slug} · {p.variants.length} option{p.variants.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <ProductStatusBadge status={productStatusOf(p)} />
                    </Td>
                    <Td>
                      {p.isEnquiryOnly ? (
                        <span className="text-taupe">Enquiry only</span>
                      ) : p.priceConfirmed ? (
                        <span className="font-medium text-espresso">{formatINR(p.price)}</span>
                      ) : (
                        <span className="text-amber-800">Price pending</span>
                      )}
                    </Td>
                    <Td>{p.stock} units</Td>
                    <Td className="text-espresso/70">{p.categoryName}</Td>
                    <Td right>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <SmallButton onClick={() => setEditing(p)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </SmallButton>
                        <SmallButton
                          onClick={() => {
                            setSelected(new Set([p.id]));
                            setBulkAction(p.visible ? "unpublish" : "publish");
                            setConfirmBulk(true);
                          }}
                        >
                          {p.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {p.visible ? "Hide" : "Publish"}
                        </SmallButton>
                        <SmallButton tone="danger" onClick={() => setDeleteTarget(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </SmallButton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </AdminTableScroll>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FilterSelect
                label="Bulk action"
                value={bulkAction}
                onChange={(value) => setBulkAction(value as BulkAction | "")}
                options={[
                  { value: "", label: "Choose bulk action…" },
                  { value: "publish", label: "Publish selected" },
                  { value: "unpublish", label: "Hide selected" },
                ]}
              />
              <SmallButton
                disabled={selected.size === 0 || !bulkAction}
                onClick={() => setConfirmBulk(true)}
              >
                Apply to selected
              </SmallButton>
            </div>

            <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
              <span className="text-[11px] text-taupe">Choose an action above.</span>
            </BulkBar>

            <div className="mt-4 border border-border bg-white">
              <PaginationBar pagination={pagination} onChange={setPage} />
            </div>
          </>
        ) : null}
      </div>

      <AdminModal
        open={editing !== null}
        title={editing === "new" ? "Add a new product" : "Edit product"}
        description="Save as hidden at any time. Only complete products can be published."
        onClose={() => setEditing(null)}
        wide
      >
        {editing !== null ? (
          <ProductForm
            product={editing}
            categories={categories}
            onSaved={() => {
              setEditing(null);
              void load();
            }}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </AdminModal>

      <ConfirmDialog
        open={confirmBulk}
        title={bulkAction === "publish" ? "Publish selected products?" : "Hide selected products?"}
        description={
          bulkAction === "publish"
            ? "Only products with a photo, description and confirmed price will be published."
            : "Hidden products stay saved but cannot be bought on the website."
        }
        confirmLabel={bulkAction === "publish" ? "Publish now" : "Hide now"}
        busy={busy}
        onConfirm={() => void applyBulk()}
        onCancel={() => setConfirmBulk(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this product?"
        description={`“${deleteTarget?.name ?? ""}” will be removed from the catalogue. Products that appear in past orders cannot be removed by mistake.`}
        confirmLabel="Delete product"
        tone="danger"
        busy={busy}
        onConfirm={() => void removeProduct()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
