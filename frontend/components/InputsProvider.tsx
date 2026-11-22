"use client";

// Keeps the resume + JD in memory while the user moves between Analyze and
// Compare. Deliberately NOT saved to localStorage: we never store resumes.
import { createContext, useContext, useState, type ReactNode } from "react";

type Inputs = {
  resume: string;
  jd: string;
  setResume: (v: string) => void;
  setJd: (v: string) => void;
};

const InputsContext = createContext<Inputs | null>(null);

export function InputsProvider({ children }: { children: ReactNode }) {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  return <InputsContext.Provider value={{ resume, jd, setResume, setJd }}>{children}</InputsContext.Provider>;
}

export function useInputs() {
  const ctx = useContext(InputsContext);
  if (!ctx) throw new Error("useInputs must be used inside <InputsProvider>");
  return ctx;
}
