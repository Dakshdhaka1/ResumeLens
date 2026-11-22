// Takes full-page screenshots of every screen on desktop and mobile, light and dark.
// Needs both servers running (ideally with RESUMELENS_MOCK=1).
//   cd frontend && npm run screenshots
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "screenshots");
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shoot(page, name) {
  // Scroll through the page so scroll-triggered reveals play, then back to top.
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await wait(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(700);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) console.warn(`  !! ${name}: horizontal overflow of ${overflow}px`);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  console.log("saved", name);
}

async function loadSampleAndRun(page, sampleId, buttonText) {
  await page.waitForSelector("#sample option[value]", { state: "attached" });
  if (sampleId) await page.selectOption("#sample", sampleId);
  await page.getByRole("button", { name: "Load both" }).click();
  await page.getByRole("button", { name: buttonText }).click();
}

const browser = await chromium.launch();
for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, deviceScaleFactor: vp.deviceScaleFactor ?? 1, colorScheme: theme });
    const page = await ctx.newPage();
    const tag = `${vpName}-${theme}`;

    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await wait(2200);
    await shoot(page, `01-landing-${tag}`);

    await page.goto(`${BASE}/analyze`, { waitUntil: "networkidle" });
    await wait(800);
    await shoot(page, `02-analyze-empty-${tag}`);

    await loadSampleAndRun(page, "03_web_dev", /Analyse with/);
    await wait(5000);
    await shoot(page, `03-analyze-results-${tag}`);

    await page.goto(`${BASE}/compare`, { waitUntil: "networkidle" });
    await loadSampleAndRun(page, "09_injection", /^Compare /);
    await wait(4500);
    await shoot(page, `04-compare-${tag}`);

    await page.goto(`${BASE}/eval`, { waitUntil: "networkidle" });
    await wait(2000);
    await shoot(page, `05-eval-${tag}`);
    await ctx.close();
  }
}

// Loading state (captured mid-request by delaying the API response).
const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
const page = await ctx.newPage();
await page.route("**/api/analyze", async (route) => {
  await wait(6000);
  await route.continue();
});
await page.goto(`${BASE}/analyze`, { waitUntil: "networkidle" });
await loadSampleAndRun(page, null, /Analyse with/);
await wait(1200);
await page.screenshot({ path: join(OUT, "06-loading-desktop-light.png") });
await wait(1300);
await page.screenshot({ path: join(OUT, "06b-loading-desktop-light.png") });
console.log("saved 06-loading");
await browser.close();
