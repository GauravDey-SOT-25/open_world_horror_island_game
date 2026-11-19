/**
 * The Keeper: a restrained, gaze-aware haunting and a small trail of physical notes. The figure reuses the shipped
 * character rig, appears at a distance on walkable land, and leaves when watched or approached. The notes are props
 * rather than markers; they can be read in any order and never gate exploration.
 */
import * as THREE from 'three/webgpu';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { loadGLTF } from '../core/Assets';
import type { AudioSystem } from '../audio/Audio';
import type { Colliders } from '../world/Colliders';
import type { Heightfield } from '../world/Heightfield';
import type { Player } from '../player/Player';

interface Note {
  title: string;
  text: string;
  x: number;
  z: number;
  yaw: number;
  y: number;
  group: THREE.Group;
}

const NOTE_COPY = [
  { title: 'TIDE NOTE · EAST BEACH', text: 'The lamp went out at first light. Something answered from the water after the keeper was already home.' },
  { title: 'FIELD BOOK · JUNGLE', text: 'There are two paths back from the falls. My wet footprints used the one I never took.' },
  { title: 'FALLS · UNDATED', text: 'The bell rang beneath the pool before the rain began. The rope is still tied above the water.' },
  { title: 'FISHING LOG · VILLAGE', text: 'Three boats came in empty at dawn. Each seat was soaked through. No one remembers leaving.' },
  { title: 'WEATHER SLIP · NORTH CLIFF', text: 'On a clear night the light turns inland. When it reaches the tree line, every bird goes quiet.' },
  { title: 'KEEPER’S LOG · LAST PAGE', text: 'I keep the lamp turning toward the island. Something at sea keeps answering from behind the hill.' },
];

const NOTE_SITES = [
  // the first page is deliberately just ahead of the sunrise spawn: the interaction teaches itself in the world.
  { x: 600, z: 39, yaw: -Math.PI / 2 },
  { x: 379, z: 31, yaw: -2.5 },
  { x: 206, z: -24, yaw: 0.3 },
  { x: -429, z: 323, yaw: -1.5 },
  { x: -73, z: -555, yaw: 1.5 },
  { x: -297, z: -302, yaw: 0.7 },
];

function paperTexture(copy: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 512;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#c8bea4';
  g.fillRect(0, 0, canvas.width, canvas.height);
  // restrained paper grain and tide staining, deterministic so captures match between runs
  for (let i = 0; i < 900; i++) {
    const n = (i * 1103515245 + 12345) >>> 0;
    g.fillStyle = `rgba(69,55,38,${0.012 + (n % 11) * 0.002})`;
    g.fillRect((n % 384), ((n >>> 9) % 512), 1 + (n % 3), 1 + ((n >>> 5) % 3));
  }
  const edge = g.createLinearGradient(0, 0, canvas.width, canvas.height);
  edge.addColorStop(0, 'rgba(73,55,34,.18)');
  edge.addColorStop(0.18, 'rgba(73,55,34,0)');
  edge.addColorStop(0.78, 'rgba(73,55,34,0)');
  edge.addColorStop(1, 'rgba(73,55,34,.24)');
  g.fillStyle = edge;
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.strokeStyle = 'rgba(70,55,39,.2)';
  g.lineWidth = 2;
  g.strokeRect(13, 13, canvas.width - 26, canvas.height - 26);
  g.fillStyle = '#4c473c';
  g.font = 'italic 19px Georgia, serif';
  g.fillText(copy.slice(0, 44), 30, 62, 322);
  g.strokeStyle = 'rgba(60,54,45,.34)';
  g.lineWidth = 1;
  for (let row = 0; row < 6; row++) {
    const y = 103 + row * 42;
    const width = 248 + ((row * 37) % 74);
    g.beginPath();
    g.moveTo(30, y);
    g.lineTo(30 + width, y + (row % 2 ? 2 : -1));
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export class Haunting {
  readonly group = new THREE.Group();
  private figure = new THREE.Group();
  private model!: THREE.Object3D;
  private mixer!: THREE.AnimationMixer;
  private actions: THREE.AnimationAction[] = [];
  private materials: THREE.MeshPhysicalMaterial[] = [];
  private notes: Note[] = [];
  private pageTexture: THREE.CanvasTexture;
  private noteLayer: HTMLDivElement;
  private notePrompt: HTMLDivElement;
  private noteTitle: HTMLDivElement;
  private noteBody: HTMLParagraphElement;
  private nearest = -1;
  private openNote = -1;
  private activeTime = 0;
  private cooldown = 27;
  private showTime = 0;
  private seenTime = 0;
  private fade = 0;
  private pressure = 0;
  private presenceCount = 0;
  private firstSightingDone = false;
  private firstEncounterAt = Infinity;
  private phase: 'waiting' | 'watching' | 'leaving' = 'waiting';
  private priming = false;
  private forced = false;
  private readonly toFigure = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly candidate = new THREE.Vector3();
  private randomState = 0x7392a81d;

  constructor(
    private scene: THREE.Scene,
    private hf: Heightfield,
    private colliders: Colliders,
    private player: Player,
    private audio: AudioSystem,
  ) {
    this.group.name = 'the-keeper';
    this.figure.visible = false;
    this.figure.name = 'distant-figure';
    this.group.add(this.figure);
    this.scene.add(this.group);
    this.pageTexture = paperTexture('NOT FOR THE LIGHT');
    this.buildNotes();
    this.noteLayer = document.createElement('div');
    this.noteLayer.id = 'island-note';
    this.noteLayer.innerHTML = '<div class="paper"><div class="eyebrow"></div><p></p><div class="close">E / ESC · FOLD THE PAGE</div></div>';
    document.body.appendChild(this.noteLayer);
    this.notePrompt = document.createElement('div');
    this.notePrompt.id = 'island-note-prompt';
    this.notePrompt.textContent = 'E  ·  READ THE TIDE-WORN PAGE';
    document.body.appendChild(this.notePrompt);
    this.noteTitle = this.noteLayer.querySelector('.eyebrow')!;
    this.noteBody = this.noteLayer.querySelector('p')!;
    this.installStyle();
  }

  async load() {
    const asset = await loadGLTF('assets/character/hero.glb');
    this.model = skeletonClone(asset.scene);
    this.model.name = 'keeper-model';
    this.model.traverse((object) => {
      if (object.name === 'hero_hat') object.parent?.remove(object);
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const part = source?.name ?? mesh.name;
      const face = /head/i.test(part);
      const hair = /hair/i.test(part);
      const material = new THREE.MeshPhysicalMaterial({
        name: `keeper_${face ? 'salt-face' : hair ? 'wet-hair' : 'oilskin'}`,
        color: face ? 0x78796f : hair ? 0x111615 : 0x202826,
        roughness: face ? 0.66 : hair ? 0.31 : 0.42,
        metalness: 0.02,
        clearcoat: hair ? 0.22 : 0.12,
        clearcoatRoughness: 0.34,
        side: source?.side ?? THREE.FrontSide,
        alphaTest: source?.alphaTest ?? 0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        emissive: face ? 0x050606 : 0x000000,
        emissiveIntensity: 0.12,
      });
      material.toneMapped = true;
      this.materials.push(material);
      mesh.material = material;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = true;
    });
    this.figure.add(this.model);
    this.mixer = new THREE.AnimationMixer(this.model);
    const idle = asset.animations.find((clip) => /idle/i.test(clip.name));
    const walk = asset.animations.find((clip) => /^walk$/i.test(clip.name));
    for (const clip of [idle, walk]) {
      if (!clip) continue;
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.setEffectiveWeight(0);
      action.play();
      this.actions.push(action);
    }
    if (this.actions[0]) this.actions[0].setEffectiveWeight(1);
    this.mixer.update(0);
  }

  /** Render the otherwise hidden skinned figure during the startup shader pass, with every surface at zero alpha. */
  preparePriming() {
    this.priming = true;
    this.figure.visible = true;
    this.materials.forEach((material) => { material.opacity = 0; });
  }

  finishPriming() {
    this.figure.visible = false;
    this.priming = false;
  }

  private buildNotes() {
    const wood = new THREE.MeshStandardMaterial({ color: 0x39362d, roughness: 0.91 });
    const paper = new THREE.MeshStandardMaterial({ map: this.pageTexture, color: 0xc8bea4, roughness: 0.96, side: THREE.DoubleSide });
    NOTE_COPY.forEach((copy, index) => {
      const site = NOTE_SITES[index];
      const surface = this.colliders.surfaceAt(site.x, site.z, 500);
      const y = surface?.y ?? this.hf.height(site.x, site.z);
      const root = new THREE.Group();
      root.name = `field-note-${index + 1}`;
      root.position.set(site.x, y, site.z);
      root.rotation.y = site.yaw;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.036, 0.78, 7), wood);
      post.position.set(0, 0.39, 0);
      post.castShadow = false;
      post.receiveShadow = false;
      root.add(post);
      const page = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.34), paper);
      page.name = `note-page-${index + 1}`;
      page.position.set(0, 0.82, 0.02);
      page.rotation.x = -0.09;
      page.castShadow = false;
      page.receiveShadow = false;
      root.add(page);
      const rail = (w: number, h: number, x: number, y0: number) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.025), wood);
        bar.position.set(x, y0, 0.035);
        root.add(bar);
      };
      rail(0.022, 0.36, -0.145, 0.82);
      rail(0.022, 0.36, 0.145, 0.82);
      rail(0.31, 0.022, 0, 1.0);
      rail(0.31, 0.022, 0, 0.64);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 5, 12), new THREE.MeshStandardMaterial({ color: 0x5a3930, roughness: 0.9 }));
      tie.position.set(0, 0.58, 0.025);
      root.add(tie);
      root.traverse((o) => { if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).frustumCulled = false; } });
      this.scene.add(root);
      this.notes.push({ ...site, ...copy, y, group: root });
    });
  }

  private installStyle() {
    const style = document.createElement('style');
    style.textContent = `
      #island-note-prompt { position:fixed; left:50%; bottom:9.5%; transform:translate(-50%,8px); z-index:24; opacity:0; transition:opacity .25s,transform .25s; pointer-events:none; color:#e5ddc9; font:500 10px/1.3 ui-sans-serif,system-ui,sans-serif; letter-spacing:.2em; text-shadow:0 2px 8px #000; }
      #island-note-prompt.on { opacity:.9; transform:translate(-50%,0); }
      #island-note { position:fixed; inset:0; z-index:25; display:grid; place-items:end center; padding:0 20px 8vh; pointer-events:none; opacity:0; transition:opacity .24s; background:radial-gradient(ellipse at center,transparent 52%,rgba(4,7,6,.22) 100%); }
      #island-note.open { opacity:1; }
      #island-note .paper { box-sizing:border-box; width:min(470px,calc(100vw - 40px)); padding:24px 32px 18px; color:#292820; background:linear-gradient(145deg,#d3c9ad,#b8ad91); box-shadow:0 18px 65px rgba(0,0,0,.55); border:1px solid rgba(46,39,28,.5); transform:translateY(16px) rotate(-.5deg); transition:transform .28s cubic-bezier(.2,.7,.2,1); }
      #island-note.open .paper { transform:translateY(0) rotate(-.5deg); }
      #island-note .eyebrow { font:600 9px/1.3 ui-sans-serif,system-ui,sans-serif; letter-spacing:.18em; color:#625b4a; }
      #island-note p { margin:14px 0 20px; font:italic 18px/1.5 Georgia,"Times New Roman",serif; }
      #island-note .close { border-top:1px solid rgba(43,39,30,.24); padding-top:10px; font:500 9px/1.3 ui-sans-serif,system-ui,sans-serif; letter-spacing:.16em; color:#645e50; }
      @media (prefers-reduced-motion:reduce) { #island-note,#island-note .paper,#island-note-prompt { transition:none; } }
    `;
    document.head.appendChild(style);
  }

  private random() {
    let x = this.randomState;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.randomState = x >>> 0;
    return this.randomState / 0x100000000;
  }

  private spawn(forced: boolean, fixed?: [number, number]) {
    if (!this.model || this.player.state === 'swim') return false;
    const base = this.player.heading;
    const d = 25 + this.random() * 11;
    let bestScore = -Infinity;
    let found = !!fixed;
    if (fixed) {
      const [x, z] = fixed;
      const ground = this.colliders.surfaceAt(x, z, this.player.pos.y + 12)?.y ?? this.hf.height(x, z);
      const sea = this.player.seaAt?.(x, z) ?? -Infinity;
      this.candidate.set(x, Math.max(ground, sea + 0.2), z);
    }
    // A small, bounded search at encounter time only. Favor a shoulder sightline with firm ground and a dark
    // enough backdrop, while still rejecting offshore or cliff-edge placements.
    for (let i = 0; !fixed && i < 16; i++) {
      const side = i % 2 ? -1 : 1;
      const ring = Math.floor(i / 2);
      const angle = base + side * (0.78 + ring * 0.17 + this.random() * 0.08);
      const x = this.player.pos.x + Math.sin(angle) * d;
      const z = this.player.pos.z - Math.cos(angle) * d;
      const shore = this.hf.shoreDist(x, z);
      const n = this.hf.normal(x, z);
      const ground = this.colliders.surfaceAt(x, z, this.player.pos.y + 12)?.y ?? this.hf.height(x, z);
      if (shore < 4 || n.y < 0.76 || ground < 0.4 || ground > this.player.pos.y + 34) continue;
      const forest = this.hf.forest(x, z);
      const score = (1 - Math.abs(shore - 20) / 420) + forest * 0.36 + n.y * 0.12 - Math.max(0, ground - this.player.pos.y - 10) * 0.01;
      if (score > bestScore) {
        bestScore = score;
        this.candidate.set(x, ground, z);
        found = true;
      }
    }
    if (!found && !forced) return false;
    if (!found) {
      const angle = base + (this.random() < 0.5 ? -0.85 : 0.85);
      const x = this.player.pos.x + Math.sin(angle) * 23;
      const z = this.player.pos.z - Math.cos(angle) * 23;
      this.candidate.set(x, Math.max(0.4, this.hf.height(x, z)), z);
    }
    this.figure.position.copy(this.candidate);
    const dx = this.player.pos.x - this.candidate.x;
    const dz = this.player.pos.z - this.candidate.z;
    const heading = Math.atan2(dx, -dz);
    this.figure.rotation.set(0, Math.PI - heading, 0);
    this.figure.scale.setScalar(1.02 + this.random() * 0.04);
    this.figure.visible = true;
    this.phase = 'watching';
    this.showTime = 0;
    this.seenTime = 0;
    this.fade = 0;
    this.presenceCount++;
    this.forced = forced;
    this.audio.presenceCue(this.candidate, 0.72);
    return true;
  }

  forceSighting() {
    this.cooldown = 999;
    const appeared = this.spawn(true);
    if (appeared) this.firstSightingDone = true;
    return appeared;
  }

  clear() {
    this.phase = 'waiting';
    this.figure.visible = false;
    this.cooldown = 60;
    this.pressure = 0;
    this.audio.setPresence(0);
    return true;
  }

  private readNote(index: number) {
    this.openNote = index;
    const note = this.notes[index];
    this.noteTitle.textContent = note.title;
    this.noteBody.textContent = note.text;
    this.noteLayer.classList.add('open');
    this.notePrompt.classList.remove('on');
    // finding a page makes the island feel less empty; it also brings the next sighting a little closer
    this.cooldown = Math.min(this.cooldown, 23);
    // Give the player time to read the page before the first figure appears in the beach sightline.
    if (!this.firstSightingDone) this.firstEncounterAt = Math.min(this.firstEncounterAt, this.activeTime + 7.5);
  }

  private closeNote() {
    const wasOpen = this.openNote >= 0;
    this.openNote = -1;
    this.noteLayer.classList.remove('open');
    if (wasOpen && !this.firstSightingDone && Number.isFinite(this.firstEncounterAt)) {
      this.firstEncounterAt = this.activeTime + 3.5;
    }
  }

  update(
    dt: number,
    camera: THREE.Camera,
    weather: { night: number; rain: number },
    interact: boolean,
    dismiss: boolean,
    photoMode: boolean,
  ) {
    if (!this.priming && !photoMode) this.activeTime += dt;
    if (this.priming) return 0;
    if (this.mixer && this.phase === 'watching') {
      this.mixer.update(dt * 0.72);
      const sway = Math.sin(this.activeTime * 0.72) * 0.006;
      this.figure.rotation.z = sway;
    }
    if (dismiss || (interact && this.openNote >= 0)) this.closeNote();
    if (this.openNote < 0 && !photoMode) {
      this.nearest = -1;
      let best = 6.6;
      for (let i = 0; i < this.notes.length; i++) {
        const note = this.notes[i];
        const d = Math.hypot(this.player.pos.x - note.x, this.player.pos.z - note.z);
        if (d < best && Math.abs(this.player.pos.y - note.y) < 3.3) { best = d; this.nearest = i; }
      }
      this.notePrompt.classList.toggle('on', this.nearest >= 0);
      if (interact && this.nearest >= 0) this.readNote(this.nearest);
    } else {
      this.nearest = -1;
      this.notePrompt.classList.remove('on');
    }

    const position = this.player.pos;
    const forest = this.hf.forest(position.x, position.z);
    const terrainRisk = THREE.MathUtils.clamp(weather.night * 0.72 + weather.rain * 0.24 + forest * 0.23, 0, 1);
    this.cooldown -= dt;
    if (!this.firstSightingDone && this.openNote < 0 && !photoMode && this.player.state !== 'swim' && this.activeTime >= Math.min(24, this.firstEncounterAt)) {
      const beachDistance = Math.hypot(position.x - 596, position.z - 34);
      // At the starting beach the Keeper crosses the player's open sunrise sightline, far enough away to read as a
      // person before the player can reach him. The offset puts the silhouette in the right third of the follow view,
      // clear of the avatar. Other first encounters use the normal forest-side selection.
      const first = beachDistance < 105 ? this.spawn(true, [603, 42]) : this.spawn(true);
      if (first) {
        this.firstSightingDone = true;
        this.cooldown = 999;
      }
    }
    if (this.phase === 'waiting' && !photoMode && this.cooldown <= 0 && this.player.state !== 'swim') {
      const ready = this.activeTime > 42 && ((forest > 0.22 && this.activeTime > 48) || terrainRisk > 0.5 || this.activeTime > 170);
      if (ready && this.random() < dt * (0.012 + terrainRisk * 0.018)) {
        if (this.spawn(false)) this.cooldown = 999;
      }
    }

    let seen = false;
    let distance = Infinity;
    if (this.figure.visible) {
      this.showTime += dt;
      this.toFigure.set(this.figure.position.x - camera.position.x, this.figure.position.y + 0.95 - camera.position.y, this.figure.position.z - camera.position.z);
      distance = this.toFigure.length();
      this.forward.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      const dot = distance > 0.01 ? this.forward.dot(this.toFigure.multiplyScalar(1 / distance)) : -1;
      const projected = this.candidate.set(this.figure.position.x, this.figure.position.y + 0.95, this.figure.position.z).project(camera);
      const onScreen = projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 1.12 && Math.abs(projected.y) < 1.12;
      seen = dot > 0.78 && onScreen && distance < 100;
      this.seenTime = seen ? this.seenTime + dt : Math.max(0, this.seenTime - dt * 0.55);
      if (distance < 7 || this.seenTime > 1.65 || this.showTime > (this.forced ? 18 : 16)) this.phase = 'leaving';
      if (this.phase === 'leaving') {
        this.fade = Math.min(1, this.fade + dt / 2.2);
        if (this.actions[0]) this.actions[0].setEffectiveWeight(THREE.MathUtils.lerp(1, 0, this.fade));
        if (this.actions[1]) this.actions[1].setEffectiveWeight(this.fade > 0.16 ? Math.min(0.55, (this.fade - 0.16) * 0.8) : 0);
        if (this.fade >= 1) {
          this.figure.visible = false;
          this.phase = 'waiting';
          this.cooldown = 48 + this.random() * 45 - terrainRisk * 16;
          this.actions[0]?.setEffectiveWeight(1);
          this.actions[1]?.setEffectiveWeight(0);
        }
      }
      const visibility = this.phase === 'leaving' ? 1 - this.fade : Math.min(1, this.showTime / 1.25);
      // Let the player read the silhouette before the watched figure begins its leaving dissolve.
      const gaze = 1;
      this.materials.forEach((m) => { m.opacity = visibility * gaze; });
      this.pressure = Math.max(this.pressure, (1 - Math.min(1, distance / 52)) * (0.2 + terrainRisk * 0.7));
    }
    this.pressure = Math.max(0, this.pressure - dt * (this.figure.visible ? 0.018 : 0.045));
    this.audio.setPresence(this.pressure);
    this.noteLayer.classList.toggle('open', this.openNote >= 0);
    return this.pressure;
  }

  state() {
    return {
      phase: this.phase,
      activeTime: Math.round(this.activeTime),
      pressure: +this.pressure.toFixed(2),
      presenceCount: this.presenceCount,
      seenTime: +this.seenTime.toFixed(2),
      noteCount: this.notes.length,
      nearestNote: this.nearest >= 0 ? this.notes[this.nearest].title : null,
    };
  }
}
