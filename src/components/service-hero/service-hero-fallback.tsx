import type { ServiceHeroVariant } from "./service-hero-3d";

/**
 * Static, silver-styled silhouette per variant. Used when WebGL is unavailable,
 * on mobile (to protect the first screen), and while the 3D scene loads. Styled
 * to look intentional — polished metallic gradient + soft shadow — rather than a
 * flat placeholder, mirroring the homepage logo fallback.
 */
export function ServiceHeroFallback({ variant }: { variant: ServiceHeroVariant }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-hidden="true"
        className="h-auto w-[60%] max-w-[300px] drop-shadow-[0_28px_55px_rgba(0,0,0,0.45)]"
      >
        <defs>
          <linearGradient id="svcSilver" x1="0.15" y1="0" x2="0.55" y2="1">
            <stop offset="0" stopColor="#fbfcfe" />
            <stop offset="0.4" stopColor="#c6cdd7" />
            <stop offset="0.72" stopColor="#8b939f" />
            <stop offset="1" stopColor="#575e69" />
          </linearGradient>
        </defs>
        {variant === "telegram" ? (
          <>
            {/* Paper plane dart pointing up-right. */}
            <path d="M14 60 L86 24 L52 82 L44 60 Z" fill="url(#svcSilver)" />
            <path d="M44 60 L86 24 L52 60 Z" fill="#9aa2ad" opacity="0.85" />
            <circle cx="26" cy="76" r="4" fill="#b4e02d" />
          </>
        ) : (
          <>
            {/* Generic abstract mark: overlapping rounded facets + accent node. */}
            <rect x="24" y="24" width="42" height="42" rx="12" fill="url(#svcSilver)" />
            <rect x="42" y="42" width="36" height="36" rx="10" fill="#9aa2ad" opacity="0.85" />
            <circle cx="72" cy="30" r="7" fill="#b4e02d" />
          </>
        )}
      </svg>
    </div>
  );
}
