"use client";

import { useState } from "react";

type CopyBibtexButtonProps = {
  bibtex: string;
};

export default function CopyBibtexButton({ bibtex }: CopyBibtexButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bibtex);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — silently no-op.
    }
  }

  return (
    <button
      type="button"
      className="copy-bibtex"
      onClick={handleCopy}
      aria-label="Copy BibTeX citation"
      data-copied={copied ? "true" : undefined}
    >
      <span className="copy-bibtex__icon" aria-hidden="true">
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 13 4 4 10-11" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        )}
      </span>
      {copied ? "Copied" : "BibTeX"}
    </button>
  );
}
