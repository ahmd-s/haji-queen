import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Brand lockup for the storefront. Keeps the existing HAJI QUEENS letterforms in
 * navigation; the supplied emblem appears in the intro and footer instead.
 * NEXT_PUBLIC_LOGO_PATH can replace this lockup with the artwork if desired.
 */
export function Wordmark({
  size = "md",
  tagline = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  tagline?: boolean;
  className?: string;
}) {
  const logoPath = process.env.NEXT_PUBLIC_LOGO_PATH;
  if (logoPath) {
    return <img src={logoPath} alt={SITE_NAME} className={cn("h-10 w-auto", className)} height={40} />;
  }
  return (
    <span className={cn("inline-flex flex-col items-center leading-none", className)}>
      <span
        style={{ fontFamily: "var(--font-wordmark), Georgia, serif" }}
        className={cn(
          "whitespace-nowrap font-medium tracking-[0.16em] -mr-[0.16em]",
          size === "sm" && "text-[1.22rem]",
          size === "md" && "text-[1.2rem] sm:text-[1.62rem]",
          size === "lg" && "text-[clamp(2.2rem,7.2vw,6.6rem)] tracking-[0.1em] -mr-[0.1em]"
        )}
      >
        HAJI QUEENS
      </span>
      {tagline && <span className="mt-1.5 text-[0.8125rem] text-ink-soft">{SITE_TAGLINE.replace("By", "by")}</span>}
    </span>
  );
}
