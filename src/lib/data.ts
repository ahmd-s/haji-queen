/**
 * Compatibility facade for the storefront.
 *
 * Catalogue reads now live in the Phase 3 service layer. Existing imports from
 * `@/lib/data` continue to work so the public DTO and pages stay unchanged.
 */
export {
  getCategories,
  getCatalogueFeedRows,
  getCategoryBySlug,
  getContent,
  getProductBySlug,
  getProducts,
  getRelatedProducts,
  toProductDTO,
  type CatalogueFeedRow,
  type ProductQuery,
} from "@/lib/services/catalogue";
