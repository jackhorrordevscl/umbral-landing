import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// Inline scripts are allowed by hash instead of `unsafe-inline`: after the build, every
// page gets a <meta> CSP listing the sha256 of the inline scripts it actually contains.
// (frame-ancestors cannot be set from a meta tag; vercel.json sends it as a header.)
function cspHashes() {
  const inlineScript = /<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g;

  const walk = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
    );
    return nested.flat();
  };

  return {
    name: "csp-hashes",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const files = (await walk(fileURLToPath(dir))).filter((f) => f.endsWith(".html"));
        for (const file of files) {
          const html = await readFile(file, "utf8");
          const hashes = [...html.matchAll(inlineScript)]
            .filter((m) => m[1].trim() !== "")
            .map((m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`);
          const policy = [
            "default-src 'self'",
            `script-src 'self' ${[...new Set(hashes)].join(" ")}`.trim(),
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self'",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'none'",
            "frame-src 'none'",
          ].join("; ");
          const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
          await writeFile(
            file,
            html.replace(/<meta charset="UTF-8"\s*\/?>/i, (m) => `${m}${meta}`),
          );
        }
      },
    },
  };
}

export default defineConfig({
  site: "https://umbral.groundzerodevs.com",
  trailingSlash: "always",
  integrations: [sitemap(), cspHashes()],
  vite: {
    plugins: [tailwindcss()],
  },
});
