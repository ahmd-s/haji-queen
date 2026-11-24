import localFont from "next/font/local";
import { Hanken_Grotesk, Newsreader } from "next/font/google";

/**
 * Storefront typography: Newsreader (display, optical sizing) with Hanken
 * Grotesk for everything functional. Self-hosted by next/font at build time.
 */
export const newsreader = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

/** latin-ext carries the rupee sign. */
export const hanken = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hanken",
  display: "swap",
});

/** The HAJI QUEENS wordmark keeps its original Cormorant letterforms. */
export const wordmark = localFont({
  src: [{ path: "../../public/fonts/cormorant-garamond-normal-500.woff2", weight: "500", style: "normal" }],
  variable: "--font-wordmark",
  display: "swap",
});

/**
 * Admin typography (original system; not preloaded on the storefront).
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
  preload: false,
});

export const manrope = localFont({
  src: [{ path: "../../public/fonts/manrope-normal.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
});
