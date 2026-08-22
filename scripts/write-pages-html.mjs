#!/usr/bin/env node
/**
 * GitHub Pages is static. TanStack Start's github_pages prerender emits empty
 * HTML here, so after a GITHUB_PAGES client build we write a shell that loads
 * the hashed bundles the same way the SSR title screen does.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dest = ".output/public";
const src = existsSync(".vercel/output/static") ? ".vercel/output/static" : dest;
if (!existsSync(src)) {
  console.error("Pages build: missing client output at .vercel/output/static");
  process.exit(1);
}
if (src !== dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

const files = readdirSync(join(dest, "assets"));
const css = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));
const indexJs = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const routesJs = files.find((f) => f.startsWith("routes-") && f.endsWith(".js"));
if (!css || !indexJs || !routesJs) {
  console.error("Pages build: missing hashed assets", { css, indexJs, routesJs, files });
  process.exit(1);
}

const base = "/Dwarf-Lord";
const html = `<!DOCTYPE html>
<html lang="en" class="antialiased">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <title>Dwarf Lord</title>
  <meta name="theme-color" content="#0e0d0b"/>
  <meta name="description" content="You bought a hole in a mountain. Rebuild a ruined dwarf mining colony."/>
  <meta property="og:title" content="Dwarf Lord"/>
  <meta property="og:type" content="x:game"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <link rel="icon" type="image/svg+xml" href="${base}/favicon.svg"/>
  <link rel="preload" as="image" href="${base}/art/camp-vista.jpg" crossorigin=""/>
  <link rel="stylesheet" href="${base}/assets/${css}"/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&display=swap"/>
  <link rel="modulepreload" href="${base}/assets/${indexJs}"/>
  <link rel="modulepreload" href="${base}/assets/${routesJs}"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
</head>
<body>
  <div id="root"></div>
  <script>
    (self.$R = self.$R || {})["tsr"] = [];
    self.$_TSR = {
      hydrated: false,
      streamEnded: false,
      initialized: false,
      buffer: [],
      h() { this.hydrated = true; this.c(); },
      e() { this.streamEnded = true; this.c(); },
      c() { if (this.hydrated && this.streamEnded) { delete self.$_TSR; delete self.$R.tsr; } },
      p(fn) { this.initialized ? fn() : this.buffer.push(fn); }
    };
    $_TSR.router = (function ($R) {
      $R[0] = {
        manifest: ($R[1] = {
          routes: ($R[2] = {
            __root__: ($R[3] = {
              preloads: ($R[4] = ["${base}/assets/${indexJs}"]),
              scripts: ($R[5] = [$R[6] = { attrs: ($R[7] = { type: "module", async: true, src: "${base}/assets/${indexJs}" }) }])
            }),
            "/": ($R[8] = { preloads: ($R[9] = ["${base}/assets/${routesJs}"]) })
          })
        }),
        matches: ($R[10] = [
          ($R[11] = { i: "__root__", u: Date.now(), s: "success", ssr: true }),
          ($R[12] = { i: "", u: Date.now(), s: "success", ssr: true })
        ])
      };
      return $R[0];
    })($R["tsr"]);
    $_TSR.e();
  </script>
  <script type="module" async src="${base}/assets/${indexJs}"></script>
</body>
</html>
`;

writeFileSync(join(dest, "index.html"), html);
writeFileSync(join(dest, "404.html"), html);
writeFileSync(join(dest, ".nojekyll"), "");
console.log("Wrote GitHub Pages shell", { css, indexJs, routesJs });
