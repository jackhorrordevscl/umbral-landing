import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dist = (path: string) => resolve(__dirname, "..", "dist", path);
const readDist = (path: string) => readFileSync(dist(path), "utf-8");

const SITE = "https://umbral.groundzerodevs.com";

describe("build output", () => {
  it("was generated (run `npm run build` before this test)", () => {
    expect(existsSync(dist("index.html"))).toBe(true);
  });

  describe("home page", () => {
    const html = () => readDist("index.html");

    it("renders the skip link target and every nav anchor section", () => {
      const content = html();
      expect(content).toContain('id="main-content"');
      for (const id of ["capturas", "funcionalidades", "cumplimiento", "acceso"]) {
        expect(content).toContain(`id="${id}"`);
      }
    });

    it("points canonical and og:url at the real production domain", () => {
      const content = html();
      expect(content).toContain(`href="${SITE}/"`);
      expect(content).toContain(`content="${SITE}/"`);
    });

    it("never leaks the plain contact email into the HTML source", () => {
      expect(html()).not.toContain("hola@umbral.cl");
    });
  });

  describe("google calendar privacy policy page", () => {
    const html = () => readDist("privacidad-google-calendar/index.html");

    it("exists and renders all 7 sections", () => {
      const content = html();
      for (let section = 1; section <= 7; section++) {
        expect(content).toMatch(new RegExp(`>\\s*${section}\\.`));
      }
    });

    it("never leaks the plain contact email into the HTML source", () => {
      expect(html()).not.toContain("hola@umbral.cl");
    });
  });

  describe("SEO/crawling files", () => {
    it("robots.txt points to the real production sitemap", () => {
      expect(readDist("robots.txt")).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
    });

    it("sitemap lists both pages under the real production domain", () => {
      const content = readDist("sitemap-0.xml");
      expect(content).toContain(`<loc>${SITE}/</loc>`);
      expect(content).toContain(`<loc>${SITE}/privacidad-google-calendar/</loc>`);
    });
  });
});
