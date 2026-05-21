import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Detect deploy environment + commit
// Cloudflare Pages exposes CF_PAGES, CF_PAGES_COMMIT_SHA, CF_PAGES_BRANCH
// Lovable / local fall back to a timestamp.
const commitSha =
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.VITE_COMMIT_SHA ||
  process.env.COMMIT_SHA ||
  `dev-${Date.now()}`;

const environment = (() => {
  if (process.env.CF_PAGES === "1") {
    return process.env.CF_PAGES_BRANCH === "main" || process.env.CF_PAGES_BRANCH === "master"
      ? "cloudflare-production"
      : "cloudflare-preview";
  }
  if (process.env.LOVABLE === "1" || process.env.VITE_LOVABLE) return "lovable";
  return process.env.VITE_ENVIRONMENT || "lovable";
})();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  define: {
    __APP_VERSION__: JSON.stringify(commitSha),
    __APP_ENV__: JSON.stringify(environment),
    __APP_BUILT_AT__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
