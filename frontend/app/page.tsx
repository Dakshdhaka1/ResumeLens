"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HeroLens } from "@/components/illustrations/HeroLens";
import { RubricIcon } from "@/components/illustrations/RubricIcons";
import { Arrow, MagneticButton } from "@/components/ui/MagneticButton";
import { CRITERIA } from "@/lib/api";

const HEADLINE: { text: string; em?: boolean }[] = [
  { text: "Read" }, { text: "your" }, { text: "resume" }, { text: "the" }, { text: "way" }, { text: "the" },
  { text: "job", em: true }, { text: "description", em: true }, { text: "does." },
];

const STEPS = [
  {
    n: "01",
    title: "Paste two documents",
    body: "Your resume and the JD you're applying to. Emails, phone numbers, addresses and profile links are stripped before anything is sent to a model, and nothing is saved.",
  },
  {
    n: "02",
    title: "The lens reads both",
    body: "Gemini or GPT-OSS extracts what the role really asks for, then checks your resume line by line against it, using a prompt you can inspect and compare.",
  },
  {
    n: "03",
    title: "Fix what matters first",
    body: "Gaps ranked high to low, your three weakest bullets rewritten using only your own facts, and a score out of 100 with a reason for every point.",
  },
];

const POINTS = { skills_match: 40, projects_experience: 30, bullet_clarity: 20, formatting_length: 10 } as const;
const RUBRIC_NOTES = {
  skills_match: "How many of the JD's key requirements your resume clearly shows.",
  projects_experience: "Whether your projects and internships are relevant to this role.",
  bullet_clarity: "Action-led bullets that say what you built and what changed.",
  formatting_length: "Clear sections, consistent style, about one page.",
} as const;

export default function Home() {
  const reduce = useReducedMotion();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rule">
        <div aria-hidden className="ruled absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]" />
        <div aria-hidden className="absolute inset-y-0 left-4 w-px bg-accent/30 sm:left-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))]" />
        <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-12 md:pb-24 md:pt-20">
          <div className="pl-4 sm:pl-8 md:col-span-7">
            <p className="folio mb-8">
              Issue 01 <span className="text-accent-ink">·</span> Campus placements, 2026
            </p>
            <h1 className="display text-[clamp(2.9rem,8.2vw,6.6rem)] text-ink">
              {HEADLINE.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <motion.span
                    className={`inline-block ${w.em ? "italic text-accent-ink" : ""}`}
                    initial={{ y: reduce ? 0 : "105%", opacity: reduce ? 0 : 1 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: reduce ? 0.2 : 0.8, delay: reduce ? 0 : 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {w.text}
                  </motion.span>
                  {i < HEADLINE.length - 1 && " "}
                </span>
              ))}
            </h1>
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: reduce ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-ink-2">
                ResumeLens compares your resume with one specific job, ranks what&apos;s missing, rewrites your weakest bullets
                without inventing a single fact, and scores you on a fixed four-part rubric.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <MagneticButton href="/analyze">
                  Try it on your resume <Arrow />
                </MagneticButton>
                <MagneticButton href="/eval" variant="ghost">
                  See how the prompts were tested
                </MagneticButton>
              </div>
              <dl className="mt-12 grid max-w-[30rem] grid-cols-3 gap-6 border-t border-rule pt-5">
                {[
                  ["3", "prompt versions"],
                  ["2", "models compared"],
                  ["4", "rubric criteria"],
                ].map(([n, label]) => (
                  <div key={label}>
                    <dt className="sr-only">{label}</dt>
                    <dd className="font-mono text-3xl font-medium tabular text-ink">{n}</dd>
                    <dd className="mt-1 text-sm text-muted">{label}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>
          <motion.div
            className="relative md:col-span-5 md:-mr-6"
            initial={{ opacity: 0, rotate: reduce ? 0 : 3, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, rotate: 0, y: 0 }}
            transition={{ duration: 1, delay: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroLens className="mx-auto w-full max-w-[460px]" />
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6" aria-labelledby="how">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="folio">02 / Method</p>
            <h2 id="how" className="display mt-3 text-5xl">
              How it <span className="italic">works</span>
            </h2>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-[6px] border border-rule bg-rule md:col-span-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                className="flex flex-col gap-3 bg-card p-6"
                initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="font-mono text-sm text-accent-ink">{s.n}</span>
                <h3 className="font-display text-2xl font-semibold tracking-[-0.02em]">{s.title}</h3>
                <p className="text-[0.95rem] leading-relaxed text-ink-2">{s.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* RUBRIC */}
      <section className="border-y border-rule bg-paper-2/60" aria-labelledby="rubric">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-20 sm:px-6 md:grid-cols-12">
          <div className="order-2 md:col-span-8">
            <ul className="divide-y divide-rule border-y border-rule">
              {CRITERIA.map((c) => (
                <li key={c.key} className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-4 py-5 sm:grid-cols-[3rem_1fr_6rem]">
                  <RubricIcon criterion={c.key} className="h-9 w-9 text-ink sm:h-10 sm:w-10" />
                  <div>
                    <h3 className="font-display text-xl font-semibold tracking-[-0.015em]">{c.label}</h3>
                    <p className="mt-1 text-[0.95rem] text-ink-2">{RUBRIC_NOTES[c.key]}</p>
                  </div>
                  <p className="text-right font-mono text-3xl tabular text-ink">
                    {POINTS[c.key]}
                    <span className="text-base text-muted"> pts</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 md:col-span-4">
            <p className="folio">03 / The rubric</p>
            <h2 id="rubric" className="display mt-3 text-5xl">
              One fixed <span className="italic">yardstick</span>
            </h2>
            <p className="mt-5 max-w-sm text-ink-2">
              The same four criteria are written into every prompt, with what earns full, partial and zero points, so a score
              means the same thing every time you run it.
            </p>
            <p className="mt-6 border-l-2 border-accent pl-4 text-sm text-muted">
              The score is guidance for you, not a hiring decision. Recruiters weigh things no rubric can see.
            </p>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="mx-auto max-w-[1280px] px-4 pt-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <h2 className="display max-w-3xl text-[clamp(2.4rem,5vw,4rem)]">
            Ten minutes now beats one generic resume sent to <span className="italic text-accent-ink">forty</span> roles.
          </h2>
          <MagneticButton href="/analyze" variant="ink">
            Open the analyzer <Arrow />
          </MagneticButton>
        </div>
      </section>
    </>
  );
}
