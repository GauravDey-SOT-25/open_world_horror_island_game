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

## Round 3 critic review

- The separate critic reviewed all 30 low-preset captures and assembled six side-by-side boards with Unsplash island
  photos and publisher-hosted Ghost of Tsushima / Far Cry 6 screenshots. The full condition matrix, links, and concrete
  gaps are in `artifacts/critique/round-03.md`.
- The matrix scored 1.07/3. The strongest visual failures were the waterfall's broad white face, cliffs losing detail at
  sunset and night, repeated far-canopy crowns, the lighthouse beam crossing the night panorama, and an unoccupied,
  overexposed village/beach foreground.
- Performance captures showed about 50 fps at the waterfall in a frozen low-preset 30-state sweep. The separate
  adaptive 8-second rain benchmark reached 59.6 fps at scale 0.425; the capture display was emulated, not a second
  physical screen.

## Round 4 builder pass

- Replaced most of the low-preset waterfall's layered 3D noise fields with two animated, mipmapped water textures.
  The strand mask now opens irregular dark gaps and narrow white filaments across all presets; a full-size noon capture
  shows the gorge through the frayed edges instead of a uniformly bright card.
- Added a restrained blue-grey sky bounce to scanned cliff faces. The sunset and night cliff captures now retain rock
  relief and readable silhouettes. Reduced the lighthouse beam multiplier from 0.08 to 0.028; the night panorama no
  longer has the clipped diagonal stripe.
- Changed distant tree-crown proxies from circular clusters to ellipses fitted to each source tree's branch spread,
  keeping the forest silhouette varied at gallery distance.
- Fixed `contact-sheets` round selection so each round writes boards beside its own captures. `TESTING.md` documents
  `pnpm contact-sheets --round <round>`.
- `pnpm build` passes. `pnpm shots --round round-04 --note-test --encounter` saved all 30 location/condition frames,
  the note-open frame, and a first-Keeper frame. The note opens and closes with Escape; the Keeper lands at the right
  edge of the beach view (NDC x=0.753). The production capture rig used the high preset at 1920x1080 emulated output.
- On the M2 MacBook Air in headed Chrome/WebGPU, the production-default low preset's capped 8-second samples measured
  60 fps for waterfall rain (scale 0.425), 59.4 fps for waterfall night (scale 0.4), and 60 fps for lighthouse rain
  and night (scale 0.45). Waterfall night remains just under target; GPU timestamp queries were unavailable. Only the
  built-in laptop panel was connected, and the harness emulated the 1920x1080 viewport.

## Round 4 critic review

- The separate critic reviewed all 30 high-preset frames and six contact sheets against tropical photos and official
  Ghost of Tsushima / Far Cry 6 imagery. Its full comparison, 30-state findings, and 10-category scorecard are in
  `artifacts/critique/round-04.md`; mean score 1.3/3.
- The main gaps were shore and pool water depth, broad parallel surf fronts, the night lighthouse shaft reading as a
  slab, repeated far-canopy crowns, noon sand clipping, inactive village props, a faint Keeper, and no motion playback.
  High-preset capture counters came from an emulated 1920x1080 viewport, not a sustained device run.

## Round 5 builder pass

- Increased multi-scale alongshore wave timing offsets and softened the foam lace threshold so each breaker front
  bends and the white filaments taper more gradually. Warped and widened the far-canopy crown cells to reduce their
  regular rounded grid.
- Reduced dry-sand albedo by up to 30% at a high sun, raised the scanned cliff's blue-grey night fill by 23%, and
  dimmed the lighthouse shaft in clear air and when the gallery camera sits inside its volume.
- Added a portable `--out` option to `pnpm clip`, a native macOS AVFoundation H.264 fallback when ffmpeg is absent,
  and cleanup of raw frame sequences after encoding. Corrected and inspected frame orientation in both review clips.
- The updated production build passes. `pnpm shots --round round-05 --note-test --encounter` produced all 30 high
  location/condition frames plus the note and Keeper frames; the note still opens/closes and the Keeper remains visible.
  Six full-size contact strips are in `artifacts/critique/round-05/`.
- Two 1920x1080 H.264 clips are encoded in `artifacts/clips/round-05/`: a four-second sunrise shore at 30 fps and a
  five-second lighthouse night sweep at 24 fps. Extracted frames confirmed the video is upright and the beacon moves
  out of view during playback.
- On the M2 MacBook Air, selected production-default low-preset, capped eight-second samples measured 60 fps at
  waterfall/rain (scale .425), 60 at lighthouse/rain (.45), 59.6 at waterfall/night (.4), and 60 at lighthouse/night
  (.45). Frame p95 was 17.3–17.5 ms and p99 17.7 ms; GPU timestamp queries remain unavailable. Captures used the
  built-in screen with an emulated 1920x1080 viewport; no second display was connected.

## Awaiting Round 5 critic

- The next independent review should compare all six locations across sunrise, noon, sunset, night, and rain, inspect
  the two motion clips, and record specific remaining differences beside real tropical photography and AAA references.
- After the review loop finishes, make the OG image from the strongest actual game capture and set the GitHub
  repository social preview. The final response also needs five recording camera spots.
