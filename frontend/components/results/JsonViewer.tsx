"use client";

// Collapsible raw-JSON panel with lightweight syntax highlighting, plus
// copy and download buttons. Highlighting is a small regex tokenizer.
import { useState } from "react";

function highlight(json: string) {
  const esc = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let cls = "text-accent-ink"; // numbers
      if (m.startsWith('"')) cls = m.endsWith(":") ? "text-ink font-medium" : "text-low-fg";
      else if (/true|false|null/.test(m)) cls = "text-med-fg";
      return `<span class="${cls}">${m}</span>`;
    },
  );
}

export function JsonViewer({ data, filename = "resumelens-review.json" }: { data: unknown; filename?: string }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <details className="group rounded-[6px] border border-rule bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-3">
          <svg width="12" height="12" viewBox="0 0 12 12" className="transition-transform duration-300 group-open:rotate-90" aria-hidden>
            <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="font-medium">Raw JSON</span>
          <span className="font-mono text-xs text-muted">validated against the schema</span>
        </span>
        <span className="flex gap-1" onClick={(e) => e.preventDefault()}>
          <button type="button" onClick={copy} className="rounded-[4px] border border-rule px-2.5 py-1 font-mono text-xs text-ink transition-colors hover:border-ink">
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" onClick={download} className="rounded-[4px] border border-rule px-2.5 py-1 font-mono text-xs text-ink transition-colors hover:border-ink">
            Download
          </button>
        </span>
      </summary>
      <pre
        className="scroll-quiet max-h-[28rem] overflow-auto border-t border-rule bg-paper-2/60 p-4 font-mono text-[0.78rem] leading-relaxed text-ink-2"
        dangerouslySetInnerHTML={{ __html: highlight(text) }}
      />
    </details>
  );
}
