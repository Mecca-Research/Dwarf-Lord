# Dwarf Lord Development Roadmap

**Revision:** 1.1 · **Date:** 9 September 2026  
**Scope:** Complete development path from the current playable art prototype to a persistent, non-combat mining civilization simulation.  
**Implementation baseline:** `ba36e50`, branch `codex/dwarf-art-detail-pass`; [PR #3](https://github.com/Mecca-Research/Dwarf-Lord/pull/3) is open, not merged. This document does not merge it or change gameplay.

## 1. How to use this roadmap

This roadmap consolidates the entire supplied **Dwarf Lord.txt** development brief: world structure, worker capability, economy, procedural mountain, character development, inventory and market systems. The source contains 4,888 lines and 99,367 bytes; SHA-256: `7a0fadaa7e4781ffa2043f824459056374e1970fb778313653de97df03e78a0b`.

**Source intent** means a recurring requirement in those notes. **Proposed default** means a gap resolution or implementation recommendation added here. Numerical examples in the source are illustrative, not approved balance constants. The user’s subsequent universal copper/silver/gold/platinum monetary specification supersedes the source’s earlier currency proposal; Section 4A records that requirement. Instructions embedded in the source are treated as design material, not instructions to execute unrelated work.

Work through the numbered phases in order. A phase is complete only when its acceptance gate passes; a model, image, menu or catalog entry alone is not a working gameplay feature. Within an unlocked phase, independent art and engineering tasks can proceed together. No calendar estimates are imposed: measure actual throughput after the first two milestones before estimating the full project.

Use the task IDs below in issues, commits and future work sessions. At each checkpoint record the branch, commit, completed IDs, remaining work, screenshots, checks and next unblocked task. Preserve working files in the WSL filesystem; copy review deliverables to the user-facing outputs directory.

### Asset-first development policy

Build **world structure, reusable assets and visual continuity early**, as requested. Establish their scale, connection points, collision rules and animation interfaces before mass production. Produce early-game art to final quality first; build representative mid/late-game modules and district blockouts early, then finish their variants alongside their mechanics.

Do not create every capital building and every animation frame before testing movement, construction footprints, machine connections or sprite lighting. That would multiply expensive rework. One end-to-end asset proof is an early foundation task; the full animation system comes after the world kits.

## 2. Non-negotiable game identity

1. **The mountain is the dungeon; the settlement is the progression system.** Explore → survey → extract → return → process → sell or retain → invest → improve → descend.
2. **No combat and no player XP/stat tree.** Lord Dwarf is a competent owner-manager. Player knowledge and organizational capability provide progression. Resource descriptions mentioning weapons do not introduce combat requirements.
3. **A finite surface estate and an expanding mountain interior.** Lord Dwarf remains inside the estate/mine. The road carries visitors, trade, news and dispatched workers; it is not an explorable overworld.
4. **People are persistent individuals.** Capability, learned skills, current needs, relationships, responsibility and experience matter. Appearance and sex do not dictate occupational aptitude.
5. **Three connected economies:** company finances, worker households, and independent town businesses. Personal possessions cannot be silently consumed as company materials.
6. **Knowledge lives in people and institutions.** Apprenticeships, practical work, books and research replace abstract technology purchases.
7. **Engineering releases labor and unlocks access.** It changes hauling, safety and production constraints rather than merely adding percentage bonuses.
8. **Scarcity persists as scale grows.** Maintenance, increasing expectations, expansion, cash flow and technical dependencies counter increasing productivity.
9. **Visible history persists.** The ruined barracks, Borrin's original seat and Pit Yard remain recognizable as the estate becomes a capital.
10. **Uncertainty is meaningful but fair.** Geological estimates and market reports have sources and confidence; hidden information is not revealed by decorative UI or omniscient automation.

## 3. What exists now—and what does not

This is a code inspection baseline, not a claim that all current systems are production-ready.

| Area | Existing implementation | Required development |
| --- | --- | --- |
| Rendering | React/Three.js scene, isometric camera, terrain, lighting, buildings and props | Consistent reference-quality world; budgets, occlusion, streaming and scalable presentation |
| Dwarves | Twelve detailed NPC designs across seventeen named starting residents; elder and two female designs; player direction/gait frames | Cohesive directional NPC animation, matching portraits, equipment attachments, life/role variants; twelve designs do not imply twelve residents |
| Camp assets | Timber hall, ridge tents, plank walks, crates, stave barrels, fire and terrain dressing | Detailed remaining buildings, stronger terrain composition, interiors, construction/damage states and progression kits |
| Exploration | Walkable zone regions, interaction prompts, dialogue and discovery flags | Persistent multi-level geology, surveys, physical excavation, transit networks and environmental hazards |
| Workers | One capability value; five broad skills; energy, motivation, condition, discipline and initiative | Six core capabilities, hierarchical skills, experience histories, availability, training, crews and delegation |
| Jobs | Daily assignment and resolution prototype | Work hours, prerequisites, material reservations, equipment allocation, hauling and interruptions |
| Expedition | Planned crew and precomputed result, returned through a wall-clock timeout | Simulation-time journey, supplies, availability locks, deposits, storage and exactly-once settlement |
| Economy | Flat counters, treasury, wages and haul valuation | Physical inventories, transaction ledger, actual sales, accounts payable, households, firms, markets and contracts |
| Progression | Eight stage definitions; only ruins and camp marked playable | Observable, sustained conditions and functioning systems for all eight stages |
| Persistence | Version-1 localStorage snapshot and previous-copy write | Validated migrations, recovery UI, export/import, mine chunks, pending tasks and scale-appropriate storage |
| Verification | General project tests plus sprite and browser checks | Domain invariants, seeded simulation tests, long-run economics, generation validation, performance and save migrations |

Important prototype corrections belong in Phase 07: `resolveJobs` computes useful work without using it to drive its output calculation; `collectHaul` adds recovered goods and net sale-like cash together; expedition return uses `setTimeout`; recurring and expedition costs need one accounting source. The save reader accepts mismatched versions without migration. These are roadmap tasks, not changes made by this document.

## 4. Resolve design gaps before production multiplies them

The defaults below make the plan executable without pretending the source has already settled every detail. Record any changed choice in a short decision log, with its effect on assets, saves, UI and balancing.

| ID | Gap or conflict | Proposed default | Resolve by |
| --- | --- | --- | --- |
| D01 | Twelve founders, twelve plus elder, sixteen workers and current seventeen residents appear in different places | Retain current **16 workers + Borrin** as the baseline; treat twelve as the art-design count. Do not delete named residents to fit sprite count. A smaller founder scenario can be separate later. | Phase 00 |
| D02 | Six picks in dialogue, seven in item list, four good + two cracked in code | Canonical new-game manifest: **7 picks: 4 serviceable, 3 poor**. Crew size does not guarantee safe equipment; six-person first expedition is optional. Update dialogue and UI from that manifest. | Phase 00 |
| D03 | Starting cash 73.60 versus current 180; several incompatible haul examples | Retire the old currency naming. Use **73 silver + 60 copper bits (7,360 bits)** only as a proposed opening test fixture, not an approved balance value or immediate code change. Validate at least several viable opening strategies before adopting it. Preserve existing saves through explicit migration. | Phases 00, 07 |
| D04 | “Capability points” mix staffing potential and daily production | Derive task-specific baseline capability from six attributes. Actual productive hours and modifiers determine work; nominal capability is a planning estimate, not spendable currency. | Phase 01 |
| D05 | Mixed 0–1, 1–10 and 0–100 stat scales | Store normalized bounded values where practical; display consistent 0–100 proficiency and human-readable bands. Document units for every formula. | Phase 01 |
| D06 | Currency, tonnes, loads, units and food budgets intermingle | Use the user-defined universal standard: **100 copper bits = 1 silver; 100 silver = 1 gold; 100 gold = 1 platinum**. No crowns or silver marks. Store exact integer bit values plus denomination holdings where physically relevant. Store physical quantities in declared units; display tonnes, litres or item counts. A “load” is container capacity, not a universal mass. | Phase 01 |
| D07 | Haul value is treated as immediate revenue | Extraction increases inventory, not cash. Export settlement returns actual coins; certified minting also creates spendable coins by consuming refined metal. Record these as different events. Wages, food and repair costs are posted once; internal transfers create no external revenue. | Phase 07 |
| D08 | Geological realism versus convenient depth tiers | Depth ranges are broad design bands, not guaranteed ore unlocks. Geological setting and seed determine deposits; critical starting necessities have reachable trade/substitute routes. | Phase 05 |
| D09 | Single-pose sprites versus working, seated, carrying and walking NPCs | Keep current art as identity references. Require consistent directional pose sets; never slide a seated pose through a work route in the finished game. | Phases 02, 06 |
| D10 | Camera can rotate but painted sprite lighting/direction is fixed | Retain existing rotation only if an eight-direction prototype stays coherent. Prefer neutral character lighting plus ground contact shading; lock supported camera range before bulk asset generation. | Phase 02 |
| D11 | Real time, day-end resolution and decades of history | One authoritative simulation clock, pause and selectable speeds. Proposed 12-minute normal-speed day for initial testing; shifts/calendar/aging are separately configurable. No offline advancement initially. | Phases 01, 07 |
| D12 | Injury, death, aging, succession and loss not fully specified | Injury/absence and evacuation first; no unavoidable death in the tutorial. Add configurable fatal accidents and long-life aging only after fairness and succession systems. Borrin's historical role remains recorded. | Phases 00, 10, 12 |
| D13 | Bankruptcy and recovery absent | Warnings → spending restrictions/arrears → recovery options → explicit insolvency outcome. Emergency contracts or sale of company assets offer costly recovery, not infinite free funds. | Phase 08 |
| D14 | Infinite branches versus finite browser resources | Deterministic bounded chunks, persistent modifications, off-screen aggregate simulation and a configurable active region. “30+ levels” is a scale test, not a promise of infinite memory. | Phases 01, 09, 15 |
| D15 | Literacy, research unlocks, information and UI access | Discovery unlocks explainable reports; expertise unlocks actions. Reports retain observer, date and confidence. Missing information must never obscure basic controls or recovery options. | Phases 07, 09, 12 |
| D16 | Employment and family life are mentioned without a population model | Recruitment/immigration and household formation first. Add aging, retirement, inheritance and births with explicit timing later; exclude child labor from the labor scheduler. | Phase 13 |
| D17 | Fantasy tech risks removing every constraint | Each material gets scarcity, knowledge, processing, energy/maintenance, failure and substitution rules. No universal magical solution to logistics. | Phase 16 |
| D18 | Bronze/brass and iron processing shown as simple sequential chains | Model bronze as copper + tin, brass as copper + zinc; model alternative ferrous routes rather than requiring wrought iron between all pig iron and steel production. Treat industrial recipes as game abstractions. | Phases 01, 11 |
| D19 | Release size and hardware support unspecified | Single-player desktop browser first, retaining current Pages target. Choose named minimum/reference devices before freezing budgets; mobile, multiplayer and cloud saves are separate scope decisions. | Phase 00 |
| D20 | Ending not specified | Capital milestone with a civilization report and optional continued play. Support trade-, industry-, education- and welfare-led success, without demanding every rare mineral. | Phases 00, 17 |
| D21 | Player exposure to hazards and direct labor unspecified | Lord Dwarf inspects, leads and orders rather than supplying unlimited free production. Proposed initial hazard response: warn, block unsafe entry or require retreat; define player rescue/failure behavior without adding an RPG combat health/XP system. | Phases 00, 10 |
| D22 | Calendar, weather and renewability lack rules | Use deterministic daily consumption and scheduled trade first. Define tree regrowth, water replenishment, crop cycles and finite ore explicitly; seasonal weather is a later extension unless required by a chosen food chain. | Phases 01, 08, 13 |

## 4A. Core monetary design — universal coin exchange and the road economy

**User-confirmed requirement:** Copper bits, silver coins, gold coins and later platinum coins form the universal monetary system. Crowns are not a currency in the final design. Useful goods leave the estate by road; sale proceeds return as silver or gold. Discovering and processing monetary metals eventually allows the company to mint its own currency. Commodity speculation and changing outside prices/expenses are central gameplay, not an optional endgame feature.

### 4A.1 Fixed denominations

| Coin | Conversion | Value in copper bits | Intended use |
| --- | --- | ---: | --- |
| Copper bit | Base unit | 1 | Change, small purchases, precise accounting |
| Silver coin | 100 copper bits | 100 | Early wages, supplies, ordinary trade receipts |
| Gold coin | 100 silver coins = 10,000 copper bits | 10,000 | Larger shipments, equipment and capital spending |
| Platinum coin | 100 gold coins = 10,000 silver coins | 1,000,000 | Later high-value treasury holdings and major projects |

These ratios never vary with market speculation. What changes is how much ore, food, timber, labor or machinery the coins buy. A price can be displayed as `2 gold, 37 silver, 45 copper` or `237.45 silver`; these both mean exactly 23,745 bits. Converting 100 gold into one platinum changes denomination, not wealth.

**Proposed implementation:** use integer copper-bit ledger values and explicit denomination counts for physical coin lots. Use a documented safe-integer bound, or serialized big-integer arithmetic if campaign limits require it; never use floating-point coin balances. Do not silently round fractional bits into or out of existence. Display bulk commodity prices per declared mass/unit and round the final transaction once by a consistent rule. Household payments may use aggregated coin holdings rather than individually simulated coins.

### 4A.2 Opening trade: goods out, coins back

1. The player inspects company stock and selects useful goods/resources for export. This includes stone, timber, ore, scrap, spare tools, repaired equipment and manufactured goods—not only precious materials. Useful damaged items receive salvage-based offers; unsurveyed ore can receive a conservative bulk appraisal without revealing hidden composition.
2. The road exchange shows an offer or estimate in silver/gold, including quantity, quality, fees/haul cost, departure, likely return and the distinction between a guaranteed quote and an uncertain sale-on-arrival price.
3. The player reserves the shipment and dispatches it. Haulers/carriers remove the goods from available stock; the cargo is now outbound company property. It cannot also be built with, consumed, or sold twice.
4. The outside exchange sells the cargo. A settled transaction converts it into a recorded amount of coins; rejected/unsold goods remain tracked and return rather than disappearing.
5. A returning carrier delivers silver and/or gold coins, with copper change where needed. Delivered proceeds enter the company treasury once. Money in transit is visible but cannot pay today's local wages until available.
6. The ledger reconciles dispatched stock, gross proceeds, costs, delivered net coins and elapsed time. The player then chooses wages, imports, repairs, investment or retaining cash.

**Proposed opening default:** an established road carrier/exchange provides the basic service from the first trade tutorial. The player does not need to build a market, own a mint, or discover silver before selling limestone. A baseline offer is available for every useful eligible good; quantity may require multiple trips and large sales may receive worse prices. Advanced buyers/contracts improve terms and quantities later. A tutorial shipment uses a locked quote so the first lesson is understandable; later shipments can use explicit market-at-arrival terms.

This is sale for universal money, not a forced barter system. Imported food/tools use the same coins and road delivery model. Business and household purchases inside the estate also use the same denominations.

### 4A.3 Prices, expenses and speculation

- Quote commodity prices in silver per defined unit, optionally showing gold equivalents for large lots. The same cost expressed in another denomination must always convert exactly.
- Give the ledger price history, trends, volumes, outside news, current offers and transport costs. Borrin initially provides rough local knowledge; repeat trade produces a better record. Known quotes and estimates must look different.
- Make export receipts and import costs respond to supply, demand, events, grade, delivery conditions and the player's sale volume. Wages, food, fuel, spare parts and construction inputs can become more expensive even while nominal treasury grows.
- Preserve the central choice: sell now to fund payroll, retain material for internal use, process it for added value, or warehouse it hoping for a better price. Display storage/handling costs and cash runway beside potential profit.
- No exact future-price forecasts and no fluctuating silver-to-gold exchange rate. Gold's commodity uses can have their own opportunity cost, but gold **coins** remain fixed-value universal tender.

### 4A.4 Domestic coin production

The player first earns existing coins from the outside economy. Later the player can create new spendable coins from locally mined monetary metals:

**Silver/gold-bearing rock → sorted/concentrated feed → refined metal → assayed coin-grade bullion → weighed blanks → minting → certified silver/gold coins → secure treasury.**

The mint is a production building with trained staff, refining/assay access, dies and striking equipment, power/fuel as appropriate, maintenance and secure handling. Ore is never directly counted as coin. Unminted bullion can instead be exported, stored or used for goods. Minted coins can pay wages, fund purchases and return through the road like externally received coins.

**Proposed progression:** silver/gold refining and minting become functional in Phase 11; copper coin handling is universal from the beginning and optional local copper minting can reuse the same standard if added. Platinum refining/minting arrives in Phase 15 when large gold holdings and advanced metallurgy justify it. Platinum must be minted from platinum-grade material; converting existing gold coins to platinum coins through an exchange is a separate denomination-exchange transaction, not transformation of gold metal into platinum metal.

Define the fictional universal weight/purity standard for each coin before setting recipe quantities. The 100:1 denomination ladder does **not** imply equal coin masses or that 100 units of one ore become one unit of another. Valid company-minted coins are universally accepted at face value; no extra kingdom-permission system is required by this design. Off-standard/rejected pieces are recoverable metal, not full-value tender. Fantasy prestige metals do not add new universal denominations.

### 4A.5 Prevent duplication and unlimited conversion profits

Minting is allowed to be profitable—that is part of the reward for discovering silver/gold. Its profit comes from extraction, refining skill, throughput and resource access, not an accounting loophole.

- A mint job reserves and consumes a specific refined-metal lot. Its coin output is bounded by available fine-metal mass, the defined standard and actual process yield. Rejects/scrap retain only their residual metal.
- Record coin creation separately from export revenue. Increasing coin inventory and increasing its treasury-value display are the same event; never book both as separate gains.
- Universal face values constrain outside bullion offers. Set buy/sell spreads, assay costs, mint capacity and metal prices so an instant `buy metal → mint → buy more metal` loop cannot generate unlimited profit. If a temporary mint margin exists, finite supply, labor, time and price impact bound it.
- Remelting removes the coins from spendable holdings before returning recoverable metal. `mint → melt → mint` cannot increase coin count or fine-metal mass.
- Coin exchange at the universal ratios creates no face-value profit. Any delivery/exchange service cost is shown separately. Avoid making routine change shortages a constant early-game chore: the road exchange provides change, while very large denomination exchanges can take a shipment cycle.
- Reserve coins committed to wages/orders; track household, company, business and in-transit ownership. Theft/security, if implemented later, uses explicit loss events rather than unexplained balance disappearance.

### 4A.6 Required monetary scenarios

- A useful non-monetary haul leaves by road; the return delivers the correct silver/gold total once, including after save/reload in transit.
- A shipment priced at 12 silver + 40 copper pays exactly 1,240 bits; `1 gold` pays exactly `100 silver`, and `1 platinum` exactly `100 gold`.
- Mining produces ore, refining produces metal, and minting produces coins; no intermediate stage credits spendable cash.
- Partial mint completion, cancellation and breakdown preserve consumed feed, outstanding reservations, finished coins and scrap without duplication.
- Rising food/tool costs can reduce purchasing power even while the number of gold coins rises; the ledger explains this.
- A household paid in silver can purchase goods; denomination conversion neither changes wealth nor transfers company ownership incorrectly.
- Buying/refining/minting/remelting/trading across repeated cycles cannot create metal, duplicate money or bypass finite market/machine throughput.
- Platinum consolidation remains exact at large values, including save serialization, wages, contracts and mixed-denomination change.

## 5. Ordered milestones and dependency map

| Phase | Milestone | Depends on | Reviewable result |
| --- | --- | --- | --- |
| 00 | Canonical brief and scope | Source review | Decisions, opening manifest and release tiers |
| 01 | Shared data and world contracts | 00 | Stable IDs, units, schemas, asset rules and simulation boundaries |
| 02 | Visual and animation proof | 01 | One coherent reference-quality scene and directional character proof |
| 03 | Surface estate and ruined camp | 02 | Finished walkable opening world |
| 04 | Surface progression asset library | 03 | Modular camp-to-capital architecture and district blockouts |
| 05 | Mountain and industrial asset library | 02–04 | Mine kits, geological layers and machinery modules |
| 06 | Character, animation and sound production | 02, 03, 05 | Usable founding cast and core work animations |
| 07 | Complete first playable loop | 01, 03, 05, 06 | Arrival → cleanup → first haul → sale → repair → next shift |
| 08 | Inventory, construction and local economy | 07 | Physical goods, building sites, storage and sustainable cash flow |
| 09 | Procedural geology and excavation | 05, 08 | Persistent, surveyable, expandable mine levels |
| 10 | Logistics, safety and engineering | 09 | Hauling networks, supports, pumps, ventilation and rescue |
| 11 | Processing and industrial production | 08–10 | Material-conserving production chains and machines |
| 12 | Workforce learning and delegation | 07, 10, 11 | Apprentices, crews, foremen and knowledge institutions |
| 13 | Households and independent town economy | 08, 11, 12 | Businesses, personal property, services and rising expectations |
| 14 | External trade and missions | 08, 12, 13 | Contracts, news, variable markets and external assignments |
| 15 | Deep mine and mountain city | 09–14 | Scalable multi-level industrial society |
| 16 | Fantasy discovery and strategic industry | 11, 12, 15 | Research-led anomalies with meaningful constraints |
| 17 | Capital, balancing and release | All prior gates | Complete progression, recovery, accessibility and release validation |

**Delivery tiers:** Visual foundation = 00–06; first playable release candidate = 07–08; systems alpha = 09–12; living-town beta = 13–14; full campaign/content complete = 15–16; release = 17. These are development boundaries, not replacements for the eight in-world settlement stages.

## 6. Detailed development phases

### Phase 00 — Freeze the brief and production scope

- [ ] **00.1** Create a decision register for D01–D22. Separate required source features, accepted proposals, unresolved choices and optional extensions.
- [ ] **00.2** Create one canonical starting manifest for residents, relationships, jobs, treasury, arrears, supplies, ruined structures and discoverable salvage. Give every entry a stable ID.
- [ ] **00.3** Establish the playable opening sequence and landmarks: road arrival, confusing yard, owner dialogue, Borrin, ledgers, cleanup, equipment shortage, first expedition and investment decision.
- [ ] **00.4** Restore road arrival for the final onboarding scenario; retain the current camp spawn as a developer review preset.
- [ ] **00.5** Define supported devices, controls, target viewport range, normal game speed, session length and intended single-player save policy.
- [ ] **00.6** Define release scope and success criteria. Keep no-combat, estate boundary, no player XP and persistent founders explicit in future feature reviews.

**Gate:** One internally consistent opening manifest and no contradictory prices/counts across dialogue, UI, inventory and tests. Every undecided issue has an owner and deadline phase.

### Phase 01 — Establish foundations that prevent art rework

- [ ] **01.1** Define registries for material, item, building/module, machine, recipe, job, skill, dwarf, household, business, crew, institution, deposit and report IDs. Separate definitions from saved instances.
- [ ] **01.2** Define authoritative units and item ownership/location/reservation semantics, including Section 4A’s exact coin conversions, coin stacks, bullion and currency-creation events. Avoid separate ad-hoc counters for “ironRock”, “hematite” and “iron ore” without a documented conversion.
- [ ] **01.3** Define simulation commands/events and one clock. Rendering observes state; camera visibility and animation frames never determine production.
- [ ] **01.4** Define world coordinates, elevation/floor IDs, grid/module dimensions, walkable clearance, footprints, entrances, machine ports, roof cutaways and ground contact points.
- [ ] **01.5** Define versioned save schemas, content-version handling and seeded generation. Plan migrations for current snapshots before replacing inventories or worker fields. Legacy currency values need an explicitly versioned conversion to copper bits; never reinterpret old numeric balances silently as gold or silver.
- [ ] **01.6** Create an asset manifest and inspector/gallery: dimensions, alpha, pivot, orientation, material slots, collision, sockets, states, LOD, source/provenance and consuming entity IDs.
- [ ] **01.7** Establish budgets on named hardware. Proposed starting targets: 60 fps on reference desktop, 30 fps on minimum hardware, UI feedback within 100 ms, bounded scene loading and no progressive memory growth during a 30-minute repeat route. Measure texture residency and simulation cost separately.
- [ ] **01.8** Add validation for duplicate/missing IDs, invalid units, broken references, unsupported asset states and inaccessible module entrances. Set practical download and decoded-memory budgets after measuring the current PNG roster.

**Gate:** One building, one dwarf, one tool, one deposit and one inventory stack can be loaded, placed, inspected and saved using shared contracts. Asset changes do not alter simulation definitions accidentally.

### Phase 02 — Prove the visual direction and asset pipeline

- [ ] **02.1** Write the art bible from the supplied reference: robust dwarf silhouettes, weathered individual boards, pale stone scatter, worn canvas, restrained moss, readable earth, warm localized fire and cool mountain depth.
- [ ] **02.2** Establish scale ratios among dwarf, door, crate, tent, cart, stair, rail gauge and tunnel. Lock camera framing and perspective before bulk production.
- [ ] **02.3** Produce one finished composition containing hall, campfire, elder, both female designs, worker, tent, props, footpath and cliff/background. Match composition and readability, not merely color grading.
- [ ] **02.4** Prove one directional dwarf with idle, walk, sit-to-stand, tool work and carrying. Test the actual camera rotations and attachment positions. Document frame/direction requirements and naming.
- [ ] **02.5** Decide where sprites, 3D geometry and material layers belong. Proposed: 3D buildings/terrain/machines with depth-aware dwarf sprites; no prepainted terrain objects that duplicate physical props.
- [ ] **02.6** Validate transparency, edge fringes, uniform figure occupancy, daylight/fire readability, contact shadows, occlusion and selection outlines. Current sprites are identity art, not finished multi-pose animation sets.
- [ ] **02.7** Preserve masters; derive optimized runtime assets through a reproducible build process. Verify appearance after atlas packing/compression, not only before it.

**Gate:** Approved reference comparison and a successful movement/work test using the same production asset pipeline intended for the rest of the game.

### Phase 03 — Finish the surface estate and ruined camp

- [ ] **03.1** Build the finite estate plan: road gate, forest fringe, Pit Yard, camp, industrial periphery, mountain entrance, water source, drainage and future expansion land.
- [ ] **03.2** Give terrain gameplay tags: flat earth, packed gravel, bedrock, forest, slope, steep rock, wet ground, rubble, cliff and mountain wall. Visual boundaries must agree with buildability and navigation.
- [ ] **03.3** Replace broad uniform ground scatter with authored/seeded clusters: worn travel lanes, rubble near damage, stones at cliffs, compacted work areas, drainage channels and sparse vegetation where walked.
- [ ] **03.4** Complete ruined dormitory, cold forge, abandoned storage, office/residence, tents, cookfire, flooded entrance and damaged carts. Add believable foundations, interiors or inspectable cutaways where useful.
- [ ] **03.5** Produce all opening props from the canonical manifest: tools, rope, lanterns, support timber, bowls, bedding, water barrels, salvage and old machinery. Mark decorative versus inventory-bearing props.
- [ ] **03.6** Finish background mountains, sky/fog separation and cliff silhouettes. Preserve depth without hiding interactable objects in darkness.
- [ ] **03.7** Add interaction/collision volumes, NPC standing/seating markers and clean approach routes. Reserve Borrin's seat and the original barracks as historical landmarks.
- [ ] **03.8** Create fixed screenshot routes and near/far camera comparisons at supported resolutions.

**Gate:** A player can walk from road to Borrin, each building and the mine entrance without obstruction or ambiguous interactions. The opening scene shows a significant structural/detail improvement over the original DL screenshot.

### Phase 04 — Build the modular surface progression library

- [ ] **04.1** Produce reusable wall, roof, floor, foundation, beam, door, window, stair, balcony, chimney and attachment modules. Include corners, junctions and slope transitions.
- [ ] **04.2** Create material families: rough timber/stone → cut limestone/brick/slate → granite/steel/glass/brass → polished stone/hardwood → gem/fantasy accents.
- [ ] **04.3** Author ruined, scaffolded, repaired, operational, upgraded and damaged states. Material replacement must preserve building identity and footprint or declare expansion requirements.
- [ ] **04.4** Complete early functional buildings first: dorm, kitchen, store, carpenter, smithy, stone yard, sawmill, warehouse and basic homes.
- [ ] **04.5** Build representative village/town kits: cottages, apartments, bakery, brewery/tavern, tailor, shops, clinic, bathhouse, market, guild hall, school/training hall and administration.
- [ ] **04.6** Block out industrial/capital districts: foundries, processing halls, rail terminal, college/academy, laboratories, civic halls, parks, monumental architecture and the required silver/gold mint with later platinum capability. Finish full variants in the consuming phase.
- [ ] **04.7** Build public-space kits: roads/paving, lamps, signs, fences, benches, water supply, drains, loading areas, cranes and landscaped space.
- [ ] **04.8** Assemble eight stage review scenes around the same landmarks. Show additions and reuse rather than swapping the entire town model.

**Gate:** Modules connect correctly and expose entrances/footprints. Eight stage blockouts communicate social and industrial change; early-game assets are production-ready, later detail work has explicit consuming phases.

### Phase 05 — Build mountain, geology and industrial asset kits

- [ ] **05.1** Create mine floor/wall/ceiling, corners, portals, shafts, ramps, stairs, caverns, collapsed faces and excavation transitions. Include depth cutaways and visibility rules.
- [ ] **05.2** Build base geological materials and overlays from Appendix A. Rock hardness, ore appearance and surveyed state are separate layers.
- [ ] **05.3** Create abandoned infrastructure: dead rails, broken carts/lifts, old stores/workshops, markings, sealed rooms, timbering and salvage pockets.
- [ ] **05.4** Author all nine macro archetype kits: chamber network, fractured tunnels, central cavern, flooded level, fault line, vertical shafts, massive ore body, ancient worked mine and crushed unstable zone.
- [ ] **05.5** Create support kits, pipes, ducts, drains, rails, cables, platforms and worker access spaces with compatible ports and clearance.
- [ ] **05.6** Produce representative sorting table, crusher, mill, furnace, pump, fan, winch/hoist, waterwheel, cart, conveyor and machine-tool assets. Separate stationary frames from moving parts.
- [ ] **05.7** Define machine states: unbuilt, idle, working, starved, blocked, unpowered, worn, broken and under repair. Include visible material in/out and maintenance access.
- [ ] **05.8** Produce environmental effects: water levels, leaks, dust, sparks, steam, smoke, heat and instability indicators. Dangerous air must also have instrument/audio/text indicators.

**Gate:** A hand-authored test level connects all module types and demonstrates mining-face change, machine ports, rail/path clearance, visibility and hazard readability. Generation is not considered implemented by this asset milestone.

### Phase 06 — Complete characters, animation and sound

- [ ] **06.1** Create a character sheet for each named founder: visual identity, age band, voice/tone, role, background, existing relationships and potential growth. Keep their careers open.
- [ ] **06.2** Maintain the twelve-design library, including Borrin and the two requested female designs. Add identity variation for shared residents through controlled hair/clothes/face variants, not random changes on movement.
- [ ] **06.3** Create matching portraits and eight-direction idle/walk sets; prioritize founders visible in the first loop. Avoid generic male fallbacks for female NPCs.
- [ ] **06.4** Build required actions: sit/stand, talk, eat, sleep, pick, chop, shovel, hammer/repair, survey, carry light/heavy loads, push cart, climb, operate equipment and assist an injured worker.
- [ ] **06.5** Add state transitions, interruption recovery, tool sockets, carried goods, synchronized foot contact and work-event markers. Later add teach, study, trade and specialist machine actions when their systems arrive.
- [ ] **06.6** Separate occupational clothing from personal identity; provide safe helmet/tool combinations, injury states and later prosperity/age variants without recreating every combination as a unique sheet.
- [ ] **06.7** Build sound families for footsteps by surface, tools/material strikes, carts, machines, fire, water, caves, settlement life and interface feedback. Add distance/occlusion, volume controls and reduced repetition.
- [ ] **06.8** Record source/license/provenance and exact generation/export recipes. Check motion at game scale, not only enlarged contact sheets.

**Gate:** The founding cast can complete the first-loop activities without sliding seated poses, changing identity, missing tools or broken transitions. Critical sounds have visual equivalents.

### Phase 07 — Deliver the complete opening gameplay loop

- [ ] **07.1** Implement arrival and discovery-led onboarding, including Borrin's uncertain inventory, ownership confusion, ledger access and a skip/revisit option.
- [ ] **07.2** Replace prototype output shortcuts with work accumulated from productive simulation hours, relevant skill, energy, motivation, condition and equipment/workplace quality. Make travel, meals and rest consume time rather than silently counting as production.
- [ ] **07.3** Implement task states: planned → reserved → travel → work → interrupted/completed/cancelled. Reserve workers, tools and materials once; release reservations on cancellation/failure.
- [ ] **07.4** Make cleanup produce identifiable salvage; repair consumes actual components and labor. Show before/after world states.
- [ ] **07.5** Implement the first mine run as a real job/crew journey. Validate access, supply, equipment, availability and safe crew composition; allow watching or managing elsewhere.
- [ ] **07.6** Return goods to actual storage; show gross estimated value separately from cash. Let the player retain repair materials and send any useful selected surplus out through the road exchange; returning carriers deliver silver/gold with copper change as needed. This basic universal outlet exists from the opening, before the advanced market system.
- [ ] **07.7** Post wages, food and repairs through one ledger. Prevent duplicate collect actions, duplicate daily charges and post-load repeat rewards.
- [ ] **07.8** Implement pause/speed, shift completion and deterministic task resumption across save/load. Remove wall-clock expedition callbacks as game-state authority.
- [ ] **07.9** Make housing, meals, safety and pay affect the next shift. Show why tomorrow's capacity changed.

**Gate:** Complete arrival → cleanup → provisioning → extraction → hauling → sale → payroll → dorm/cart repair → recovery → second shift. Save/reload at each stage produces neither missing goods nor duplicated cash. At least three reasonable opening allocations remain viable; neglect has understandable consequences.

### Phase 08 — Inventory, construction and the company economy

- [ ] **08.1** Replace flat inventory counters with stacks/lots and unique equipment where needed. Implement mass, volume, ownership, location, quality, condition, grade/composition, freshness, durability, prestige and reservations.
- [ ] **08.2** Implement split/merge rules and material accounting. Ore assays and ownership must survive split/merge; different quality lots cannot merge into fictitious improved stock.
- [ ] **08.3** Implement outdoor stockpiles, sheds, warehouses, specialist stores and vaults. Enforce capacity, handling access, weather exposure, spoilage/rust and hazard separation.
- [ ] **08.4** Implement placement, clearance, foundations, delivery, construction labor, scaffolding, commissioning, repairs, component upgrades, demolition and salvage. Cancelled work refunds only unconsumed materials.
- [ ] **08.5** Add purchase/sale transactions, outstanding wages, operating costs, capital projects and explicit account balances. Implement the universal road exchange and copper/silver/gold tender before adding market speculation complexity. Present cash, inventory valuation, debt/arrears, revenue, expenses and forecast cash runway separately.
- [ ] **08.6** Implement food/fuel/water basics, domestic supply routes, tool wear and maintenance reservations. Trade bridges missing local necessities.
- [ ] **08.7** Add warning and recovery states for insufficient funds, materials or storage. No free building from negative stocks or repeated sell/buy rounding exploits.
- [ ] **08.8** Add inventory filters, material-use previews, build ghosts, blocked-job reasons and a transaction drill-down from every balance change.

**Gate:** Goods occupy space and have owners; a building cannot consume the same stack as a sale. Repair/rebuild and trade paths can sustain the camp through multiple days. Insolvency is explained and recoverable when reasonable assets/options remain.

### Phase 09 — Procedural mountain, discovery and excavation

- [ ] **09.1** Implement deterministic structural geology, resource geology, historical workings, hazards and expansion layers with separate seed streams.
- [ ] **09.2** Generate connected accessible entrances and the nine archetypes. Enforce resource/hazard plausibility and campaign viability without guaranteeing valuable discoveries.
- [ ] **09.3** Separate hidden ground truth from explored geometry, exposed faces, survey reports and identified materials. Save both truth and acquired knowledge appropriately.
- [ ] **09.4** Implement prospecting, sampling, confidence intervals, assay progression and report dates. Unknown material retains stable identity while its player-facing label changes.
- [ ] **09.5** Implement three-way branch proposals at suitable frontier nodes, with cost, access and uncertainty; allow poor results and empty rock without hiding the risk.
- [ ] **09.6** Implement excavation work, actual depletion, rubble, retained pillars, chamber merging, reinforcement and backfill. Update navigation, visibility and support state on completion.
- [ ] **09.7** Distinguish horizontal haul-distance costs from vertical access/technical requirements. Add level transitions, connected stairs/shafts and persistent depth maps.
- [ ] **09.8** Preserve seed plus modification history or equivalent saved chunk state. Regeneration must never restore mined ore or reroll a discovered deposit.

**Gate:** Fixed seeds reproduce geology; explored/modified levels survive reload exactly. Every generated starting layout has a viable route. A surveyed branch can be opened, depleted, reinforced and repurposed without navigation or inventory corruption.

### Phase 10 — Logistics, safety and the engineering revolution

- [ ] **10.1** Implement pathfinding with load/clearance restrictions, reachable storage, traffic, queues, passing spaces and blocked-route recovery.
- [ ] **10.2** Add manual carrying → baskets/wheelbarrows/carts → rail/hoist routes. Reserve capacity and travel time, including empty return trips and transfer handling.
- [ ] **10.3** Implement bounded structural-support zones and excavation influence. Natural pillars, timber, masonry and metal supports change safe excavation limits.
- [ ] **10.4** Implement water/drainage and ventilation networks as understandable engineering models; add gas, heat, fire and contamination incrementally. Document simplifications rather than implying real engineering accuracy.
- [ ] **10.5** Add pumps, fans, bulkheads, ventilation doors, power/fuel requirements, maintenance, duty cycles and failure propagation.
- [ ] **10.6** Implement inspections, warning stages, work stoppage, evacuation, rescue, first aid and return-to-work. Calibrate event frequency to prevent catastrophe spam.
- [ ] **10.7** Add logistics and safety overlays: routes, throughput, bottlenecks, available support, water, air quality and service range. Show evidence behind warnings.
- [ ] **10.8** Create a manpower-plateau scenario where hiring more workers increases congestion; a targeted rail/pump/ventilation investment releases measurable labor or access.

**Gate:** A broken pump or blocked route interrupts the correct jobs and produces actionable feedback. Workers do not teleport through floods/collapses. An engineering upgrade changes the bottleneck and effective throughput, not only a displayed multiplier.

### Phase 11 — Processing, manufacturing and industrial production

- [ ] **11.1** Implement recipe/workstation scheduling with material, operator skill, energy/fuel, water, time, maintenance and storage requirements.
- [ ] **11.2** Deliver wood and stone chains first, then iron/steel, copper alloys, precious metals, glass/ceramics, tools/components and machines; use Appendix B as the production dependency graph.
- [ ] **11.3** Implement mixed ore: feed mass × contained grade × recovery. Recover multiple constituents within conservation limits and track gangue, slag, tailings and losses explicitly.
- [ ] **11.4** Add manual sorting, screening/crushing, grinding, density separation, flotation, smelting and advanced refining in increasing complexity. Higher recovery must not create metal already removed in a previous pass.
- [ ] **11.5** Make old tailings assayable and reprocessable; allocate land/capacity and handling cost to them. Add contamination/water-management consequences proportionately.
- [ ] **11.6** Make quality affect tool speed, fatigue, precision, durability and safety. Repairs consume time/parts and cannot indefinitely produce free upgrades.
- [ ] **11.7** Finish industrial art states alongside working machines. Show inputs, output queues, operator positions, movement, smoke/noise and breakdown state.
- [ ] **11.8** Show sell-raw versus process economics including labor, losses, fuel, storage, maintenance, time and capital tied up—not only output price.
- [ ] **11.9** Implement the silver/gold mint: assay and refining requirements, weighed blanks, dies/press, rejected metal recovery, labor/fuel/maintenance, certified coin output, secure storage and minting ledger. Test mining-to-money and purchase-metal-to-mint economics against the universal standard.

**Gate:** Complete chains transform ore into working tools/machine parts and assayed silver/gold into spendable coins with balanced material and monetary accounting. Better processing can make a known low-grade deposit or old tailings valuable without infinite recovery exploits.

### Phase 12 — Worker development, crews and institutions

- [ ] **12.1** Implement six capabilities and the seven skill domains in Appendix C. Combine fundamentals with material/task familiarity; avoid hundreds of completely isolated skill grinds.
- [ ] **12.2** Record task hours, training received/delivered, leadership shifts, repairs and significant incidents. Distinguish practical mastery from theoretical knowledge.
- [ ] **12.3** Add teacher/student scheduling, aptitude-sensitive learning, challenging practice, competence requirements and certifications for high-risk work. Aptitude affects learning, not permanent career locks.
- [ ] **12.4** Implement crews, shared histories, cohesion and bounded coordination/leadership effects. Apply the multiplier once; prevent stacking many foremen into unlimited output.
- [ ] **12.5** Add order levels: individual task → crew objective → reserve policy → foreman district → department. Match authority to competence and available information.
- [ ] **12.6** Set autonomy boundaries: territory, budget, reserve minima, safety stop rules, escalation triggers and manual overrides. Explain decisions in an activity log.
- [ ] **12.7** Implement workshop training → training hall → guild house → technical college → Royal Mining Academy. Require staff, books, equipment, teaching time and operating funds.
- [ ] **12.8** Model expert absence, leave, injury, missions and knowledge redundancy. Books preserve knowledge but do not instantly replace experienced staff.
- [ ] **12.9** Add Borrin's mentor/history role and founder career milestones. The best miner need not become the best teacher or manager.

**Gate:** A trained crew completes a bounded objective safely without individual orders; a missing expert can delay work without destroying saved knowledge. Generalist explorers and specialist production crews both have useful roles. No player XP system is introduced.

### Phase 13 — Household prosperity and the independent town economy

- [ ] **13.1** Create worker wallets, households, housing assignment, personal inventories, pay receipts, recurring expenses and savings. Company and household accounts transfer money rather than duplicate it.
- [ ] **13.2** Implement needs by development tier: survival → reliable working life → comfort/services → prosperity/culture → luxury/representation. Expectations rise gradually with achieved standards, not instant stage penalties.
- [ ] **13.3** Add housing component benefits: structure, roof, windows, heat, furnishings, lighting, privacy, access and upkeep. Display possessions at selected homes/interiors without rendering every item everywhere.
- [ ] **13.4** Add food variety, hygiene, healthcare, education, clothing, beer and recreation as supplied services with labor and goods costs.
- [ ] **13.5** Implement demand assessment, business startup capital, locations, licensing, subsidies and private/public ownership. Start with bakery, brewery/tavern, carpenter and tailor; expand to the listed service families.
- [ ] **13.6** Give businesses staff, inventories, prices, expenses, revenue and failure/recovery behavior. A saving dwarf can become a proprietor; demand alone must not conjure a free stocked building.
- [ ] **13.7** Implement recruitment/immigration capacity, household formation and later retirement/inheritance decisions. Preserve founder histories and succession.
- [ ] **13.8** Add civic participation through a manageable petition/council system, service policy and wage grievances. Avoid a separate grand-strategy political simulator.

**Gate:** Wages can finance purchases, savings and a viable private business. Higher pay can increase local demand while reducing immediate company cash. Households cannot spend nonexistent money, and the company cannot consume their possessions implicitly.

### Phase 14 — External economy, markets and missions

- [ ] **14.1** Expand the opening universal road exchange into scheduled caravans, cargo capacity, tariffs/fees where used, delivery times, reliability and settlement at receipt. Continue accepting every useful eligible item/resource; specialist contracts improve terms rather than being required to sell basic goods.
- [ ] **14.2** Implement procurement, recruitment, technical-learning and trade-delegation missions. Reserve personnel, funds, travel time and cargo; save in-transit state and prevent duplicate returns.
- [ ] **14.3** Add contracts with quantity, quality, deadline, transport, payment and failure terms. Make inspection and partial delivery explicit.
- [ ] **14.4** Implement market demand, supply, regional events, grade/quality and transport effects. Commodity prices and expenses move in the fixed universal coin system; denomination exchange rates never float. Add finite liquidity, bid/ask spread and price impact so unlimited arbitrage cannot fund the game.
- [ ] **14.5** Model source events: foreign war, new competing mine, construction boom, poor harvest, external mine disaster and mint expansion. These affect reports and trade without adding local combat.
- [ ] **14.6** Progress from Borrin's approximate prices to trader quotes and ledgers with current price, history, average, trend, traded volume and news. Never show guaranteed future prices.
- [ ] **14.7** Add reserve/target/sell-above/emergency-buy policies with budgets, reserved-stock exclusions, transport capacity and hysteresis to prevent buy/sell oscillation.
- [ ] **14.8** Preserve initial and permanent import dependencies. Do not make every seed self-sufficient; do provide a costly but viable route to essential starting inputs.

**Gate:** Trade and missions settle exactly once across save/load. Stockpiling has storage, labor and liquidity costs. Bad forecasts can hurt without scripted inevitability; external reports do not grant omniscient market knowledge.

### Phase 15 — Deep industry and the mountain city

- [ ] **15.1** Expand through the depth bands in Appendix D; combine geology with heat, pressure, water, air, supports, access and processing requirements.
- [ ] **15.2** Add underground depots, break rooms, kitchens, workshops, residences, medical stations and laboratories, each supplied through the logistics network.
- [ ] **15.3** Finish industrial freight trains, powered lifts, conveyors, cranes and service networks. Track power distribution, transfer capacity and maintenance staff. Add steam boiler/pump assemblies with water, fuel, pressure and maintenance demands; introduce electrical distribution through the same utility contracts when available.
- [ ] **15.4** Reuse old levels as terminals, depots, administration or historical spaces. Preserve archaeological finds and original excavation records.
- [ ] **15.5** Implement department reporting with staff-produced estimates, update delays and drill-down to a site. Allow Lord Dwarf to inspect physically without giving hidden assay knowledge for free.
- [ ] **15.6** Stream visual chunks and simulate off-screen districts at a bounded rate; reconcile exactly when workers/goods become visible. Aggregate distant animation, not inventories or transaction correctness.
- [ ] **15.7** Stress-test at least 30 persistent levels and population steps of 17, 100, 500 and 1,000 as proposed scalability targets. Set the supported release cap from measured hardware results.

- [ ] **15.8** Unlock platinum refining and minting when advanced metallurgy and treasury throughput justify it. Add platinum dies/handling/storage and exact 100-gold equivalence; allow large trades/payments without changing purchasing power merely by changing denomination.

**Gate:** A multi-level city can operate under delegated management with understandable bottlenecks. Revisiting an old district preserves its history; time acceleration and off-screen simulation do not duplicate output or lose people.

### Phase 16 — Fantasy discovery and strategic resources

- [ ] **16.1** Introduce subtle anomalous appearances/sounds before labels: warm crystals, ringing stone, unfamiliar metal and unnatural formations.
- [ ] **16.2** Implement sample → observation → investigation → identification → safe handling → processing → application, requiring actual experts and institutional capacity.
- [ ] **16.3** Deliver the fantasy catalog in three production waves: utility/thermal/transport; arcane information/power; dangerous strategic/Old Depths materials. Preserve all entries in Appendix A.
- [ ] **16.4** Give every resource a practical use, rarity/setting, processing chain, handling cost, discovery evidence and limits. Content without a functioning application remains explicitly unavailable.
- [ ] **16.5** Implement research incidents, containment, specialized storage and substitutes. Soulstone and similarly sensitive discoveries can trigger trade/research policy choices without combat.
- [ ] **16.6** Build fantasy machinery as extensions to existing energy, storage, logistics and maintenance systems. Do not create a second disconnected inventory/economy.
- [ ] **16.7** Add Old Depths geological mysteries and archaeology that reward investigation while preserving the game's industrial identity.

**Gate:** At least one complete fantasy chain creates a new engineering option with costs and risks; the full advertised catalog has traceable acquisition and use paths before content-complete signoff.

### Phase 17 — Capital progression, balance and release

- [ ] **17.1** Implement the eight settlement-stage gates in Appendix D using sustained services, institutions, logistics and living standards. Avoid promoting a camp because it briefly holds enough money.
- [ ] **17.2** Complete late-stage architecture, interiors, service animations, public spaces and historical preservation. Review every stage at player camera scale.
- [ ] **17.3** Add capital achievement and a civilization report: founders and apprentices, living standards, safety, productive capability, exports, discoveries and financial resilience. Allow continued play.
- [ ] **17.4** Balance multiple strategies and seeds; audit food/tool/import/research deadlocks, exploit loops, runaway wealth, unavoidable bankruptcy and excessive catastrophe frequency.
- [ ] **17.5** Finish onboarding, searchable help, contextual explanations, report confidence, queues, filters, remappable controls, text/UI scaling, color-independent overlays, subtitles/captions and reduced motion/flash options.
- [ ] **17.6** Complete validated saves, migration fixtures, recovery, export/import, quota handling and explicit errors. Handle background tabs, reloads, time acceleration and long absences consistently.
- [ ] **17.7** Test performance and downloads on the selected devices/browsers; verify GPU texture budgets, large settlements, many levels, sustained sessions and input responsiveness.
- [ ] **17.8** Resolve production console errors, including the currently documented hydration mismatch; validate base-path hosting, clean installs, deployment artifacts and rollback.
- [ ] **17.9** Review asset provenance, settings, credits, release notes and support diagnostics. Release only supported features; label incomplete content rather than presenting decorative placeholders as systems.

**Gate:** A new campaign can reach the capital and continue, with functioning recovery paths, migration coverage, performance evidence and no known progress-blocking defects.

## Appendix A — Complete content and asset register

Every named source item below must receive a registry disposition: **implemented**, **scheduled**, **variant/alias of another entry**, or **explicitly deferred** with a reason. Shared geometry is encouraged; silently dropping a resource because it is inconvenient is not. Resource variants can share visual families while retaining distinct simulation definitions. A catalog entry needs an acquisition path, storage rules, consuming recipe/use and release phase before it becomes available to players.

### A1. Mundane geology

| Family | Required source coverage | Art/data introduction; functioning economy |
| --- | --- | --- |
| Stone/earth | Granite, limestone, sandstone, slate, marble, basalt, clay, silica/quartz, gypsum, rock salt/halite; rubble, gravel, sand, kaolin | 05; basic uses 07–08, full processing 11 |
| Fuel/industrial minerals | Coal, graphite, fluorite, barite, mica, feldspar, phosphate rock, sulfur, pyrite | 05; 11–15 |
| Common/base-metal ores | Hematite, magnetite, copper ores/chalcopyrite, cassiterite/tin, galena/lead, sphalerite/zinc, nickel ores, manganese, chromite, cobalt-bearing minerals | 05; 09–11 |
| Advanced/strategic ores | Bauxite/aluminum source, molybdenite, tungsten/scheelite, antimony, cinnabar/mercury, uranium ores | 05 representative materials; full technical/handling applications 11–15 |
| Precious metals | Silver-bearing ore, gold-bearing ore, platinum-group metals/platinum-bearing ore | 05; 09–11, strategic trade 14 |
| Gems/curiosities | Quartz crystal, garnet, tourmaline, topaz, beryl, aquamarine, emerald, ruby, sapphire, diamond, opal, jade, amber | 05; precision extraction/craft 09–12 |

Use geological setting to distinguish surface/weathered, sedimentary, metamorphic, igneous and hydrothermal resources. Amber and bauxite need plausible surface/import treatment; they must not be arbitrarily inserted into deep hard-rock veins. Uranium and mercury require fictionalized industrial handling rules and a defined use before activation. Mineral grade, elemental content, recovery and sale-quality are different quantities.

### A2. Fantasy resource register

These are complete source-name coverage, not final numerical recipes. Each gets the Phase 16 discovery and containment contract.

| Wave | Resources and intended application |
| --- | --- |
| F1: materials, heat and transport | **Mithril:** light strong equipment/precision machinery; **Adamantite:** hard tools/supports with demanding processing; **Star-Iron:** rare alloys/instruments; **Sunstone:** stored light/heat; **Deepfire Coal:** high-temperature fuel/fire risk; **Froststone:** refrigeration; **Floatstone:** lifting/transport; **Rootstone:** underground agriculture; **Ironroot Ore:** tools/construction; **Dragon Glass:** cutting/luxury; **Ember Ruby:** persistent heat; **Ice Sapphire:** cooling; **Kingsgold:** prestige/currency goods. |
| F2: power, information and specialist industry | **Moon Silver:** magical storage/ritual goods; **Storm Crystal:** stored electrical energy; **Ghost Quartz:** detection/ritual use; **Echo Crystal:** surveying/communication/music; **Memory Stone:** records/archaeology; **Voidstone:** counterweights/shielding; **Gravestone:** gravity-assisted machinery; **Living Crystal:** cultivated renewable mineral; **Thunderstone:** controlled mining energy; **Black Silver:** conductive machinery; **Runestone:** research/enchantment; **Mana Crystal:** magical energy storage; **Nullstone:** suppression/containment; **Aetherite:** advanced engineering. |
| F3: dangerous and strategic discoveries | **Bloodstone Ore:** biological/alchemical research; **Dream Opal:** medical/entertainment use with dependency concerns; **Dragonbone Fossil:** research/artifacts/prestige; **Wild Mana Crystal:** powerful unstable energy; **Soulstone:** consciousness research and political consequences; **Worldstone:** long-timescale geological influence. |

### A3. Wood and construction materials

- **Wood:** raw logs, rough poles, construction timber, beams, planks, boards, shingles, wooden pegs, tool handles, firewood, charcoal, sawdust, wood scraps, fine hardwood, resin, pitch/tar.
- **Processed stone:** cut blocks, dressed stone, flagstone, crushed stone, gravel aggregate, lime, mortar, plaster, fired brick, firebrick, roof tile, ceramic tile, glass, polished marble, decorative stone.
- **Refined metals:** iron concentrate, pig iron, wrought iron, steel, hardened/tool steel; copper concentrate/ingots, bronze, brass; lead, zinc, tin, nickel ingots; silver/gold/platinum bullion; cobalt concentrate, chromium and tungsten alloys.
- **Construction/component parts:** wood/iron/steel beams; wood posts, stone/steel columns; floor planks/tiles; roof shingles/slates/tiles; glass panes; doors, window frames, hinges, nails, bolts, screws, brackets, plates, pipes, valves, chains, wire, rails, rail ties, ladders, scaffold sections, rope, pulleys, gears, bearings, shafts, wheels, axles.

**Sequence:** early wood and rough masonry assets in 03–04; component definitions in 01; operating chains in 08/11; advanced-material variants in 15–16. Normalize overlap such as “beam” and “wood beam” without losing material identity.

### A4. Tools, surveying and workshop equipment

| Family | Required variants |
| --- | --- |
| Hand tools | Pickaxe/miner's pick, mattock, shovel, spade, sledgehammer, hand/masonry hammer, chisel, wedge, pry bar/crowbar, axe, hatchet, crosscut/hand/bow saw, adze, auger, hand drill, file, rasp, tongs, pliers, wrench, oil can, sharpening stone, tool belt, rope, bucket, lantern |
| Tool grades | Poor, Common, Good, Fine, Masterwork; separately track current wear/condition |
| Survey/technical tools | Measuring rope, chalk, stakes, plumb bob, straightedge, level, compass, measuring chain, angle gauge, drafting board, maps, survey notebook, ore sample box, magnifying lens, balance/precision scales, assay hammer, sample/core drill, chemical assay kit, geological instruments |
| Workshop stations | Anvil, forge, bellows, workbench, vise, tool rack, saw bench, lathe, drill press, grindstone, milling machine, casting mold, crucible, furnace, kiln, carpenter/masonry/jeweler/assay/precision benches |

**Sequence:** core props 03/05, animation attachments 06, work/equipment 07–08, survey 09, full manufacturing and teaching use 11–12. Tool aliases may share one model; function and recipe remain explicit.

### A5. Storage, transport, support and machinery

| Family | Required content |
| --- | --- |
| Containers/storage fixtures | Sack, basket, crate, reinforced crate, wood/sealed barrel, ore/coal bin, timber rack, stone yard, metal rack, warehouse shelving, locked strongbox, bullion chest, gem safe, bulk hopper, silo, tank |
| Early transport | Shoulder/hand basket, wheelbarrow, handcart, timber sled, mine cart, ore cart |
| Intermediate transport | Reinforced mine cart, tip cart, rail trolley, wagon/heavy wagon, hoist cage, cargo lift, ore chute |
| Advanced transport | Locomotive, powered ore train, conveyor belt, bucket elevator, powered lift, crane, gantry crane |
| Supports/services | Wood pit prop, crossbeam, timber brace, stone pillar, iron brace, steel support, rock bolt, support plate, scaffolding, retaining wall, reinforced arch, ventilation door, bulkhead, drainage channel, pipework, pump line, safety railing |
| Primitive processing | Sorting table, hand screen, hand crusher, grinding stone, manual bellows, charcoal kiln, small forge |
| Early mechanical processing | Ore screen, trommel, stamp mill, powered crusher, grinding mill, waterwheel, mechanical bellows, ore washer, simple furnace |
| Industrial processing | Jaw/roll crusher, ball mill, separator, flotation tank, roasting furnace, blast furnace, powered smelter, casting line |
| Advanced machinery | Precision separator, automated sorter, powered/compressed-air drill, high-capacity pump, ventilation fan, industrial hoist, powered conveyor, mechanical workshop |

**Sequence:** connection standards 01; representative assets 05; storage 08; logistics/support 10; processing 11; deep industrial variants 15. A waterwheel requires an actual water/power source; its presence cannot imply free energy.

### A6. Personal possessions and services

| Prosperity tier | Required visible possessions |
| --- | --- |
| Destitute | Bedroll, rough blanket, wooden cup/bowl/spoon, work clothes, simple boots, personal knife, small sack |
| Basic working life | Straw mattress, bed frame, blanket, pillow, chest, stool, small table, ceramic cup/plate, cutlery, lantern, coat, good boots |
| Comfortable | Proper mattress, wardrobe, chairs, dining table, rug, washbasin, mirror, bookshelf, writing desk, cookware, glassware, decorations, clock, fine clothing |
| Prosperous | Private bedroom, quality furniture, carpet, book collection, decorative light, silverware, fine ceramics, wall art, instrument, jewelry, tailored clothes, heated bath |
| Wealthy | Rare-wood furniture, marble bath, crystal glassware, silver service, gold ornaments, gem jewelry, fine art, luxury bedding, imported carpets, mechanical clock, private library |
| Elite | Gem-inlaid/masterwork furniture, gold serviceware, sculpture, rare manuscripts, masterwork instruments, luxury imported textiles, fantasy-material decorations |

Build reusable furnishing modules in 04, satisfy basic needs in 07–08, implement household ownership/services in 13, and finish luxury/fantasy variants in 15–16. Room requirements such as a private bedroom are spatial services, not stackable pocket items.

### A7. Food, consumables and trade-only goods

- **Staples:** grain, flour, bread, oats, barley, beans, peas, potatoes/root vegetables, onions, cabbage, salt.
- **Protein/dairy:** eggs, milk, cheese, fresh/salted/smoked meat, fish, dried fish.
- **Comfort food:** butter, honey, jam, fruit, dried fruit, pastries.
- **Drinks:** water, small beer, ale, strong beer, cider, wine, spirits, tea, coffee.
- **Luxury food:** spices, fine cheese, rare fruit, preserved delicacies, imported sweets.
- **Household/medical/administrative consumables:** soap, candles, lamp oil, charcoal, firewood, cleaning cloth, broom, bucket, toilet supplies, laundry soap, bandages, herbal medicine, writing paper, parchment, ink, quills/pens, books, ledgers.
- **Initial import families:** grain, cloth, leather, rope, lamp oil, medicine, paper, ink, books, precision tools, replacement metal parts, glass goods, livestock, seeds, special chemicals, high-quality steel tools; optionally coal/iron/copper/salt/timber according to seed.
- **Potential permanent imports:** spices, silk, tea, coffee, particular medicines/dyes, exotic hardwoods, foreign wines/art/manuscripts, specialized machinery, chemical reagents and foreign luxuries.

**Gap filled:** farms/gardens, seed cycles, milling, livestock products, food preservation, cloth/leather and medical supplies require their own supply definitions. Begin with imports; add only supported local chains in 11–13. Imports remain an intentional strategy, not a missing implementation disguised as self-sufficiency.

### A8. Opening manifest checklist

Use these source quantities as the initial data-entry fixture, then reconcile them with D01–D03 and test balance. Their presence here does not overwrite the current game.

| Category | Source starting quantities |
| --- | --- |
| Tools | Picks 7 (4 usable/3 poor); shovels 6; sledgehammers 3; hand hammers 4; chisels 8; pry bars 3; axes 4 (2 good/2 worn); crosscut saw 1; hand saws 2; auger 1; mostly empty tool chest 1 |
| Transport/storage | Mine carts 2 (1 usable); wheelbarrows 4 (2 usable); timber sled 1; crates 9; barrels 5; sacks 18; aging rope 70 m; rusty chain 12 m; pulleys 4 (2 usable) |
| Mine equipment | Pit props 21; support beams 7; ladders 4; lanterns 11; oil about 3 days; hand winch 1; old ore screen 1; broken hand crusher 1; water buckets 12 |
| Living supplies | Bedrolls 14; blankets 11; straw mattresses 7; bowls 13; cups 9; cooking pots 2; water barrels 3; firewood 2–3 days; food about 3 days |

Condition labels become actual condition/durability values. Clarify whether the three water barrels are included in the five barrels before import; do not duplicate them accidentally. Food/oil “days” must be converted using the chosen roster and consumption rates. Personal possessions and company bedding require explicit ownership.

## Appendix B — Production graph and recipe contracts

### B1. Required recipe record

Each recipe declares inputs/quantities/units, acceptable substitutes, output/byproduct/loss quantities, workstation, operator competence, productive time, power/fuel/water, quality/recovery rules, storage/handling requirements, unlock knowledge, hazards and maintenance. Mark figures provisional until balanced. Every cycle must consume time or another scarce input; no circular recipe can generate free mass, money or quality.

### B2. Dependency graph by production family

| Chain | Ordered transformations | Dependencies and constraints | First complete phase |
| --- | --- | --- | --- |
| Salvage | Ruins/rubble → sorted stone, timber, scrap, damaged equipment → repair/reuse/sale | Worker time, access, containers; one-time depletion | 07 |
| Wood | Trees → logs → poles/timber → beams/planks/boards → roofs, containers, handles, carts, furniture | Forest clearance, axes/saws, carpentry, haul/storage; scraps/sawdust accounted | 08 |
| Fuel | Low-grade wood → firewood or kiln charcoal; coal → graded fuel | Finite forest/regrowth policy, kiln labor, burn efficiency, fire risk | 08/11 |
| Masonry | Rock → rough/cut/dressed blocks or aggregate → walls, foundations, roads | Quarrying, cutting tools, delivery and construction labor | 08/11 |
| Lime/ceramic | Limestone + heat → lime; lime + aggregate/water → mortar; clay + heat → brick/tile; selected clay → firebrick | Water/fuel, kiln/furnace, cooling, material quality | 11 |
| Glass | Silica feed + suitable fluxes + heat → glass → panes/instruments/glassware | Flux recipe, furnace temperature, skilled shaping; import unavailable inputs | 11 |
| Ferrous | Iron-bearing ore → prepared/concentrated feed → smelting → pig iron or alternative bloom/wrought route → steel → tool/specialty steel | Carbon source, flux, refractory material, process equipment, losses; route-specific recipes | 11 |
| Copper alloys | Copper ore → concentrate → copper; copper + tin → bronze; copper + zinc → brass | Separate alloy branches; composition and purity retained | 11 |
| Specialty metals | Nickel/cobalt/chromium/molybdenum/tungsten/etc. feed → separation/refining → specialty alloys/components | Relevant metallurgy, process reagents and precision equipment; import option | 11–15 |
| Coinage | Silver/gold ore → concentrate → refined metal → assayed bullion → blanks → struck/certified silver/gold coins; platinum added later | Fixed denomination standard; material conservation, mint operating costs, secure storage and one-time currency creation | 11; platinum 15 |
| Precious/gems | Ore/gem formation → careful extraction/sorting → refining or cutting → bullion/jewelry/prestige goods | Precision, security, skilled craft, uncertain recovery | 11–14 |
| Tools/parts | Wood/metal feed → handles, fasteners, plates, gears, shafts, bearings, wheels → tools and machine assemblies | Machine tools increase precision/throughput; quality and wear | 11 |
| Rail/hoist | Timber/metal → ties/rails, wheels/axles, chain/cable, gears → routes/carts/lifts | Civil works, supports, power where needed, signaling/traffic, upkeep | 10–15 |
| Buildings | Components + foundation + labor → commissioned structure → services/material upgrades | Delivery/reservations, utilities, staff/furnishings; expansions need space | 08–15 |
| Food/drink | Imports or crops/livestock → flour/ingredients → meals/bread/beer/dairy/preserved food | Water, fuel, recipes, hygiene, spoilage, staffing and feed inputs | 08/11/13 |
| Textiles/households | Cloth/leather/wood/metal + labor → clothes, boots, furnishings and goods | Import intermediate inputs initially; consumers pay through household accounts | 11/13 |
| Knowledge | Observation/sample + expert time + instruments/books → reports/skills/process knowledge → taught practice | Lab/teaching capacity, uncertainty, availability and practical experience | 09/12 |
| Utilities | Fuel/water/mechanical source → power/heat → distribution → machines/lights/ventilation/pumps | Network capacity, losses, outage/maintenance behavior | 10–15 |
| Waste recovery | Feed → products + slag/tailings → storage/assay → reprocessing → residual waste | Retain composition of residual material; never recover already-extracted content | 11 |
| Fantasy | Anomaly → research → safe extraction → specialist processing → constrained utility | Existing inventory, power, maintenance and knowledge systems; containment | 16 |

### B3. Numerical invariants and design equations

These are proposed simulation contracts, refining the source's examples:

- **Worker output:** `productiveHours × taskBaseline × relevantSkill × energy × motivation × condition × equipment/workplaceQuality`. Zero productive time yields zero work. Avoid charging the same fatigue/condition loss through several equivalent modifiers.
- **Team output:** sum the members' work, then apply one bounded coordination effect and enforce machine/site/haul capacity. Teaching time reduces the teacher's production hours.
- **Skill relevance:** combine fundamentals, specialization and supporting knowledge. The source's `0.55 general mining + 0.35 material familiarity + 0.10 geology` is a useful provisional fixture; coefficients are data, not universal constants.
- **Contained metal:** `feedMass × elementalGrade`; **recovered metal:** contained metal × recovery efficiency. The source example `30 t × 0.048 × 0.55 = 0.792 t` is a regression fixture. At 81% recovery it yields 1.1664 t, not extra metal beyond the original contained amount.
- **Mixed ore:** known composition plus unknown remainder must total 100%. Mineral percentages are not automatically elemental metal percentages; conversions need definitions.
- **Cash:** opening balance + settled external receipts + newly minted certified coin value − settled external payments − coins withdrawn for remelting. Minting consumes metal and records currency creation, not sales revenue. Available treasury excludes committed or in-transit coins. Unpaid invoices/wages remain liabilities; appraisal is not receipt. Internal utility is an estimated avoided-cost/opportunity-cost display, never free accounting profit. Coin inventory and its bit-denominated balance are two views of the same holdings, not two assets to add together.
- **Markets:** base price × bounded demand/supply/event/quality/transport factors is a tunable model, with finite liquidity and spreads. The factors are estimates from game state, not a promise that every price increase is predictable.
- **Learning:** productive practice/training time, appropriate challenge, teacher competence and aptitude determine progress. Repeating a trivial/cancelled job cannot farm unlimited experience; aptitude uses soft learning limits rather than hard career bans.

## Appendix C — Workforce and organizational scope

### C1. Capabilities, skills and present state

**Core capabilities:** Vigor, Dexterity, Reasoning, Awareness, Discipline, Initiative. Keep the current single capability as a derived summary during migration rather than letting both models independently amplify output.

| Domain | Skills to support |
| --- | --- |
| Extraction | Mining, quarrying, timbering, blasting, drilling, excavation, gem extraction; stone/iron/copper/coal/silver/gold/sulfide/deep-rock/soft-rock familiarity |
| Processing | Sorting, crushing, smelting, refining, casting, alloying, chemical processing |
| Craft | Smithing, carpentry, masonry, glassmaking, mechanics, jewelry |
| Engineering | Structural work, mine planning, ventilation, hydraulics, mechanical, rail and power systems |
| Knowledge | Geology, mineralogy, metallurgy, mathematics, surveying, economics, research methodology |
| Administration | Accounting, inventory, logistics, scheduling, procurement, personnel management |
| Social | Teaching, leadership, negotiation, trade, conflict resolution |

Cooking and basic labor remain valid occupations while their detailed skills are mapped into the broader model. Current state includes energy, motivation, health/injury, hunger/thirst, fatigue, housing and safety experience, schedule, location and availability. Work, rest, meals, sleep, teaching, training, travel, leave, outside missions and expedition assignments cannot overlap as free concurrent labor.

### C2. Founder identity mapping

Preserve current residents: **Borrin, Durgan, Helga, Brokk, Nessa, Tam, Pip, Mora, Grit, Fenn, Kori, Bram, Ulla, Stig, Yara, Hob and Dunwold**. Confirm names, dialogue and intended identities against the existing catalog before expanding biographies. Names such as Torvek, Fenri, Bromm, Garrick, Hilda and Marek in the notes are illustrative worker examples, not automatic extra starting residents.

Borrin holds institutional memory and teaches early managers. Give each founder at least one useful strength, one limitation, initial skill/history and a recognizable personal goal. Avoid reducing “enthusiastic idiot” flavor into a permanently unusable worker. Promotion, entrepreneurship and master craft are equally valid outcomes. The original crew's achievements remain visible in later reports and historical places.

### C3. Delegation ladder

| Level | Orders | Required support | Failure/escalation behavior |
| --- | --- | --- | --- |
| Individual | Use tool, work face, stop at quantity | Explicit task, reachable inputs | Wait with a reason when blocked |
| Crew | Operate quarry/repair site | Leader, tools, supply route | Handle routine subtasks; report unfamiliar hazards |
| Foreman | Maintain stock / manage district | Competence, budgets, policies, crews | Request funds/staff or stop unsafe work |
| Department | Manage several floors/production chains | Reporting, deputies, schedules, logistics | Surface capacity bottlenecks and exceptions |
| Institution | Maintain production, train successors, research | Redundant expertise, records, funding | Continue through individual absence; escalate strategic decisions |

The initiative bands in the source describe progression in responsibility, not permission to spend all company money. High skill alone does not grant leadership. The player can inspect, override and revoke an order, with an explanation of resulting interruptions and costs.

## Appendix D — World and progression acceptance matrix

### D1. Surface zones

| Zone | Beginning | Mature role | Spatial requirements |
| --- | --- | --- | --- |
| Outer Lands | Road, forest edge, arriving traders | Lumber/farms, caravan staging, trade/logistics district | Estate boundary, gate, route capacity, forest/water/land rights |
| Base Camp | Ruins, tents, broken structures, Pit Yard | Permanent homes, public square, civic life | Historical landmarks, walkable service access, safe housing |
| Industrial Periphery | Junk and primitive stores | Warehouses, mills, furnaces and factories | Freight access, utilities, noise/fire buffers, waste space |
| Mountain | Abandoned shallow workings | Multi-level industrial and residential civilization | Geology, shafts, support/air/water, logistics and active-region limits |

### D2. Depth bands

| Band | Source range | Main development pressure |
| --- | --- | --- |
| Surface/quarry | 0–50 m | Stone/clay/limestone, clearing and timber-based construction |
| Upper mine | 50–200 m | Iron/coal/copper/lead, reliable support and hauling |
| Middle mine | 200–500 m | Tin/zinc/silver and mixed deposits, better surveys and processing |
| Deep mine | 500–1,000 m | Gold/nickel/cobalt/tungsten/gems, heat/water/pressure and specialist industry |
| Great Depths | 1,000 m+ | Extreme conditions, advanced utilities and gradual anomalies |
| Old Depths | Unspecified | Unknown geology, archaeology and strategic discoveries |

A numbered level has elevation and thickness; “Level 6” is not a universal depth. Longer horizontal routes increase travel and congestion even without a new depth band. Resource occurrence is geological and seed-based, never a guaranteed reward for reaching a number.

### D3. Settlement stages

All thresholds below describe required systems; tune numerical values through scenario testing. Proposed promotion rule: maintain the conditions for several shifts, with hysteresis and explanatory warnings if services later deteriorate. Avoid repeatedly toggling a stage label after small inventory changes.

| Stage | Functional gate | Visible evidence | Development phase |
| --- | --- | --- | --- |
| Ruins | Arrival and ownership discovered | Broken hall, tents, idle workers, cold forge | 03/07 |
| Camp | Reliable meals/water, usable shelter, first repeatable extraction/sale, paid or explicitly managed wages | Roof repairs, sorted stores, working fire/forge | 07–08 |
| Work Settlement | Scheduled crews, supplies, maintenance and stable local hauling | Workshop/storehouse, paths, organized worksites | 08–12 |
| Village | Permanent households and first viable independent services | Homes, bakery/tavern, furnishings, communal spaces | 13 |
| Town | Diversified firms, basic civic/health/education services and functioning market | Streets, shops, guild/training facilities | 13–14 |
| Industrial Town | Sustained processing/manufacturing, freight and utility capacity, trained operators | Foundries, rail terminal, warehouses and industrial districts | 11–15 |
| Mountain City | Habitable/supplied underground districts, multi-level logistics and delegated departments | Great halls, underground workshops/housing and deep infrastructure | 15 |
| Dwarven Capital | Regional trade influence, advanced institutions, durable public services and financial resilience | Academy, civic monuments, prosperous neighborhoods and preserved founding sites | 16–17 |

Stage advancement should reveal changing expectations and opportunities, not instantly grant missing buildings, skills or machinery. The capital gate must allow several economic strategies and cannot depend on one randomly absent ore.

## Appendix E — Cross-cutting quality, risk and verification

### E1. Minimum acceptance checks by system

| System | Required checks |
| --- | --- |
| Art | Alpha and silhouette edges; all directions/actions; matched portraits; scale/feet/tools; occlusion; state transitions; visual reference comparisons |
| World | Reachable entrances, usable placement, no trapped spawns; slope/cliff bounds; correct floor transitions and cutaways |
| Simulation | Same commands/seed/time produce the same result; pause and speed do not change totals; rendering visibility has no economic effect |
| Inventory | Conservation, ownership, stack split/merge, storage capacity, reservation cancellation, no negative stock or duplicate goods |
| Accounting | Exact 100:1 conversions; integer bounds; denomination-independent prices; internal account conservation; export settlement/arrears; one-time mint creation with metal consumption; no duplicate haul rewards or coin/treasury double counting |
| Mining | Seed reproducibility, reachable starting resources/trade, persistent excavation/depletion, valid composition, truthful survey uncertainty |
| Logistics/hazards | Blocked routes, full stores, power loss, pump failure, collapse isolation, evacuation/rescue and safe resumption |
| Workers | Mutually exclusive availability, bounded learning/coordination, teaching cost, persistent identity and correct assignment after reload |
| Markets | Every useful good has an opening export route; finite volume, spread/fees, no closed mint/remelt/buy/sell profit loop, changing commodity prices but fixed denominations, news confidence, in-transit settlement and reserve-policy stability |
| Persistence | Old-save migrations, malformed/unsupported saves, quota/write failure, previous-save recovery, export/import and mid-job reload |
| Scale | Representative populations and 30+ levels; long-session memory, accelerated time, camera travel, loading and minimum-device responsiveness |
| Experience | New player understands first action, next constraint, why a job stopped and how to recover; no combat or player-level system introduced accidentally |

Current `npm run typecheck`, `npm test`, `npm run build:pages`, `scripts/reference-visual-check.mjs` and `scripts/dwarf-roster-check.mjs` remain useful baseline checks. Add domain tests as the corresponding systems are implemented. Do not confuse the current 146 passing project tests with proof of future economic or geological correctness.

### E2. Principal risks and containment

| Risk | Containment |
| --- | --- |
| Large art library needs rebuilding | Phase 01 contracts and Phase 02 directional/connection proof; production masters plus derived assets |
| Detailed sprites overwhelm loading/GPU memory | Measured atlas/texture budgets, runtime derivatives, shared variants and scene-level loading |
| Asset scope consumes all development time | Final-quality opening; representative later modules first; finish later families only when their mechanics are unblocked |
| Simulation becomes an opaque spreadsheet | Contextual bottleneck explanations, staged information, physical world feedback and report drill-down |
| Financial loop is fundamentally inconsistent | Integer money, transaction ownership and exactly-once settlement before dynamic markets/private firms |
| Procedural seeds create unwinnable starts | Generation invariants, essential trade/substitutes and multi-seed scenario tests |
| Autonomy makes unsafe or unaffordable decisions | Explicit authority, budgets, safety limits, explainable actions and escalation |
| Catastrophes dominate the intended investment game | Warnings, inspections, mitigation and calibrated event frequency; tutorial protection |
| Save schema locks out future features | Early versioning, migration fixtures and separate world/content versions |
| Late population is too expensive | Separate rendering from simulation; aggregate distant activity while preserving conserved goods/cash and identities |
| Expensive fantasy industry has no useful payoff | Require an integrated application and strategic tradeoff for every advertised material |
| Founders disappear into anonymous statistics | Persistent names, apprenticeship lineage, biographies, preserved places and historical reports |

### E3. Definition of done for a development ticket

A ticket has a clear player-visible outcome, source/decision ID, dependencies, data/art/code work, validation and saved checkpoint. A feature ticket is done when the player can use it, it saves correctly, its failure states are understandable, its assets reflect actual state, and required checks pass. An art ticket additionally records provenance, approved scale/pivot/alpha, consuming IDs and screenshots. A documentation ticket needs internal consistency and working references; running the entire game test suite is unnecessary for documentation-only edits.

## Appendix F — Source coverage and first execution queue

### F1. Coverage map

The source repeats numbering in three large sections. The prefixes below distinguish them: **W** = world/mountain section (1–28); **C** = character-development section (1–32); **I** = item/economy section (1–33). Opening unnumbered material is listed separately.

| Source coverage | Roadmap destination |
| --- | --- |
| Opening world zones and full mundane/fantasy resource tables | 03–05, 09, 16; A1–A2, D1–D2 |
| Opening capability/work equation, labor constraint, first run/haul | D01–D07; 07, 12; B3 |
| Opening company/worker/town economies, wages, needs and stages | 08, 13–14, 17; D3 |
| Opening knowledge, manpower plateau, engineering, value chain and scarcity | 10–12, 15–16; B2 |
| W1–4: estate, Pit Yard, road, external missions | 03–04, 14; D1 |
| W5–10: abandoned mine, layered generation, branches and depth | 05, 09–10; D2 |
| W11–16: mixed ore, recovery, tailings, textures and surveys | 05, 09, 11; A1, B3 |
| W17–20: infrastructure space, excavation, supports and building materials | 04–05, 08–10 |
| W21–24: possessions, commerce, return loop, enormous persistent mountain | 07, 13, 15; A6 |
| W25–28: archetypes, no-combat tension, fantasy and historical transformation | 05, 09–10, 15–17 |
| C1–8: four state layers, capabilities, aptitude and hierarchical skills | 01, 12; C1 |
| C9–14: anchor dwarves, initiative, evolving orders, learned autonomy | 12; C3 |
| C15–18: experience history, training, teachers and founders | 06, 12; C1–C2 |
| C19–24: relationships, cohesion, generalists/specialists, availability and redundancy | 12–13; C3 |
| C25–30: elder, organizational identity, reports and delegation | 07, 12, 15; C2–C3 |
| C31–32: performance/learning model and organizational scale | 12, 15; B3, E1 |
| User monetary clarification: universal 100:1 coin ladder, export-funded opening and later domestic minting | 4A; D03/D06/D07; 01, 07–08, 11, 14–15 |
| I1–4: currency, liquidity, starting goods and scavenging | D02–D07; 07–08; A8 |
| I5–10: wood, minerals, stone, metal and components | 04–05, 08, 11; A1–A3, B2 |
| I11–17: hand/survey/storage/transport/support/processing/workshop equipment | 05–06, 08–11; A4–A5 |
| I18–22: household tiers, food, consumables and imports | 08, 11, 13–14; A6–A7 |
| I23–25: ownership, metadata and warehousing | 01, 08; A5, E1 |
| I26–31: imperfect ledgers, markets, speculation and reserve policies | 08, 14; B3 |
| I32–33: value-added chains and retain-versus-sell dilemma | 07–08, 11; B2–B3 |

### F2. Immediate implementation queue after roadmap review

Do not begin late-game economy code or generate hundreds of unrelated sprites next. Use this ordered queue to make visible world progress with a stable foundation:

1. **DL-001:** Record D01–D03 and D10/D19 decisions; create canonical opening manifest. Depends on roadmap review.
2. **DL-002:** Produce asset registry/validation schema and coordinate/scale sheet. Depends on DL-001.
3. **DL-003:** Prove the dwarf directional pipeline, camera behavior and tool/carry sockets using one character. Depends on DL-002.
4. **DL-004:** Finish the reference camp composition, ground/cliffs/background and lighting benchmark. Depends on DL-002–003.
5. **DL-005:** Rebuild detailed forge, storage and office/residence with damage/repair states. Depends on DL-004 and shared building contracts.
6. **DL-006:** Complete opening tools, provisions, salvage, seating and cart props from the canonical manifest. Depends on DL-002/005.
7. **DL-007:** Build the modular surface building kit and eight progression blockouts, preserving the original yard. Depends on DL-005.
8. **DL-008:** Build the shallow abandoned mine kit and one connected hand-authored test level. Depends on DL-002/004; coordinate with DL-007.
9. **DL-009:** Finish founder portraits/core animation sets and first-loop audio against the actual camp/mine scale. Depends on DL-003/006/008.
10. **DL-010:** Deliver Phase 07's complete repeatable opening loop, including goods going down the road and silver/gold returning, correcting cash/haul/work/time accounting before expansion. Depends on the earlier visual gates and Phase 01 simulation contracts.

Each session should finish with a small reviewable commit or a precise local checkpoint. Keep the source-inspired full scope above intact while completing these milestones one at a time.
