# Opening-world review

Captured from `npm run build:pages`, served locally by the playtest scripts. World source and shipped art hashes are bound in `results.json`; native motion art and dependency changes are recorded separately in `runtime-revalidation.json`.

- `results.json`: four actual game navigation routes, six days / 22 work variants, 14 persistent stations, desktop and mobile diagnostics.
- `stride-results.json`: the existing lateral material-contact checker replayed against the new world, with three complete strides in each previously reviewed Blacksmith view.
- `route-tests.txt`: mining routes, forestry crossing, boundaries, foundations and assignment checks.
- `screenshots.json`: capture dimensions, original PNG hashes and encoded review-image hashes. WebP images preserve the original framing.

The software renderer and intercepted external font CSS make this functional/visual QA, rather than a hardware performance measurement. The prior native motion review scopes, dates, authored pixels and approval flags are retained.

Run `node scripts/base-camp-playtest.mjs` and `node scripts/base-camp-stride-playtest.mjs` after the static build. An optional `WORLD_CHROMIUM` selects the browser executable. After copying reports into this folder, `node scripts/revalidate-world-dependencies.mjs` verifies the evidence and rebuilds only the affected environment dependency bindings from the PR #9 baseline.
