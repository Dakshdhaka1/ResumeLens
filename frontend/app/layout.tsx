import type { Metadata } from "next";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Background } from "@/components/Background";
import { InputsProvider } from "@/components/InputsProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { themeInitScript } from "@/components/ThemeToggle";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz", "SOFT"], style: ["normal", "italic"] });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "ResumeLens: rubric-driven resume feedback",
  description:
    "Paste your resume and a job description. ResumeLens finds the gaps, rewrites weak bullets using only your facts, and scores you against a fixed rubric.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">
          Skip to content
        </a>
        <Background />
        <InputsProvider>
          <SiteHeader />
          <main id="main">{children}</main>
        </InputsProvider>
        <footer className="mt-24 border-t border-rule">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              <span className="font-display text-base text-ink">ResumeLens</span>: a prompt-engineering mini-project, SCSE4041.
            </p>
            <p className="folio">Resumes are never stored · contact details stripped before sending</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
