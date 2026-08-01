import { defineConfig, devices } from "@playwright/test";

const FRONTEND_PORT = 4173;
const BACKEND_PORT = 4200; // dedicated port so e2e never collides with a dev server already on 4000

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Pinned to the sandbox's pre-installed browser build rather than
        // whatever revision this @playwright/test version would otherwise
        // try to download.
        launchOptions: { executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        launchOptions: { executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" },
      },
    },
  ],
  webServer: [
    {
      command: `cd ../backend && DATABASE_PATH=./data/e2e.sqlite CORS_ORIGIN=http://localhost:${FRONTEND_PORT} PORT=${BACKEND_PORT} npm run dev`,
      url: `http://localhost:${BACKEND_PORT}/api/health`,
      // Always start fresh: reusing a server left over from manual dev/
      // screenshot work is exactly how this suite ended up hitting a stale
      // build pointed at the wrong backend port (see commit history).
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      // VITE_API_URL is inlined at build time, so it has to be set before
      // `build`, not just before `preview` (which only serves the bundle).
      command: `VITE_API_URL=http://localhost:${BACKEND_PORT}/api/v1 npm run build && npm run preview -- --port ${FRONTEND_PORT} --strictPort`,
      url: `http://localhost:${FRONTEND_PORT}`,
      // Always start fresh: reusing a server left over from manual dev/
      // screenshot work is exactly how this suite ended up hitting a stale
      // build pointed at the wrong backend port (see commit history).
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
