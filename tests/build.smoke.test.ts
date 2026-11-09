import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
      for (const id of ["capturas", "funcionalidades", "marco-legal", "acceso"]) {
        expect(content).toContain(`id="${id}"`);
      }
    });

    it("points canonical and og:url at the real production domain", () => {
      const content = html();
      expect(content).toContain(`href="${SITE}/"`);
      expect(content).toContain(`content="${SITE}/"`);
    });

    it("never leaks the plain contact email into the HTML source", () => {
      expect(html()).not.toContain("contacto@groundzerodevs.com");
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
      expect(html()).not.toContain("contacto@groundzerodevs.com");
    });

    it("describes the credential storage the backend really does", () => {
      const text = html()
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
      // only the refresh token is persisted, with AES-256-GCM; the access token never is
      expect(text).toContain("token de actualización");
      expect(text).toContain("AES-256-GCM");
      expect(text).toMatch(/token de acceso[^.]*no se guarda/i);
      expect(text).not.toMatch(/AES-GCM(?!\w)/);
      expect(text).not.toMatch(/ni transmite en texto plano/i);
      expect(text).not.toMatch(/revoca el token de acceso/i);
    });
  });

  describe("general privacy policy page", () => {
    const html = () => readDist("privacidad-general/index.html");

    it("exists and renders all 14 sections (0-13)", () => {
      const content = html();
      for (let section = 0; section <= 13; section++) {
        expect(content).toMatch(new RegExp(`>\\s*${section}\\.`));
      }
    });

    it("identifies the data controller by name and RUT", () => {
      expect(html()).toContain("17.661.989-9");
    });

    it("never claims CENS certification is already obtained", () => {
      const content = html();
      expect(content).toContain("no una certificación obtenida");
    });

    it("never leaks the plain contact email into the HTML source", () => {
      expect(html()).not.toContain("contacto@groundzerodevs.com");
    });
  });

  describe("terms of service page", () => {
    const html = () => readDist("terminos/index.html");

    it("renders exactly 11 consecutively numbered sections and no unfinished clause", () => {
      const content = html();
      const numbers = [...content.matchAll(/<h2[^>]*>\s*(\d+)\./g)].map((m) => Number(m[1]));
      expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      expect(content).not.toMatch(/en revisión legal/i);
      expect(content).not.toMatch(/Limitación de responsabilidad/i);
    });

    it("never leaks the plain contact email into the HTML source", () => {
      expect(html()).not.toContain("contacto@groundzerodevs.com");
    });

    it("ties acceptance to the invitation and names both channels for changes", () => {
      const text = html()
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
      // sign-up is by invitation, so acceptance cannot hang on "creating an account" alone
      expect(text).not.toMatch(/Al crear una cuenta en Umbral aceptas/i);
      expect(text).toMatch(/Al crear tu cuenta con una invitación aceptas estos términos/i);
      // changes are announced in the app and by email, not by an unspecified means
      expect(text).toMatch(/te avisaremos de los cambios relevantes dentro de Umbral y por correo/i);
    });

    it("states the launch price exactly as decided: $6.990 monthly, VAT included, 12 months, valid 30 days, then $11.990 monthly", () => {
      const text = html()
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
      expect(text).toMatch(/precio de lanzamiento[^.]*\$\s?6\.990 mensuales[^.]*12 meses/i);
      expect(text).toMatch(/\$\s?6\.990 mensuales,? IVA incluido/i);
      expect(text).toMatch(/suscripci[oó]n es válida por 30 días/i);
      expect(text).toMatch(/12 meses contados desde el primer pago/i);
      expect(text).toMatch(/Después, el precio es de \$\s?11\.990 mensuales,? IVA incluido/i);
      expect(text).not.toMatch(/sin cobro de suscripci[oó]n/i);
    });
  });

  describe("SEO/crawling files", () => {
    it("robots.txt points to the real production sitemap", () => {
      expect(readDist("robots.txt")).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
    });

    it("sitemap lists all pages under the real production domain", () => {
      const content = readDist("sitemap-0.xml");
      expect(content).toContain(`<loc>${SITE}/</loc>`);
      expect(content).toContain(`<loc>${SITE}/privacidad-google-calendar/</loc>`);
      expect(content).toContain(`<loc>${SITE}/privacidad-general/</loc>`);
      expect(content).toContain(`<loc>${SITE}/terminos/</loc>`);
    });
  });

  describe("copy rules", () => {
    const pages = [
      "index.html",
      "privacidad-general/index.html",
      "privacidad-google-calendar/index.html",
      "terminos/index.html",
      "404.html",
    ];
    // visible text only: scripts, styles and tags are dropped
    const textOf = (path: string) =>
      readDist(path)
        .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;|\s+/g, " ");

    it.each(pages)("%s makes none of the claims we cannot back up", (page) => {
      const text = textOf(page);
      expect(text).not.toMatch(/gratis|gratuito|cupos limitados|terapeutas reales/i);
      expect(text).not.toMatch(/\bcertificad[oa]s?\b/i);
      expect(text).not.toMatch(/\bcumple con\b|\bconforme a la ley\b/i);
      // the only published price is the launch price, and only in the Terms (see below)
      expect(text).not.toMatch(/\b12\.?990\b/);
      if (page !== "terminos/index.html") expect(text).not.toMatch(/\b6\.?990\b|\b11\.?990\b/);
    });

    it.each(pages)("%s only mentions certification to deny it", (page) => {
      for (const match of textOf(page).matchAll(/certificación/gi)) {
        const before = textOf(page)
          .slice(Math.max(0, match.index - 12), match.index)
          .toLowerCase();
        expect(before).toMatch(/no es una $|no una $/);
      }
    });

    it("every access button reads 'Solicita tu acceso'", () => {
      const content = readDist("index.html");
      expect(content).not.toContain("Solicitar acceso");
      expect(content.match(/>\s*Solicita tu acceso\s*</g)?.length).toBeGreaterThanOrEqual(4);
    });

    it("never says 'Cumplimiento legal' as a section label", () => {
      expect(textOf("index.html")).not.toMatch(/Cumplimiento legal/i);
    });
  });

  describe("links", () => {
    const pages = [
      "index.html",
      "privacidad-general/index.html",
      "privacidad-google-calendar/index.html",
      "terminos/index.html",
      "404.html",
    ];
    const ids = (html: string) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    const home = () => readDist("index.html");

    it.each(pages)("%s: every in-page and home anchor points at an element that exists", (page) => {
      const html = readDist(page);
      const here = ids(html);
      const homeIds = ids(home());
      for (const [, hash] of html.matchAll(/href="#([^"]+)"/g)) {
        if (hash === "") continue; // mailto placeholders, filled at runtime
        expect(here.has(hash), `${page} -> #${hash}`).toBe(true);
      }
      for (const [, hash] of html.matchAll(/href="\/#([^"]+)"/g)) {
        expect(homeIds.has(hash), `${page} -> /#${hash}`).toBe(true);
      }
    });

    it("legal pages never link to anchors that only exist on the home page", () => {
      for (const page of pages.slice(1, 4)) {
        const html = readDist(page);
        expect(html, page).not.toMatch(/href="#(top|cumplimiento|capturas|funcionalidades|marco-legal|acceso)"/);
      }
    });

    it("legal pages give a readable contact fallback without exposing the address", () => {
      for (const page of pages.slice(1, 4)) {
        const html = readDist(page);
        expect(html, page).toContain("contacto (arroba) groundzerodevs (punto) com");
        expect(html, page).not.toMatch(/data-mailto-user="contacto"[^>]*>\s*<\/a>/);
      }
    });
  });

  describe("accessibility structure", () => {
    it("the screenshot viewer is a keyboard-operable tablist, not a scrollable region", () => {
      const html = readDist("index.html");
      expect(html).toContain('role="tablist"');
      expect(html).not.toContain('id="showcase-track"');
      expect(html.match(/role="tab"/g)?.length).toBe(7);
      // tab semantics for the panels are applied by the script, so no-JS readers get plain figures
      expect(html).not.toContain('role="tabpanel"');
      expect(html.match(/class="shot-panel"/g)?.length).toBe(7);
    });

    it("the 404 page is noindex and declares no canonical", () => {
      const html = readDist("404.html");
      expect(html).toContain('name="robots" content="noindex"');
      expect(html).not.toContain('rel="canonical"');
      expect(html).not.toContain('property="og:url"');
    });

    it("both navigation landmarks are named", () => {
      const html = readDist("index.html");
      expect(html.match(/<nav[^>]*aria-label="Principal"/g)?.length).toBe(2);
    });
  });

  describe("security", () => {
    const pages = [
      "index.html",
      "privacidad-general/index.html",
      "privacidad-google-calendar/index.html",
      "terminos/index.html",
      "404.html",
    ];

    it.each(pages)("%s carries a CSP that allows exactly its inline scripts by hash", (page) => {
      const html = readDist(page);
      const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "";
      expect(policy).toContain("default-src 'self'");
      expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
      const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].filter(
        (m) => m[1].trim() !== "",
      );
      for (const [, body] of inline) {
        expect(policy).toContain(`'sha256-${createHash("sha256").update(body).digest("base64")}'`);
      }
    });

    it.each(pages)("%s ships no inline styles, so style-src needs no unsafe-inline", (page) => {
      const html = readDist(page);
      const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "";
      expect(policy).toMatch(/style-src 'self'(;|$)/);
      expect(policy).not.toContain("'unsafe-inline'");
      expect(html).not.toMatch(/<style[\s>]/);
      expect(html).not.toMatch(/\sstyle="/);
    });

    it("declares metric-matched fallbacks for both webfonts so the swap does not shift layout", () => {
      const css = readdirSync(dist("_astro"))
        .filter((f) => f.endsWith(".css"))
        .map((f) => readFileSync(dist(`_astro/${f}`), "utf-8"))
        .join("");
      expect(css).toMatch(/font-family:\s*"?DM Serif Fallback"?[^}]*size-adjust/);
      expect(css).toMatch(/font-family:\s*"?DM Sans Fallback"?[^}]*size-adjust/);
    });

    it("links an apple-touch-icon that exists on disk", () => {
      expect(readDist("index.html")).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
      expect(existsSync(dist("apple-touch-icon.png"))).toBe(true);
    });

    it("keeps the footer year current in the browser, with the build year as fallback", () => {
      const html = readDist("index.html");
      expect(html).toMatch(/<span id="footer-year">\d{4}<\/span>/);
      expect(html).toContain("footer-year");
    });

    it("vercel.json sends the hardening headers and a trailing-slash policy", () => {
      const config = JSON.parse(readFileSync(resolve(__dirname, "..", "vercel.json"), "utf-8"));
      const all = config.headers.find((h: { source: string }) => h.source === "/(.*)").headers as { key: string }[];
      const keys = all.map((h) => h.key);
      for (const key of [
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Content-Security-Policy",
      ]) {
        expect(keys).toContain(key);
      }
      expect(config.trailingSlash).toBe(true);
    });

    it("preloads the two above-the-fold fonts that exist on disk", () => {
      const html = readDist("index.html");
      for (const font of ["dm-serif-display.woff2", "dm-sans-400.woff2"]) {
        expect(html).toContain(`href="/fonts/${font}"`);
        expect(readdirSync(dist("fonts"))).toContain(font);
      }
    });
  });
});
