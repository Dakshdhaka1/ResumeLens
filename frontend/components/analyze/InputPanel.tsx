"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, type DragEvent } from "react";
import { api } from "@/lib/api";

const MAX = 20000;

type Props = {
  folio: string;
  title: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  allowPdf?: boolean;
  onLoadSample?: () => void;
};

export function InputPanel({ folio, title, placeholder, value, onChange, allowPdf, onLoadSample }: Props) {
  const id = title.toLowerCase().replace(/\s+/g, "-");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pdfState, setPdfState] = useState<{ busy: boolean; error?: string; name?: string }>({ busy: false });

  const readPdf = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setPdfState({ busy: false, error: "That isn't a PDF. Paste the text instead." });
      return;
    }
    setPdfState({ busy: true, name: file.name });
    try {
      const { text } = await api.extractPdf(file);
      onChange(text);
      setPdfState({ busy: false, name: file.name });
    } catch (e) {
      setPdfState({ busy: false, error: (e as Error).message });
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && allowPdf) readPdf(file);
  };

  const count = value.length;
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div
      className={`relative flex flex-col rounded-[6px] border bg-card transition-colors duration-150 ${dragging ? "border-accent" : "border-rule focus-within:border-ink"}`}
      onDragOver={(e) => {
        if (!allowPdf) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <label htmlFor={id} className="flex items-baseline gap-3">
          <span className="font-mono text-xs text-accent-ink">{folio}</span>
          <span className="font-display text-xl font-semibold tracking-[-0.02em]">{title}</span>
        </label>
        <div className="flex items-center gap-1">
          {onLoadSample && (
            <button type="button" onClick={onLoadSample} className="rounded-[4px] px-2 py-1 text-sm text-muted underline decoration-rule underline-offset-4 transition-colors hover:text-ink hover:decoration-accent">
              Load sample
            </button>
          )}
          {value && (
            <button type="button" onClick={() => onChange("")} className="rounded-[4px] px-2 py-1 text-sm text-muted transition-colors hover:text-ink">
              Clear
            </button>
          )}
        </div>
      </div>

      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        placeholder={placeholder}
        spellCheck={false}
        className="scroll-quiet min-h-[18rem] w-full flex-1 resize-y bg-transparent px-4 py-4 font-mono text-[0.82rem] leading-[1.7] text-ink placeholder:text-muted/80 focus:outline-none md:min-h-[24rem]"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule px-4 py-2.5">
        {allowPdf ? (
          <div className="flex items-center gap-2 text-sm">
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="sr-only" id={`${id}-pdf`} onChange={(e) => e.target.files?.[0] && readPdf(e.target.files[0])} />
            <label htmlFor={`${id}-pdf`} className="cursor-pointer rounded-[4px] border border-dashed border-rule px-2.5 py-1 text-muted transition-colors hover:border-ink hover:text-ink">
              {pdfState.busy ? "Reading PDF…" : "Drop or choose a PDF"}
            </label>
            {pdfState.name && !pdfState.busy && !pdfState.error && <span className="truncate text-xs text-muted">{pdfState.name}: read in memory, not saved</span>}
            {pdfState.error && <span className="text-xs text-high-fg">{pdfState.error}</span>}
          </div>
        ) : (
          <span className="text-sm text-muted">Paste the full posting, including requirements.</span>
        )}
        <span className={`font-mono text-xs tabular ${count > MAX * 0.9 ? "text-accent-ink" : "text-muted"}`}>
          {words.toLocaleString()} words · {count.toLocaleString()}/{MAX.toLocaleString()}
        </span>
      </div>

      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 grid place-items-center rounded-[6px] bg-paper/85"
          >
            <p className="font-display text-2xl italic text-accent-ink">Drop the PDF to read it</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
