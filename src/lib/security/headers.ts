type SecurityHeader = {
  key: string;
  value: string;
};

const SHARED_SECURITY_HEADERS: SecurityHeader[] = [
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// NOTE: indexing is controlled by `content/site.yaml` → `indexable`, applied via
// robots.txt (src/app/robots.ts) and per-page robots meta (layout + [slug]).
// We intentionally do NOT set an `X-Robots-Tag: noindex` response header here:
// a hardcoded one previously overrode the per-page meta and made search engines
// refuse to index even when indexing was enabled.

const PRODUCTION_SECURITY_HEADERS: SecurityHeader[] = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

export function getSecurityHeaders(): SecurityHeader[] {
  if (process.env.NODE_ENV === "production") {
    return [...SHARED_SECURITY_HEADERS, ...PRODUCTION_SECURITY_HEADERS];
  }

  return SHARED_SECURITY_HEADERS;
}
