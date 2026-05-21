// Build-time constants injected by vite.config.ts
declare const __APP_VERSION__: string;
declare const __APP_ENV__: string;
declare const __APP_BUILT_AT__: string;

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

export const APP_ENV: "lovable" | "cloudflare-preview" | "cloudflare-production" | "local" =
  (typeof __APP_ENV__ !== "undefined" ? (__APP_ENV__ as any) : "lovable");

export const APP_BUILT_AT: string =
  typeof __APP_BUILT_AT__ !== "undefined" ? __APP_BUILT_AT__ : new Date().toISOString();

export const APP_VERSION_SHORT = APP_VERSION.slice(0, 7);
