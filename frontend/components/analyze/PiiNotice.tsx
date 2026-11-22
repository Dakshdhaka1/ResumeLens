"use client";

// Shows which contact details will be removed before the text is sent to a model.
// Uses the backend's own stripper, so what you see is exactly what happens.
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, type PiiItem } from "@/lib/api";

const LABEL: Record<string, string> = { email: "Email", phone: "Phone", profile_url: "Profile link", address: "Address" };

export function PiiNotice({ text }: { text: string }) {
  const [items, setItems] = useState<PiiItem[]>([]);

  useEffect(() => {
    if (!text.trim()) {
      setItems([]);
      return;
    }
    const t = setTimeout(() => {
      api.piiPreview(text).then((r) => setItems(r.removed)).catch(() => setItems([]));
    }, 400);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div className="rounded-[6px] border border-rule bg-paper-2/70 px-4 py-3" aria-live="polite">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <rect x="2.5" y="7" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          {items.length ? `${items.length} contact detail${items.length > 1 ? "s" : ""} will be removed before sending` : "No contact details detected"}
        </span>
        <AnimatePresence initial={false}>
          {items.map((it, i) => (
            <motion.span
              key={`${it.type}-${it.value}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="inline-flex max-w-full items-center gap-1.5 rounded-[2px] border border-rule bg-card px-2 py-0.5 text-xs"
            >
              <span className="folio !text-[10px]">{LABEL[it.type] ?? it.type}</span>
              <s className="truncate font-mono text-muted decoration-accent">{it.value}</s>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-1.5 text-xs text-muted">Nothing you paste is stored. The text is held in memory only for this analysis.</p>
    </div>
  );
}
