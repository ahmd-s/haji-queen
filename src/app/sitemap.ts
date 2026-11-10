import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/our-story`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/custom-measurements`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/shipping-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/returns-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [categories, products] = await Promise.all([
      db.category.findMany({ select: { slug: true, updatedAt: true } }),
      db.product.findMany({
        where: { visible: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    return [
      ...staticRoutes,
      ...categories.map((c) => ({
        url: `${SITE_URL}/category/${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...products.map((p) => ({
        url: `${SITE_URL}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
