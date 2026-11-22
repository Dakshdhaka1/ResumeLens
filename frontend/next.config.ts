import path from "node:path";
import type { NextConfig } from "next";

// The browser calls /api/*; Next forwards it to FastAPI. No CORS setup needed,
// and the backend URL can be changed with BACKEND_URL.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Separate folders so running `next build` never breaks a running `next dev`.
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
  devIndicators: false,
  // Model calls (plus one retry) can take a while; the default proxy timeout is 30s.
  experimental: { proxyTimeout: 180_000 },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/:path*` }];
  },
};

export default nextConfig;
