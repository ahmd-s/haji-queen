import localFont from "next/font/local";

/**
 * Haji Queens typography system.
 * Headings: Cormorant Garamond (editorial serif)
 * Body/UI: Manrope (refined geometric sans)
 * Fonts are self-hosted (public/fonts) for reliability + performance.
 */
export const cormorant = localFont({
  src: [
    { path: "../../public/fonts/cormorant-garamond-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/cormorant-garamond-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/cormorant-garamond-normal-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/cormorant-garamond-normal-700.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/cormorant-garamond-italic-400.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

export const manrope = localFont({
  src: [{ path: "../../public/fonts/manrope-normal.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-manrope",
  display: "swap",
});
