import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

/**
 * Brand lockup.
 *
 * The official Haji Queens logo file was not supplied with this build.
 * This component renders a refined typographic placeholder lockup and will
 * automatically switch to the original artwork the moment it is added:
 *   1. place the file at /public/brand/logo.png (or .svg)
 *   2. set NEXT_PUBLIC_LOGO_PATH=/brand/logo.png
 * No code changes required. The placeholder is never misrepresented as the
 * original emblem.
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  // Geometric ornament inspired by the brand's Islamic-pattern emblem:
  // an eight-point star frame around the H monogram.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="1" y="1" width="46" height="46" stroke="#B58A36" strokeWidth="1.4" />
      <rect x="1" y="1" width="46" height="46" stroke="#B58A36" strokeWidth="1.4" transform="rotate(45 24 24)" />
      <rect x="6.5" y="6.5" width="35" height="35" stroke="#B58A36" strokeWidth="0.9" opacity="0.65" />
      <path d="M17 33V15M17 24h14M31 15v18" stroke="#B58A36" strokeWidth="2.1" strokeLinecap="square" />
    </svg>
  );
}

export function Logo({
  dark = false,
  compact = false,
}: {
  dark?: boolean; // for dark footer background
  compact?: boolean;
}) {
  const logoPath = process.env.NEXT_PUBLIC_LOGO_PATH;
  const wordColor = dark ? "text-ivory" : "text-espresso";
  const tagColor = dark ? "text-champagne/80" : "text-taupe";

  if (logoPath) {
    // Original supplied artwork
    return (
      <img
        src={logoPath}
        alt={`${SITE_NAME} — ${SITE_TAGLINE}`}
        className="h-10 w-auto"
        height={40}
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark size={compact ? 30 : 38} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display ${wordColor} ${compact ? "text-lg" : "text-[22px]"} font-medium tracking-[0.18em]`}
        >
          HAJI QUEENS
        </span>
        <span className={`${tagColor} mt-1 text-[9px] font-medium uppercase tracking-[0.34em]`}>
          By Hazera Khawaja
        </span>
      </span>
    </span>
  );
}
