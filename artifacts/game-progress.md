# SALTWAKE — Game Progress

## Design brief

Keep the island an uninterrupted walking world that opens at sunrise. Exploration has no quest gates, combat, or
mandatory route. The horror is about noticing that the lighthouse and the island do not behave as they should: a
distant keeper appears at the edge of a sightline, birds thin out, and six handwritten pages gradually connect the
beach, jungle, falls, village, cliffs, and lighthouse.

## Round 1 decisions

- Added `src/horror/Haunting.ts`. It clones the already loaded Rocketbox character rig, removes the straw hat, gives it
  rain-dark materials, and reuses its idle and walk clips. It selects a shoulder position on walkable land from a
  bounded search only when a sighting begins; the figure holds at range and fades after the player watches or closes
  in. Darkness, rain, jungle, and exploration time raise the chance of a sighting.
- Added six small physical note stands and a restrained paper overlay. E reads or folds a nearby note; the notes work
  in any order and do not point to an objective or block free movement.
- Added a low synthesized pressure tone, a long spatialized cue at the apparition, and a small reduction in nearby
  birds. The cue uses Web Audio oscillators and introduces no asset dependency. Mute still controls all sound.
- Added deterministic QA calls: `__island.presence()`, `__island.clearPresence()`, and `__island.horror()`.
- The apparition materials are included in the existing startup shader-prime pass so first sighting does not need to
  compile a new character pipeline during play. The existing renderer, WebGL fallback, movement, swimming, time,
  weather, ambient mix, world, and loader remain in place.
- Reframed the page and loading title as **SALTWAKE — The Keeper**, updated repository metadata and README, credited
  the original horror work, and changed GitHub Pages deployment to `main` with relative loader paths.

## Round 2 work

- Moved the lighthouse gallery start to its north-west rim and pulled the follow camera farther back with a flatter
  pitch. Reduced the rotating beacon and lens output to keep the night beam legible without a clipped white wedge.
- Added small crossing swells and multi-scale crest timing variation to break up parallel ocean and shore ribbons.
  The ocean now fades at its tile edge, has spatial variation in reef color, and keeps a low blue-green read at night.
- Moved the first tide-worn page within a few steps of spawn and extended its interaction radius. The first Keeper
  sighting now waits until the page can be read and the loading screen is gone, then crosses the beach sightline.
- Lifted the existing village smoke slightly to improve its distance read. Existing nets, wash line, mooring ropes,
  drying fish, firewood, boats, and scattered props remain the village's signs of use; no new licensed assets were
  added.
- Documented the existing `?debug=1` / F3 overlay as a live Mac performance spot-check. It reports frame percentiles,
  adapter, backend, CPU/GPU timings, and render counts.

## Round 3 builder pass

- Kept the beach Keeper on dry sand, clear of the avatar and tide note. A fresh-session screenshot confirms the
  first encounter is visible in the right side of the beach view and waits until after the note can be read.
- Pulled the lighthouse panorama above and outside the lantern structure, so the island and sea fill the view. Reduced
  beacon output to keep the night sweep visible without the previous bright band across the frame.
- Added low-preset dynamic resolution: it starts at 0.5 and drops in steps to 0.4 after sustained frame-budget misses,
  then recovers slowly in lighter areas. This preserves the full vegetation density instead of thinning the island.
- Captured all 30 production views (six locations x sunrise, noon, sunset, night and rain) on the built-in Mac display
  with a 1920x1080 emulated viewport; no external second display was connected. `--note-test` confirmed E opens the
  tide page and Escape closes it. `--encounter` reloads to a fresh beach session and captures the intended first
  sighting at `[603, 0.91, 42]`.
- `pnpm build` passes. On the M2 MacBook Air in headed Chrome/WebGPU, the final capped 8-second rain run measured 59.6
  fps at the waterfall (final render scale 0.425, frame p95 17.4 ms, p99 17.7 ms) and 60 fps at the lighthouse
  (scale 0.425, p95 17.6 ms, p99 17.7 ms). These are close to the 60 fps goal, with occasional frames over 16.7 ms; the GPU
  timestamp query was unavailable in this browser, so GPU time is recorded as 0.

## Awaiting Round 3 critic and next builder

- The independent critic still needs to compare the captures against licensed tropical-island photography and top
  open-world game references, with exact visual differences recorded by place and condition.
- Later random Keeper placements need review for tree/building occlusion and silhouette readability. The figure still
  uses the base traveler rig; improve or replace it if the critic finds that it reads as the player.
- The tide page and all five other note sites need close inspection in the authored world for floating, overlap, and
  natural approach direction, especially the lighthouse page.
- Review the waterfall's nearly white plume, night exposure, cliff/player placement, village scale, foliage silhouettes,
  water surface, lighting and shadow quality against the critic's references.
- Choose the strongest final in-game frame, create the OG image from it, and set that image as the GitHub social preview.
