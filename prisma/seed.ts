/**
 * Haji Queens — database seed.
 * Creates: admin user, 4 categories, 19 demo products (+variants),
 * 2 suppliers with catalogue entries (internal pricing demo), site content.
 * ALL PRODUCTS ARE DEMONSTRATION CONTENT until real inventory is supplied.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const SIZES = ["XS", "S", "M", "L", "XL"];

const COLORS: Record<string, { name: string; hex: string }> = {
  black: { name: "Onyx Black", hex: "#1d1a17" },
  ivory: { name: "Ivory", hex: "#f3ecdd" },
  champagne: { name: "Champagne", hex: "#e3d3ae" },
  sage: { name: "Sage", hex: "#aab5a1" },
  plum: { name: "Deep Plum", hex: "#5c3a44" },
  navy: { name: "Midnight Navy", hex: "#232b3a" },
  blush: { name: "Blush Rose", hex: "#dfbfb4" },
  espresso: { name: "Espresso", hex: "#4a3a2c" },
  terracotta: { name: "Terracotta", hex: "#b0603c" },
  marigold: { name: "Marigold", hex: "#d99a2b" },
  burgundy: { name: "Burgundy", hex: "#5e2f35" },
  teal: { name: "Deep Teal", hex: "#33565a" },
  white: { name: "Pearl White", hex: "#f6f4ef" },
  gold: { name: "Antique Gold", hex: "#b58a36" },
  indigo: { name: "Indigo", hex: "#3a4668" },
  grey: { name: "Stone Grey", hex: "#b9b2a5" },
};

type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  source?: "HQ_ORIGINAL" | "TRUSTED_SUPPLIER";
  price: number;
  compareAtPrice?: number;
  description: string;
  fabric: string;
  care: string;
  colors: string[];
  sizes?: string[];
  images: string[];
  badge?: string;
  featured?: boolean;
  stock?: number;
  popularity?: number;
};

const PRODUCTS: SeedProduct[] = [
  // ── Abayas ──────────────────────────────────────────────
  {
    slug: "classic-black-open-abaya",
    name: "Classic Black Open Abaya",
    category: "abayas",
    price: 4299,
    compareAtPrice: 4999,
    badge: "Bestseller",
    featured: true,
    description:
      "The foundation of every modest wardrobe. A fluid open-front abaya cut from matte crepe that falls in a clean, uninterrupted line from shoulder to hem. Understated sleeve cuffs and a matching fabric belt keep the silhouette quietly tailored.",
    fabric: "Premium Nida crepe with a soft matte finish; fully lined bodice.",
    care: "Dry clean recommended. Cool iron on reverse.",
    colors: ["black", "espresso"],
    images: ["/images/p-classic-black-1.jpg", "/images/p-classic-black-2.jpg"],
    stock: 24,
    popularity: 84,
  },
  {
    slug: "everyday-minimal-abaya",
    name: "Everyday Minimal Abaya",
    category: "abayas",
    price: 3499,
    featured: true,
    description:
      "Designed for long days and easy movement. A relaxed A-line abaya with a concealed placket, side pockets and a softly structured shoulder. Wear it belted for definition or open and unstructured on quieter days.",
    fabric: "Breathable Korean crepe; machine-washable blend.",
    care: "Gentle machine wash cold. Hang dry in shade.",
    colors: ["ivory", "grey", "black"],
    images: ["/images/p-everyday-minimal.jpg"],
    stock: 30,
    popularity: 71,
  },
  {
    slug: "embroidered-occasion-abaya",
    name: "Embroidered Occasion Abaya",
    category: "abayas",
    price: 6999,
    badge: "New In",
    featured: true,
    description:
      "Our celebration piece. Deep onyx crepe traced with hand-guided floral embroidery along the sleeves and hem, finished with a scalloped inner cuff. Made for evenings that deserve something quietly extraordinary.",
    fabric: "Heavy-flow Nida with tonal thread embroidery; satin-lined sleeves.",
    care: "Dry clean only. Store on a padded hanger.",
    colors: ["black", "plum"],
    images: ["/images/p-embroidered-occasion.jpg"],
    stock: 12,
    popularity: 92,
  },
  {
    slug: "premium-layered-abaya",
    name: "Premium Layered Abaya",
    category: "abayas",
    price: 5499,
    description:
      "A double-layer silhouette with a sheer organza overlay drifting over a fluid inner slip. The layered hem catches light with every step, giving depth without weight — a study in restrained drama.",
    fabric: "Organza overlay over sandwashed inner layer.",
    care: "Dry clean recommended. Do not wring.",
    colors: ["sage", "plum"],
    images: ["/images/p-premium-layered-1.jpg", "/images/p-premium-layered-2.jpg"],
    stock: 16,
    popularity: 63,
  },
  {
    slug: "champagne-satin-abaya",
    name: "Champagne Satin Abaya",
    category: "abayas",
    source: "TRUSTED_SUPPLIER",
    price: 5999,
    badge: "New In",
    description:
      "Liquid satin in a warm champagne tone, cut with a softly draped front and covered buttons. A luminous choice for engagements, soirées and festive evenings.",
    fabric: "Duchess-finish satin with anti-static lining.",
    care: "Dry clean only. Steam to refresh.",
    colors: ["champagne"],
    images: ["/images/p-champagne-satin.jpg"],
    stock: 10,
    popularity: 58,
  },
  // ── Maxis & Dresses ─────────────────────────────────────
  {
    slug: "elegant-floral-maxi",
    name: "Elegant Floral Maxi",
    category: "maxis-dresses",
    price: 3899,
    featured: true,
    description:
      "Midnight navy scattered with hand-placed blooms. A high-neck maxi with sheer georgette sleeves and a covered-button back, made to move beautifully from day celebrations to dinner.",
    fabric: "Georgette over crepe lining; concealed side zip.",
    care: "Dry clean recommended.",
    colors: ["navy", "blush"],
    images: ["/images/p-floral-maxi.jpg"],
    stock: 18,
    popularity: 77,
  },
  {
    slug: "blush-floral-day-dress",
    name: "Blush Floral Day Dress",
    category: "maxis-dresses",
    price: 2999,
    description:
      "Featherlight printed chiffon in soft blush, shaped with a tie waist and full-length sleeves gathered at the cuff. An easy, romantic dress for slow afternoons.",
    fabric: "Printed chiffon with cotton-voile lining.",
    care: "Hand wash cold. Cool iron.",
    colors: ["blush"],
    images: ["/images/p-blush-floral.jpg"],
    stock: 22,
    popularity: 54,
  },
  {
    slug: "satin-evening-maxi",
    name: "Satin Evening Maxi",
    category: "maxis-dresses",
    price: 5999,
    badge: "Bestseller",
    featured: true,
    description:
      "Champagne satin cut on the bias with fine accordion pleats that pour into a sweeping hem. A high neckline and long sleeves keep the silhouette serene while the fabric does the sparkling.",
    fabric: "Accordion-pleated satin; lined bodice.",
    care: "Professional clean only. Do not iron pleats.",
    colors: ["champagne", "ivory"],
    images: ["/images/p-satin-evening.jpg"],
    stock: 14,
    popularity: 88,
  },
  {
    slug: "minimal-everyday-maxi",
    name: "Minimal Everyday Maxi",
    category: "maxis-dresses",
    price: 2899,
    description:
      "The dress you will reach for constantly. Clean lines, a gentle swing hem and deep pockets in soft ivory crepe — proof that simple, done precisely, is everything.",
    fabric: "Sandwashed crepe with full lining.",
    care: "Gentle machine wash cold.",
    colors: ["ivory", "black"],
    images: ["/images/p-minimal-everyday-1.jpg", "/images/p-minimal-everyday-2.jpg"],
    stock: 26,
    popularity: 66,
  },
  {
    slug: "pleated-occasion-dress",
    name: "Pleated Occasion Dress",
    category: "maxis-dresses",
    price: 4999,
    description:
      "Pearl-white occasion dressing with a sculpted pleated bodice and a floor-sweeping skirt. Architectural at the shoulder, fluid through the length — composed for ceremonies and receptions.",
    fabric: "Heat-set pleated georgette; structured bodice with inner corsetry.",
    care: "Dry clean only.",
    colors: ["white"],
    images: ["/images/p-pleated-occasion.jpg"],
    stock: 9,
    popularity: 61,
  },
  // ── Indo-Western Fusion ─────────────────────────────────
  {
    slug: "contemporary-fusion-set",
    name: "Contemporary Fusion Set",
    category: "indo-western",
    price: 5499,
    featured: true,
    description:
      "A two-piece statement: an antique-gold brocade bandhgala vest layered over draped dhoti trousers. Heritage craft, reimagined with a modern, uncluttered eye.",
    fabric: "Silk-blend brocade with satin piping; cotton-silk trousers.",
    care: "Dry clean only.",
    colors: ["gold"],
    images: ["/images/p-fusion-set.jpg"],
    stock: 11,
    popularity: 69,
  },
  {
    slug: "elegant-kurta-coord",
    name: "Elegant Kurta Co-ord",
    category: "indo-western",
    price: 3299,
    description:
      "Ivory chanderi kurta with fine block-print edging, paired with matching tapered pants. Quietly ornate, endlessly wearable — a co-ord that works for pujas and presentations alike.",
    fabric: "Chanderi-cotton with hand-block printed borders.",
    care: "Gentle hand wash separately.",
    colors: ["ivory"],
    images: ["/images/p-kurta-coord.jpg"],
    stock: 20,
    popularity: 59,
  },
  {
    slug: "modern-layered-outfit",
    name: "Modern Layered Outfit",
    category: "indo-western",
    price: 3799,
    description:
      "Indigo floral kurta layered over wide culottes, finished with a self-tie belt. The proportions are contemporary, the mood unmistakably rooted.",
    fabric: "Rayon muslin with digital floral print.",
    care: "Machine wash cold, inside out.",
    colors: ["indigo"],
    images: ["/images/p-modern-layered.jpg"],
    stock: 17,
    popularity: 48,
  },
  {
    slug: "terracotta-heritage-kurta",
    name: "Terracotta Heritage Kurta",
    category: "indo-western",
    source: "TRUSTED_SUPPLIER",
    price: 3499,
    description:
      "Warm terracotta cotton-silk with traditional motifs along the placket, worn over straight pants. A heritage piece with an earthy, modern warmth.",
    fabric: "Cotton-silk with woven motif border.",
    care: "Hand wash cold. Dry in shade.",
    colors: ["terracotta"],
    images: ["/images/p-terracotta-kurta.jpg"],
    stock: 15,
    popularity: 44,
  },
  {
    slug: "marigold-festive-set",
    name: "Marigold Festive Set",
    category: "indo-western",
    source: "TRUSTED_SUPPLIER",
    price: 3999,
    badge: "New In",
    description:
      "Marigold mirror-work kurta with a coordinating dupatta and pants. Bright, joyful and made for haldi mornings and mehendi nights.",
    fabric: "Cotton-silk with mirror and thread work.",
    care: "Dry clean recommended.",
    colors: ["marigold"],
    images: ["/images/p-marigold-set.jpg"],
    stock: 13,
    popularity: 51,
  },
  // ── Corporate & Workwear ────────────────────────────────
  {
    slug: "tailored-workwear-set",
    name: "Tailored Workwear Set",
    category: "corporate-workwear",
    price: 4999,
    featured: true,
    description:
      "Espresso-brown tailoring with a softened shoulder, single-button blazer and straight-full trousers. Commanding without shouting — your Monday armour, Monday to Friday.",
    fabric: "Stretch-wool blend blazer; matching tencero trousers.",
    care: "Dry clean. Steam between wears.",
    colors: ["espresso", "black"],
    images: ["/images/p-tailored-workwear-1.jpg", "/images/p-tailored-workwear-2.jpg"],
    stock: 19,
    popularity: 74,
  },
  {
    slug: "minimal-office-coord",
    name: "Minimal Office Co-ord",
    category: "corporate-workwear",
    price: 3999,
    description:
      "A wrap-front jumpsuit in midnight navy with a soft tie belt and tapered leg. One piece, zero decisions, complete polish.",
    fabric: "Structured crepe with full lining.",
    care: "Machine wash cold. Cool iron.",
    colors: ["navy", "black"],
    images: ["/images/p-office-coord.jpg"],
    stock: 21,
    popularity: 57,
  },
  {
    slug: "elegant-formal-suit",
    name: "Elegant Formal Suit",
    category: "corporate-workwear",
    price: 5499,
    description:
      "Deep burgundy suiting with peak lapels and a cropped, tapered trouser. For the presentations, panels and evenings that call for a little more presence.",
    fabric: "Premium poly-viscose suiting with satin lapel piping.",
    care: "Dry clean only.",
    colors: ["burgundy", "navy"],
    images: ["/images/p-formal-suit.jpg"],
    stock: 12,
    popularity: 46,
  },
  {
    slug: "monochrome-blazer-set",
    name: "Monochrome Blazer Set",
    category: "corporate-workwear",
    source: "TRUSTED_SUPPLIER",
    price: 4799,
    description:
      "A midnight navy blazer and trouser set with a clean, unstructured drape — an effortless formal foundation for the working week.",
    fabric: "Poly-viscose suiting with matte finish.",
    care: "Dry clean recommended.",
    colors: ["navy"],
    images: ["/images/p-blazer-set.jpg"],
    stock: 18,
    popularity: 42,
  },
];

const CATEGORIES = [
  {
    slug: "abayas",
    name: "Abayas",
    tagline: "Grace in every drape",
    description:
      "From everyday crepe to occasion embroidery — abayas cut for movement, coverage and quiet confidence.",
    bannerImage: "/images/banner-abayas.jpg",
    tileImage: "/images/cat-abayas-tile.jpg",
    featuredOrder: 1,
  },
  {
    slug: "maxis-dresses",
    name: "Maxis & Dresses",
    tagline: "Length, fluidity, ease",
    description:
      "Flowing maxis and considered occasion dresses in fabrics chosen for the way they move.",
    bannerImage: "/images/banner-maxis.jpg",
    tileImage: "/images/cat-maxis-tile.jpg",
    featuredOrder: 2,
  },
  {
    slug: "indo-western",
    name: "Indo-Western Fusion",
    tagline: "Heritage, reimagined",
    description:
      "Kurtas, co-ords and fusion sets that carry tradition into contemporary wardrobes.",
    bannerImage: "/images/banner-indo.jpg",
    tileImage: "/images/cat-indo-tile.jpg",
    featuredOrder: 3,
  },
  {
    slug: "corporate-workwear",
    name: "Corporate & Workwear",
    tagline: "Poise for the working day",
    description:
      "Tailoring, co-ords and formal sets designed for boardrooms and long, full days.",
    bannerImage: "/images/banner-corporate.jpg",
    tileImage: "/images/cat-corporate-tile.jpg",
    featuredOrder: 4,
  },
];

const SUPPLIERS = [
  {
    name: "Alisha Textiles — Dubai Abaya House",
    contactPerson: "Fatima Rahman",
    phone: "+971 50 000 0000",
    email: "catalogue@alishatextiles.example",
    catalogName: "SS26 Occasion Abaya Catalogue",
    notes: "DEMO SUPPLIER — placeholder contact details. Ships in 6–9 days.",
    entries: [
      { ref: "DXB-AB-1042", item: "Champagne Satin Abaya", wholesale: 4300, markupPct: 40, product: "champagne-satin-abaya", image: "/images/p-champagne-satin.jpg" },
    ],
  },
  {
    name: "Kolkata Craft Collective",
    contactPerson: "S. Iyer",
    phone: "+91 90000 00000",
    email: "orders@kcc.example",
    catalogName: "Festive Edit — Vol. 7",
    notes: "DEMO SUPPLIER — placeholder contact details. Craft co-operative catalogue.",
    entries: [
      { ref: "KCC-F7-018", item: "Terracotta Heritage Kurta", wholesale: 2450, markupPct: 40, product: "terracotta-heritage-kurta", image: "/images/p-terracotta-kurta.jpg" },
      { ref: "KCC-F7-023", item: "Marigold Festive Set", wholesale: 2800, markupPct: 40, product: "marigold-festive-set", image: "/images/p-marigold-set.jpg" },
    ],
  },
];

async function main() {
  console.log("Seeding Haji Queens…");

  // Admin
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@hajiqueens.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "HajiQueens#2026";
  await db.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      name: "Hazera Khawaja",
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✓ admin ${adminEmail}`);

  // Categories
  for (const [i, c] of CATEGORIES.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { ...c, sortOrder: i },
      create: { ...c, sortOrder: i },
    });
  }
  console.log("✓ 4 categories");

  // Products + variants
  for (const p of PRODUCTS) {
    const cat = CATEGORIES.find((c) => c.slug === p.category)!;
    const colorObjs = p.colors.map((k) => COLORS[k]);
    const sizes = p.sizes ?? SIZES;
    const stock = p.stock ?? 15;
    const perVariant = Math.max(1, Math.floor(stock / (sizes.length * colorObjs.length)));
    const base = {
      slug: p.slug,
      name: p.name,
      description: p.description,
      fabricDetails: p.fabric,
      careInstructions: p.care,
      categoryId: cat.slug, // placeholder, replaced below
      source: p.source ?? "HQ_ORIGINAL",
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      colors: JSON.stringify(colorObjs),
      sizes: JSON.stringify(sizes),
      images: JSON.stringify(p.images),
      badge: p.badge ?? null,
      featured: p.featured ?? false,
      stock,
      popularity: p.popularity ?? 30,
      visible: true,
      sku: `HQ-${p.slug.slice(0, 6).toUpperCase()}`,
    };
    const categoryRow = await db.category.findUnique({ where: { slug: p.category } });
    if (!categoryRow) throw new Error(`missing category ${p.category}`);
    const row = await db.product.upsert({
      where: { slug: p.slug },
      update: { ...base, categoryId: categoryRow.id },
      create: { ...base, categoryId: categoryRow.id },
    });
    // Variants
    await db.productVariant.deleteMany({ where: { productId: row.id } });
    for (const c of colorObjs) {
      for (const s of sizes) {
        await db.productVariant.create({
          data: { productId: row.id, size: s, color: c.name, stock: perVariant },
        });
      }
    }
  }
  console.log(`✓ ${PRODUCTS.length} products with variants`);

  // Suppliers + catalogue entries
  await db.supplierCatalogueEntry.deleteMany({});
  await db.supplier.deleteMany({});
  for (const s of SUPPLIERS) {
    const sup = await db.supplier.create({
      data: {
        name: s.name,
        contactPerson: s.contactPerson,
        phone: s.phone,
        email: s.email,
        catalogName: s.catalogName,
        notes: s.notes,
      },
    });
    for (const e of s.entries) {
      const prod = await db.product.findUnique({ where: { slug: e.product } });
      if (!prod) continue;
      await db.supplierCatalogueEntry.create({
        data: {
          supplierId: sup.id,
          supplierRef: e.ref,
          itemName: e.item,
          wholesalePrice: e.wholesale,
          markupPct: e.markupPct,
          availability: "AVAILABLE",
          imageUrl: e.image,
          productId: prod.id,
        },
      });
    }
  }
  console.log("✓ suppliers + catalogue entries");

  // Site content
  const content: Record<string, unknown> = {
    announcement: {
      text: "Discover timeless elegance  |  Explore the new collection",
      href: "/shop",
      enabled: true,
    },
    hero: {
      headline: "Elegance, Woven Into Every Detail.",
      subtext:
        "Discover thoughtfully curated fashion that celebrates individuality, confidence and timeless elegance.",
      primaryCta: "Explore Collection",
      secondaryCta: "Discover Our Story",
      image: "/images/hero-main.jpg",
    },
    story: {
      headline: "Seven Years of Style, Passion & Purpose.",
      body: "What began as a personal search for clothing that felt both modest and magnetic has grown, over seven years, into a considered atelier serving women of every background. Every piece in our edit is chosen — never chased — for its fabric, its finish and the way it makes the wearer feel.",
      image: "/images/story-duo.jpg",
    },
    measurements: {
      headline: "Made To Fit You.",
      body: "Bodies are not standard sizes — we know. Share your measurements and our team will personally assist you with sizing, alterations and made-to-measure guidance.",
    },
    awards: [
      { title: "Best Emerging Modest Fashion Label", detail: "[Editable placeholder — replace with verified award details]", year: "20XX" },
      { title: "Women's Fashion Excellence Recognition", detail: "[Editable placeholder — replace with verified recognition details]", year: "20XX" },
      { title: "Featured in Regional Fashion Showcase", detail: "[Editable placeholder — replace with verified feature details]", year: "20XX" },
    ],
    social: {
      instagram: "https://instagram.com/hajiqueens",
      facebook: "https://facebook.com/hajiqueens",
      instagramHandle: "@hajiqueens",
      gallery: ["/images/ig-1.jpg", "/images/ig-2.jpg", "/images/ig-3.jpg", "/images/ig-4.jpg", "/images/ig-5.jpg", "/images/ig-6.jpg"],
    },
    curated: {
      headline: "The Curated Collections",
      body: "Alongside our original designs, we present pieces from trusted supplier catalogues — each one reviewed, styled and photographed to the same standard. One edit. One standard of elegance.",
    },
    contact: {
      email: "care@hajiqueens.com",
      phoneDisplay: "+91 90000 00000",
      address: "Kolkata, West Bengal, India [editable]",
      hours: "Mon – Sat, 10am – 7pm IST",
    },
  };
  for (const [key, value] of Object.entries(content)) {
    await db.siteContent.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
  }
  console.log("✓ site content");
  console.log("SEED COMPLETE");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
