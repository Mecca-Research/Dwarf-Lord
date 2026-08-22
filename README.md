# Dwarf Lord

You bought a hole in a mountain.

A 3D isometric colony-management game: ruined dwarf pit, exhausted workforce, and Borrin Stoneledger — the last competent middle manager the mountain has left.

**[Play in the browser](https://mecca-research.github.io/Dwarf-Lord/)**

That URL is the GitHub Pages build. Every push to `main` deploys a new copy.

If it 404s on first visit, GitHub still needs Pages switched on for this repo (one time):

1. Open **[Pages settings](https://github.com/Mecca-Research/Dwarf-Lord/settings/pages)**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Re-run **[Deploy game](https://github.com/Mecca-Research/Dwarf-Lord/actions/workflows/deploy-pages.yml)** (Run workflow)

After that the play link stays live.

## Play

- **Walk the road** into the camp. You do not start with a clean company UI — you learn what you own by walking it.
- **WASD** or click-to-move. **E** talks / inspects. **Q / R** rotate. Scroll zooms. On a phone: stick + Interact.
- Find **Borrin** in the chair. He opens the pit board.
- You have **82 capability** and jobs that need **126**. You cannot do everything.
- Send the first haul. Wages, food, tools, the dorm, and the cart eat revenue first.

## World stages

Town stays a short walk with larger dwarves. The mine is sectioned and long, with characters shrunk into the sprawl.

| Stage | What you see |
| --- | --- |
| Ruins *(playable)* | Collapsed dorm, cold forge, tents, crates, flooded shaft |
| Camp *(playable)* | Patched roof, kitchen fire, counted stores |
| Work settlement → Town | Shifts, tavern, independent shops |
| Industrial town → Capital | Foundries, rail, academy, mint |

## Run locally

```bash
npm install
npm run dev
```

Static GitHub Pages build:

```bash
npm run build:pages
```

## Stack

- Engine: React 19, TanStack Start, Three.js / React Three Fiber
- State: Zustand + local save
- Deploy: GitHub Pages via [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)

Licensed under [Apache-2.0](LICENSE).
