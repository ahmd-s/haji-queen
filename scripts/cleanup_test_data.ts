/**
 * Post-verification cleanup: removes API test artifacts, keeps one clearly
 * labelled demo order + demo inquiry so the admin dashboard is not empty.
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // Remove the markup test entry
  const removed = await db.supplierCatalogueEntry.deleteMany({
    where: { itemName: "Markup Test Entry" },
  });
  console.log(`removed test entries: ${removed.count}`);

  // Relabel the demo order
  await db.order.updateMany({
    where: { customerName: { in: ["Test Customer", "Browser Test Customer"] } },
    data: {
      customerName: "Demo Customer",
      customerNote: "Sample order created during website setup — feel free to delete.",
    },
  });

  // Relabel the demo inquiry
  await db.measurementInquiry.updateMany({
    where: { fullName: { in: ["Amina K.", "Form Test User"] } },
    data: {
      fullName: "Sample Inquiry",
      instructions: "Sample inquiry created during website setup — feel free to delete.",
    },
  });
  console.log("demo records relabelled");
}

main().finally(() => db.$disconnect());
