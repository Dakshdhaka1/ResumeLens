"use client";

import { useEffect, useState } from "react";
import { api, type Sample } from "@/lib/api";

/** Loads the made-up test cases from the backend for the "Load sample" buttons. */
export function useSamples() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .samples()
      .then((s) => {
        setSamples(s);
        setSelected(s[0]?.id ?? "");
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const current = samples.find((s) => s.id === selected);
  return { samples, selected, setSelected, current, error };
}
