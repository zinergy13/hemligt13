#!/usr/bin/env node
// Brand-skanner: blockar publicering om externa appskapar-referenser
// (Lovable, GPT Engineer m.fl.) hittas i källkod eller renderad HTML.
//
// Användning:
//   node scripts/brand-scan.mjs              -> skannar källkod (snabb)
//   node scripts/brand-scan.mjs --render     -> även renderad HTML via preview-server

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const RENDER = process.argv.includes("--render");

// Termer som ALDRIG får synas för slutanvändare.
const FORBIDDEN = [
  /\blovable\b/i,
  /lovable\.dev/i,
  /lovable\.app/i,
  /\bgpt[-\s]?engineer\b/i,
  /\bgptengineer\b/i,
  /made with lovable/i,
  /powered by lovable/i,
  /built with lovable/i,
  /edit with lovable/i,
];

// Filer/mappar där träffar är OK (interna integrationer, build-artefakter, skannern själv).
const WHITELIST_PATHS = [
  "node_modules",
  ".git",
  "dist",
  ".output",
  ".vinxi",
  ".tanstack",
  ".lovable",
  "docs",
  "scripts/brand-scan.mjs",
  "src/integrations/lovable",
  "src/integrations/supabase",
  "src/lib/stripe.server.ts",
  "src/lib/email/send-internal.ts",
  "src/routes/lovable",
  "src/routeTree.gen.ts",
  "src/router.tsx",
  "src/routes/__root.tsx",
  "supabase/config.toml",
  "package.json",
  "package-lock.json",
  "bun.lockb",
  "bun.lock",
  ".env",
  ".lovableignore",
];

// Filändelser som skannas (användarsynlig kod/markup/text).
const SCAN_EXT = new Set([
  ".tsx", ".ts", ".jsx", ".js", ".html", ".css",
  ".md", ".mdx", ".json", ".svg",
]);

const isWhitelisted = (rel) =>
  WHITELIST_PATHS.some((w) => rel === w || rel.startsWith(w + "/") || rel.startsWith(w + sep));

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (isWhitelisted(rel)) continue;
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function scanText(text, label, hits) {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Hoppa över rader som bara är tekniska imports/paths (ej användarsynligt).
    if (
      /@lovable\.dev\//.test(line) ||
      /@\/integrations\/lovable/.test(line) ||
      /from\s+["']@lovable\.dev/.test(line) ||
      // Interna Lovable-endpoints (webhook/kö/transaktionsmejl) — ej användarsynliga
      /["']\/lovable\//.test(line) ||
      // SDK-identifier (ej användarsynlig text), t.ex. `lovable.auth.signIn(...)`
      /\blovable\s*\.\s*[a-zA-Z_]/.test(line)
    ) continue;
    for (const re of FORBIDDEN) {
      const m = line.match(re);
      if (m) {
        hits.push({ where: `${label}:${i + 1}`, match: m[0], snippet: line.trim().slice(0, 160) });
      }
    }
  }
}

function scanSource() {
  const hits = [];
  let count = 0;
  for (const file of walk(ROOT)) {
    const rel = relative(ROOT, file);
    const dot = rel.lastIndexOf(".");
    const ext = dot >= 0 ? rel.slice(dot) : "";
    if (!SCAN_EXT.has(ext)) continue;
    count++;
    let text;
    try { text = readFileSync(file, "utf8"); } catch { continue; }
    scanText(text, rel, hits);
  }
  return { hits, count };
}

async function waitFor(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url, { method: "GET" });
      if (r.ok || r.status === 404) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function scanRendered() {
  const hits = [];
  const routes = ["/", "/sok", "/logga-in", "/hyr-ut", "/kontakt", "/__not_found_check"];
  if (!existsSync(join(ROOT, ".output")) && !existsSync(join(ROOT, "dist"))) {
    console.warn("⚠ render-skanning hoppades över: ingen build-output (kör efter `vite build`).");
    return { hits, count: 0, skipped: true };
  }
  const port = 4319;
  const proc = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], {
    cwd: ROOT, stdio: "pipe", env: { ...process.env },
  });
  proc.stdout.on("data", () => {});
  proc.stderr.on("data", () => {});
  const base = `http://127.0.0.1:${port}`;
  const ok = await waitFor(base);
  if (!ok) {
    proc.kill("SIGTERM");
    console.warn("⚠ render-skanning hoppades över: preview-servern startade inte.");
    return { hits, count: 0, skipped: true };
  }
  let count = 0;
  for (const r of routes) {
    try {
      const res = await fetch(base + r);
      const html = await res.text();
      count++;
      scanText(html, `rendered:${r}`, hits);
    } catch {}
  }
  proc.kill("SIGTERM");
  return { hits, count, skipped: false };
}

(async () => {
  console.log("🔎 Brand-skanner körs…");
  const src = scanSource();
  let render = { hits: [], count: 0, skipped: true };
  if (RENDER) render = await scanRendered();

  const all = [...src.hits, ...render.hits];
  if (all.length > 0) {
    console.error(`\n✗ Brand-skanning misslyckades — ${all.length} förbjuden(a) referens(er):`);
    for (const h of all.slice(0, 50)) {
      console.error(`  ${h.where}  "${h.match}"  ${h.snippet ? "→ " + h.snippet : ""}`);
    }
    if (all.length > 50) console.error(`  … och ${all.length - 50} till.`);
    console.error("\nPublicering blockad. Ta bort referenserna och försök igen.\n");
    process.exit(1);
  }
  const renderInfo = RENDER
    ? render.skipped ? "render: hoppad" : `render: ${render.count} rutter`
    : "render: ej körd";
  console.log(`✓ Brand-skanning OK (källkod: ${src.count} filer, ${renderInfo}).`);
})();