# Dwarf Lord

You bought a hole in a mountain.

A 3D isometric colony-management game: ruined dwarf pit, exhausted workforce, and Borrin Stoneledger — the last competent middle manager the mountain has left.

**[Play in the browser](https://mecca-research.github.io/Dwarf-Lord/)**

That URL is live. The game is a static build hosted on GitHub Pages.

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
- Deploy: GitHub Pages at [mecca-research.github.io/Dwarf-Lord](https://mecca-research.github.io/Dwarf-Lord/)

Licensed under [Apache-2.0](LICENSE).
