/**
 * Screenshot runner for the critic: every spot x condition at a true 1920x1080, from the production build (preview)
 * by default, in installed Chrome (fullscreen on the primary display when possible). Writes <spot>_<condition>.jpg and
 * report.json to artifacts/critique/<round>/captures/ by default; --out selects another directory.
 *
 *   pnpm shots --round round-01 [--spots beach,jungle] [--conditions sunrise,noon,sunset,night,rain]
 *              [--view shot|follow] [--dev] [--quality high] [--settle 1500] [--out path] [--q url-params] [--encounter] [--note-test]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argv, checkConditions, CONDITIONS, ensureServer, launch } from './lib/browser';

const a = argv();
const round = a.get('round', 'dev');
const spots = a.get('spots', 'beach,jungle,waterfall,village,cliffs,lighthouse').split(',');
const conditions = a.get('conditions', 'sunrise,noon,sunset,night,rain').split(',');
const view = a.get('view', 'shot');
const quality = a.get('quality', 'high');
const settle = Number(a.get('settle', '1500'));
const outDir = a.has('out') ? resolve(a.get('out', '')) : join('artifacts', 'critique', round, 'captures');
const extra = a.get('q', '');
const encounter = a.has('encounter');
const noteTest = a.has('note-test');
mkdirSync(outDir, { recursive: true });

const COND = CONDITIONS;
checkConditions(conditions);

const server = await ensureServer(a.has('dev') ? 'dev' : 'preview');
const L = await launch();
const results: unknown[] = [];
const t0 = Date.now();
try {
  await L.page.goto(`${server.url}?test=1&hud=0&mute=1&freeze=1&quality=${quality}&spot=${spots[0]}${extra ? `&${extra}` : ''}`, { waitUntil: 'domcontentloaded' });
  await L.page.waitForFunction(() => {
    const w = window as unknown as { __island?: { error?: string; ready?: unknown } };
    return !!w.__island && (!!w.__island.error || typeof w.__island.ready === 'function');
  }, null, { timeout: 180000 });
  const err = await L.page.evaluate(() => (window as unknown as { __island: { error?: string } }).__island.error ?? null);
  if (err) throw new Error(err);
  await L.page.evaluate(() => (window as unknown as { __island: { ready: () => Promise<boolean> } }).__island.ready());
  const loadMs = Date.now() - t0;
  const adapter = await L.page.evaluate(() => (window as unknown as { __island: { adapter: () => unknown } }).__island.adapter());
  console.log(`ready in ${loadMs} ms on ${JSON.stringify(adapter)}`);
  for (const cond of conditions) {
    const c = COND[cond];
    if (!c) {
      console.log('unknown condition', cond);
      continue;
    }
    for (const spot of spots) {
      const staged = await L.page.evaluate(async ([s, tod, w, v, st]) => {
        const api = (window as unknown as { __island: { stage: (o: unknown) => Promise<unknown> } }).__island;
        return api.stage({ spot: s, tod, weather: w, camera: v === 'shot' ? 'shot' : 'follow', worldTime: 1000, settleMs: st });
      }, [spot, c.tod, c.weather, view, settle] as const);
      const file = join(outDir, `${spot}_${cond}.jpg`);
      await L.page.screenshot({ path: file, type: 'jpeg', quality: 92 });
      const stats = await L.page.evaluate(() => (window as unknown as { __island: { stats: () => unknown } }).__island.stats());
      results.push({ spot, condition: cond, file, staged, stats });
      console.log(`${spot}_${cond}.jpg`);
    }
  }
  if (noteTest) {
    await L.page.evaluate(async () => {
      const api = (window as unknown as { __island: { stage: (o: unknown) => Promise<unknown> } }).__island;
      await api.stage({ spot: 'beach', tod: 'sunrise', weather: 'clear', camera: 'follow', worldTime: 1000, settleMs: 700 });
    });
    await L.page.waitForFunction(() => {
      const api = (window as unknown as { __island?: { horror?: () => { nearestNote: string | null } } }).__island;
      return !!api?.horror?.().nearestNote;
    }, null, { timeout: 10000 });
    await L.page.keyboard.press('e');
    await L.page.waitForFunction(() => document.querySelector('#island-note')?.classList.contains('open'), null, { timeout: 5000 });
    const noteTitle = await L.page.locator('#island-note .eyebrow').textContent();
    await L.page.waitForTimeout(350);
    const file = join(outDir, 'beach_note_open.jpg');
    await L.page.screenshot({ path: file, type: 'jpeg', quality: 92 });
    await L.page.keyboard.press('Escape');
    await L.page.waitForFunction(() => !document.querySelector('#island-note')?.classList.contains('open'), null, { timeout: 5000 });
    results.push({ spot: 'beach', condition: 'note-interaction', noteTitle, opened: true, closedWithEscape: true, file });
    console.log(`beach_note_open.jpg · ${noteTitle} · Escape closed`);
  }
  if (encounter) {
    // Fresh state makes the first-encounter capture deterministic even after the 30-view sweep advances world time.
    await L.page.goto(`${server.url}?test=1&hud=0&mute=1&freeze=1&quality=${quality}&spot=beach`, { waitUntil: 'domcontentloaded' });
    await L.page.waitForFunction(() => typeof (window as unknown as { __island?: { ready?: unknown } }).__island?.ready === 'function', null, { timeout: 180000 });
    await L.page.evaluate(() => (window as unknown as { __island: { ready: () => Promise<boolean> } }).__island.ready());
    await L.page.evaluate(async () => {
      const api = (window as unknown as { __island: { stage: (o: unknown) => Promise<unknown> } }).__island;
      await api.stage({ spot: 'beach', tod: 'sunrise', weather: 'clear', camera: 'follow', worldTime: null, settleMs: 800 });
    });
    await L.page.waitForFunction(() => {
      const api = (window as unknown as { __island?: { horror?: () => { presenceCount: number } } }).__island;
      return (api?.horror?.().presenceCount ?? 0) > 0;
    }, null, { timeout: 40000 });
    await L.page.waitForTimeout(700);
    const reveal = await L.page.evaluate(() => {
      const api = (window as unknown as { __island: { ctx: any; horror: () => unknown } }).__island;
      const ctx = api.ctx;
      const camera = ctx.engine.camera;
      const figure = ctx.haunting.group.children.find((o: { name: string }) => o.name === 'distant-figure');
      const Vec3 = camera.position.constructor as new (x: number, y: number, z: number) => { project(c: unknown): { x: number; y: number; z: number } };
      const f = new Vec3(figure.position.x, figure.position.y + 0.95, figure.position.z).project(camera);
      const player = ctx.player.obj;
      const p = new Vec3(player.pos.x, player.pos.y + 1.15, player.pos.z).project(camera);
      return {
        state: api.horror(), visible: figure.visible,
        figureNdc: { x: +f.x.toFixed(3), y: +f.y.toFixed(3), z: +f.z.toFixed(3) },
        playerNdc: { x: +p.x.toFixed(3), y: +p.y.toFixed(3), z: +p.z.toFixed(3) },
        lateralNdc: +(f.x - p.x).toFixed(3),
        figurePosition: figure.position.toArray().map((n: number) => +n.toFixed(2)),
      };
    });
    const file = join(outDir, 'beach_first_keeper.jpg');
    await L.page.screenshot({ path: file, type: 'jpeg', quality: 92 });
    results.push({ spot: 'beach', condition: 'first-keeper', file, reveal });
    console.log(`beach_first_keeper.jpg · ${JSON.stringify(reveal)}`);
  }
  const placement = { display: L.display.name, size: [L.display.width, L.display.height], viewport: L.viewportMode };
  writeFileSync(join(outDir, 'report.json'), JSON.stringify({ round, view, quality, loadMs, adapter, placement, results, console: L.console.slice(0, 200), at: new Date().toISOString() }, null, 1));
  console.log(`${results.length} shots in ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${outDir}`);
  if (L.console.length) console.log('console:\n' + L.console.filter((l) => !l.includes('powerPreference')).slice(0, 15).join('\n'));
} finally {
  try {
    await L.browser.close();
  } finally {
    server.stop();
  }
}
