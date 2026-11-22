/**
 * WhatsApp deep links. The business number is configurable via
 * NEXT_PUBLIC_WHATSAPP_NUMBER (international digits only). If unset,
 * the UI hides WhatsApp entry points rather than linking nowhere.
 */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export function isWhatsAppConfigured(): boolean {
  return /^\d{8,15}$/.test(WHATSAPP_NUMBER);
}

export function waLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function waProductLink(productName: string, productUrl: string, variant?: string): string {
  const lines = [
    `Hello Haji Queens! I'm interested in *${productName}*${variant ? ` (${variant})` : ""}.`,
    `Product page: ${productUrl}`,
    "Could you share availability and styling help?",
  ];
  return waLink(lines.join("\n"));
}

export function waMeasurementLink(): string {
  return waLink(
    "Hello Haji Queens! I'd like to book a custom measurement consultation."
  );
}

export function waGeneralLink(): string {
  return waLink("Hello Haji Queens! I have a question about your collection.");
}
