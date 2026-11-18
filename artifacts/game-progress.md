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
  adapter, backend, CPU/GPU timings, and render counts. M2 performance remains unmeasured.

## Remaining gaps for the critic and next builder

- Later random Keeper placements use terrain sampling rather than a full occlusion query and can appear behind a
  trunk or against a weak silhouette; review them from all six locations, especially sunset, rain, and the lighthouse.
- The figure uses the traveler's base character mesh. Its new dark material treatment and animation need screenshot
  review at realistic viewing distances; a better licensed creature model or authored cloak may be warranted if the
  silhouette reads as the player.
- The note stands and sites have not yet been visually checked in game for floating, overlap, or natural approach
  direction. The lighthouse page especially needs a close inspection on the gallery.
- The M2 MacBook Air 60 fps goal has not been measured. Added work is limited to one skinned figure when present,
  six small props, a few scalar audio controls, and DOM transitions, but sustained frame-time evidence is outstanding.
- Rain, sunrise, noon, sunset, night, and all six named camera spots still need the separate screenshot comparison
  requested by the user. Build validation does not establish visual quality or end-to-end interaction quality.
- The changed water and village smoke have not yet had screenshot comparison. Cliffs, waterfall, timber, dock, boats,
  and foliage still need review against the report's photo and AAA references.
- The social preview is still the repository's existing `docs/social-preview.jpg`; replace it with the best in-game
  horror shot and set it in the GitHub repository after the critic loop selects a frame.
