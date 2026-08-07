import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://umbral.cl",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
