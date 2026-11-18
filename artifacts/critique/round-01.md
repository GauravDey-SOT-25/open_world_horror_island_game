# Round 1 visual and gameplay critique

## Scope and evidence

Reviewed the running game in visible Chrome at `http://127.0.0.1:5230/`. Chrome's display inventory did not expose a monitor selector or physical-display topology, so I could not verify that this was the requested second screen. All review states were inspected in the available visible Chrome window.

The 30 requested combinations were loaded from boot-time URLs with `test=1`, `freeze=1`, `quality=high`, `hud=0`, and `mute=1`. The four clear-light states used `tod=sunrise|noon|sunset|night`; rain used `tod=14.5&weather=rain`. Locations were `beach`, `jungle`, `waterfall`, `village`, `cliffs`, and `lighthouse`. The visible follow camera remained active; a shot-camera mode was not accessible. CUA returned screenshot images for visual inspection, but it did not provide a way to export them as local PNG files. The evidence set is therefore the 30 inspected browser states, identified by the parameter matrix below, not a set of saved image artifacts.

| Location | Sunrise | Noon | Sunset | Night | Rain (14.5) |
|---|---:|---:|---:|---:|---:|
| Beach | inspected | inspected | inspected | inspected | inspected |
| Jungle | inspected | inspected | inspected | inspected | inspected |
| Waterfall | inspected | inspected | inspected | inspected | inspected |
| Village | inspected | inspected | inspected | inspected | inspected |
| Cliffs | inspected | inspected | inspected | inspected | inspected |
| Lighthouse | inspected | inspected | inspected | inspected | inspected |

Rain was visually checked at every location. Waterfall/night initially displayed a loader stall at “Dressing the palms 2 / 2”; reloading that exact URL cleared it in about 13.5 seconds. The lighthouse batch navigation timed out once during the night state; I reloaded lighthouse sunrise, noon, sunset, night, and rain individually and inspected them. No persistent failure was observed.

## Ranked viewer-visible gaps

1. **Ocean and shoreline water lack natural variation across all locations and times.** The ocean surface reads as broad, flat, parallel ribbons, with a conspicuously straight horizon and weak depth/color transition. The shallows do not show enough reef detail, foam breakup, or irregular shore wash. At night the water becomes almost uniformly black; the lighthouse night frame also showed a rectangular dark horizon strip. This is the largest realism gap because water occupies much of the long views and is a direct reference comparison point.

2. **The lighthouse camera does not deliver the promised island panorama.** At the lighthouse spawn, the tower wall blocks roughly the left third of the view and the camera mostly sees sea and a treetop carpet; landmarks that would establish the island's full shape are hard to read. At night the lighthouse beam turns into a large clipped white wedge across the view and character. This weakens the intended high-ground reveal and looks like a lighting/camera artifact.

3. **Rock, waterfall, and built-surface materials read as clean procedural geometry.** The cliff faces use broad planar slabs with visible fracture lines and little surface breakup; grass appears in isolated tufts. The waterfall is a continuous white sheet, while its pool stays smooth and olive colored, with repeated white ripple marks rather than broken turbulent flow and spray. Village huts, docks, and boats lack wood grain, edge wear, varied hull shapes, and small working details. Close shots make these materials especially noticeable.

4. **Lighting loses shadow and surface detail in several high-contrast conditions.** Sunrise, sunset, and night crush the player and parts of the cliffs/village into dark silhouettes. Noon exposes very bright sand and a bright lighthouse wall against crisp, hard palm shadows. Clouds look like isolated sharply edged puffs. Rain often appears as a grey band on the horizon, with weak wet-surface response and little visible splash outside the waterfall. The conditions change the palette, but do not yet change enough of the materials and atmosphere.

5. **Foliage density is present, but repeated shapes and spacing reveal the procedural pattern.** Near the jungle, foliage is dense, yet repeated silhouettes, similar plant spacing, and repeated ground leaf litter are visible. From the lighthouse, the canopy reads as evenly rounded clumps or a carpet instead of layered species and irregular treelines. The village hillside has more open sand and less plant variety than the jungle. The result is plausible at a glance but less convincing in close or elevated views.

6. **The village lacks signs of human use.** The dock and boats are clean, the huts are static, and the scene appears unoccupied: no residents, nets, loose gear, smoke, or local movement were visible in the inspected states. That emptiness is a particularly strong mismatch for a fishing village and makes its scale and purpose harder to believe.

7. **Small rendering artifacts show through in some frames.** Beach sunset and rain had faint vertical/tree-like ghosting or banding. Rain streaks were visible, but were subtle compared with the scene and did not give all locations a consistent wet look. At the waterfall in rain, streaks and base spray were visible, but the pool and main water sheet remained smooth and uniform.

8. **The character reads as a game proxy under backlighting.** The run response is visible, but the character loses surface detail in dark silhouettes and there was no verified ground-specific footstep or other animation variation during this short route.

## Location and condition notes

- **Beach:** The beach is readable at sunrise and clear times, but sand and water are smooth compared with the real shoreline references. Sunset/rain showed faint vertical or tree-like ghosting. Night water loses nearly all nearshore detail.
- **Jungle:** Dense close foliage helps conceal the distance, but repeated leaf silhouettes and ground litter patterns remain visible. The rain state adds a grey distance band without a matching wet sheen on the nearby plants/ground.
- **Waterfall:** The falls and pool are easy to locate, but the main flow is a uniform white curtain and the pool has little depth or turbulent breakup. Rain adds streaks and spray at the base; the pool still reads smooth. Waterfall/night required one reload after the palm-dressing loader stalled.
- **Village:** Hut, dock, and boat geometry is clean and lightly detailed. The scene lacks human activity and fishing clutter. Hard shadows and silhouette lighting reduce detail at sunrise/sunset/night; rain does not visibly change the structures enough.
- **Cliffs:** Large rock planes and obvious fracture lines make the cliffs look assembled from repeated slabs. Sparse isolated grass does not break up the rock scale. Long views would benefit from more layered atmospheric depth and shoreline detail.
- **Lighthouse:** Its tower blocks part of the spawned view, so the island overview does not read clearly. The high canopy and sea dominate the view; at night the beam is an oversized clipped wedge, and the sea/horizon become too dark. Noon keeps the lighthouse wall bright with hard shadows.

## Reference comparison board

Compared the in-session game views against these direct references:

- Real tropical coastline and forest, Vanuatu: [Unsplash aerial photo](https://unsplash.com/photos/aerial-view-of-lush-green-forest-meeting-turquoise-ocean-water-mVHVfs4BW4U)
- Real beach and turquoise water, Palawan: [Unsplash aerial photo](https://unsplash.com/photos/aerial-view-of-a-beach-sand-and-turquoise-ocean-Ud3M-Gs1mY0)
- AAA island foliage, coast, and lighting: [Official Ghost of Tsushima PC page](https://www.playstation.com/en-us/games/ghost-of-tsushima/pc/)
- AAA tropical island environment and cinematic lighting: [Ubisoft Toronto: Postcards from Yara](https://toronto.ubisoft.com/post-cards-from-yara/)

The real photos show irregular coast foam, underwater color and depth, and fine variation in reef, sand, and vegetation. The official game references show stronger separation between foreground, midground, and distance, more varied foliage silhouettes, textured materials at multiple scales, and atmospheric lighting that preserves detail. These references are especially useful for prioritizing the water, lighthouse panorama, and cliff/material work above.

## Play and technical checks

- **Movement route:** With the HUD visible, a short route from the beach used W to move forward, S to retreat, and D/W to move through palms. Movement responded to the inputs. I did not verify jumping, swimming, slope climbing, ground-specific footsteps, or longer-route collision.
- **Note interaction:** The HUD showed “E · READ THE TIDE-WORN PAGE” at the beach spawn, but pressing E there and after the short route did not open a page. The note prompt's DOM opacity was 0 at those positions. I did not reach a physical note stand, so reading a note remains unverified.
- **Keeper:** The Keeper was not visible at distance or while looking toward it on the short route. I could not trigger a deterministic encounter with the available browser hook. Its appearance, animation, and behavior remain unverified.
- **Renderer and preset:** The loader identified the active renderer as **ANGLE · WebGPU** and the selected preset as **high**. A separate Chrome capability check reported `navigator.gpu === true` with Apple / Metal 3 adapter information.
- **Performance:** FPS and frame times were **not measured**. The page's test hook was unavailable in the CUA page context, and the Windows/NVIDIA-specific screenshot harness was not used. Therefore this review cannot confirm a sustained 60 fps on an M2 MacBook Air. During a separate first-load observation, material priming logged 213,748 ms with a +35 count and a high memory indicator near 1.3 GB; DevTools was open in that tab, so this is a loading-risk observation, not a clean performance benchmark.
- **Console/network:** No visible console errors or warnings appeared in the checked browser pages. I could not inspect a complete network waterfall from the visible test surface. The one reproducible concern was the waterfall/night loader delay described above; it cleared after reload.

## Highest-value next fixes

1. Make the sea and shoreline use irregular, depth-aware waves, varied shallow-water color, and broken foam; preserve some readable water value at night.
2. Reposition the lighthouse spawn/camera for an unobstructed island panorama and reduce the beam exposure so it does not clip across the view.
3. Add multi-scale breakup to cliffs, waterfall flow/pool, village timber, docks, and boats; give each surface visible roughness and wear at close range.
4. Increase foliage species and silhouette variation, then add local village activity and fishing props.
5. Tune exposure, shadow lift, rain wetness, cloud softness, and aerial perspective so time/weather shifts preserve scene detail without flattening the island.


## Inspected state URLs

Each link below reproduces one of the states that was loaded and inspected. These localhost links are state references; CUA screenshots were not persisted as image files.

| Location | Sunrise | Noon | Sunset | Night | Rain |
|---|---|---|---|---|---|
| beach | [sunrise](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=beach&tod=sunrise&weather=clear) | [noon](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=beach&tod=noon&weather=clear) | [sunset](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=beach&tod=sunset&weather=clear) | [night](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=beach&tod=night&weather=clear) | [rain](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=beach&tod=14.5&weather=rain) |
| jungle | [sunrise](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=jungle&tod=sunrise&weather=clear) | [noon](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=jungle&tod=noon&weather=clear) | [sunset](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=jungle&tod=sunset&weather=clear) | [night](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=jungle&tod=night&weather=clear) | [rain](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=jungle&tod=14.5&weather=rain) |
| waterfall | [sunrise](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=waterfall&tod=sunrise&weather=clear) | [noon](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=waterfall&tod=noon&weather=clear) | [sunset](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=waterfall&tod=sunset&weather=clear) | [night](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=waterfall&tod=night&weather=clear) | [rain](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=waterfall&tod=14.5&weather=rain) |
| village | [sunrise](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=village&tod=sunrise&weather=clear) | [noon](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=village&tod=noon&weather=clear) | [sunset](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=village&tod=sunset&weather=clear) | [night](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=village&tod=night&weather=clear) | [rain](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=village&tod=14.5&weather=rain) |
| cliffs | [sunrise](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=cliffs&tod=sunrise&weather=clear) | [noon](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=cliffs&tod=noon&weather=clear) | [sunset](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=cliffs&tod=sunset&weather=clear) | [night](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=cliffs&tod=night&weather=clear) | [rain](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=cliffs&tod=14.5&weather=rain) |
| lighthouse | [sunrise](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=lighthouse&tod=sunrise&weather=clear) | [noon](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=lighthouse&tod=noon&weather=clear) | [sunset](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=lighthouse&tod=sunset&weather=clear) | [night](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=lighthouse&tod=night&weather=clear) | [rain](http://127.0.0.1:5230/?test=1&hud=0&mute=1&freeze=1&quality=high&spot=lighthouse&tod=14.5&weather=rain) |
