import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {RoomEnvironment} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/utils/BufferGeometryUtils.js';

const DUR = 25, ARMS = 8, N = 28, $ = id => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* ---------- timeline ---------- */
const TR = {
  py:     [[0,-5.2],[2.6,.25],[22.1,.25],[25,7.6]],
  fol:    [[0,.8],[2.6,0],[21.9,0],[23,.62],[24.2,.62],[25,.25]],
  tilt:   [[0,.38],[2.6,0],[22.1,0],[23.2,.3],[25,.42]],
  roll:   [[0,-.22],[2.6,0],[22.1,0],[23.2,.18]],
  curl:   [[0,.06],[1.5,.08],[3,1],[21.9,1],[23,.05],[25,.05]],
  jet:    [[0,1],[1.7,1],[2.5,0],[21.9,0],[22.4,1],[25,1]],
  dist:   [[0,9.5],[2.7,14],[3.4,14],[4.3,7.2],[5.6,7.2],[6.5,13],[9.3,13],[10.1,14.2],[12.1,14.2],[12.9,11.6],[14.9,11.6],[15.9,18],[20.3,18],[21,14.6],[22,14.6],[23,9.8],[25,9.8]],
  az:     [[0,.55],[2.7,0],[3.4,0],[4.3,-.62],[5.6,-.18],[6.5,.3],[9.3,-.28],[10.1,.5],[12.1,.72],[12.9,0],[14.9,.3],[15.9,0],[22,0],[23,-.5],[25,-.3]],
  turn:   [[15.9,0],[20.4,5.76],[21.4,6.2832],[25,6.2832]],
  el:     [[0,.12],[2.7,.06],[5.6,.1],[6.5,.34],[9.3,.3],[10.1,.12],[12.1,.1],[12.9,-.82],[14.9,-.72],[15.9,.1],[22,.1],[23,.02]],
  ty:     [[0,-.3],[2.7,-.75],[3.4,-.75],[4.3,.45],[5.6,.45],[6.5,.95],[9.3,.95],[10.1,-.75],[12.1,-.75],[12.9,-.5],[14.9,-.5],[15.9,.2],[20.3,.2],[21,-.65],[22,-.65],[23,.2],[25,.5]],
  tx:     [[0,0],[3.4,0],[4.3,.35],[5.6,.35],[6.5,0],[10.1,0],[10.1,-.8],[12.1,-.8],[12.9,0]],
  optic:  [[3.5,0],[4.4,1],[5.3,1],[5.9,0]],
  petal:  [[5.8,0],[6.7,.92],[9.2,.92],[10,0],[15.9,0],[16.9,.6],[19.4,.6],[20.5,0]],
  pump:   [[6.7,0],[7.8,1],[9.1,1],[9.9,0],[15.9,0],[16.9,1],[19.4,1],[20.5,0]],
  apart:  [[10,0],[10.9,1],[11.8,1],[12.5,0]],
  siphon: [[12.9,0],[13.7,1],[14.7,1],[15.4,0]],
  expl:   [[15.9,0],[17.3,1],[19.2,1],[20.6,0]],
};
const sample = (k, t) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) {
    const a = k[i - 1], b = k[i];
    return b[0] === a[0] ? b[1] : mix(a[1], b[1], ease((t - a[0]) / (b[0] - a[0])));
  }
  return k[k.length - 1][1];
};
const SECT = [
  {t:0,    m:'JETTING',     s:'PITCH +22° · 2.3 M/S', b:'HERO',   st:'JETTING',     log:'INBOUND · JET ASSIST',    iso:'HERO',   tag:'TRAILING'},
  {t:2.6,  m:'HOLDING',     s:'STATION KEEPING',      b:'HERO',   st:'HOLDING',     log:'INBOUND · JET ASSIST',    iso:'HERO',   tag:'COILING'},
  {t:3.3,  m:'OPTICS OPEN', s:'OPTIC · 86% APART',    b:'OPTICS', st:'OPTICS OPEN', log:'OPERATOR · ISOLATE OPTICS',iso:'OPTICS',tag:'COILING', sub:0, lab:'optic', hot:1},
  {t:5.7,  m:'BELL OPEN',   s:'8 PETALS · 92% OPEN',  b:'BELL',   st:'BELL OPEN',   log:'OPERATOR · ISOLATE BELL',  iso:'BELL',  tag:'COILING', sub:1, lab:'bell', hot:1},
  {t:7.5,  m:'PUMP OUT',    s:'CORE · SPINNING FREE', b:'PUMP',   st:'PUMP OUT',    log:'OPERATOR · ISOLATE PUMP',  iso:'PUMP',  tag:'COILING', sub:2, lab:'pump', hot:1},
  {t:9.9,  m:'ARM R2 APART',s:'14 OF 28 LINKS',       b:'ARM R2', st:'ARM R2 APART',log:'OPERATOR · ISOLATE ARM R2',iso:'ARM R2',tag:'COILING', sub:3, lab:'arm', hot:1},
  {t:12.7, m:'SIPHON OPEN', s:'6 FLAPS · 84% APART',  b:'SIPHON', st:'SIPHON OPEN', log:'OPERATOR · ISOLATE SIPHON',iso:'SIPHON',tag:'COILING', sub:4, lab:'siphon', hot:1},
  {t:15.8, m:'TEARDOWN',    s:'TURNTABLE · 98% APART',b:null,     st:'TEARDOWN',    log:'OPERATOR · EXPLODED ON',   iso:'ALL',   tag:'DETACHED',lab:'all', hot:1, det:1, on:['LABELS','EXPLODED','TURNTABLE']},
  {t:19.3, m:'REASSEMBLY',  s:'TURNTABLE · RETURNING',b:null,     st:'REASSEMBLY',  log:'OPERATOR · EXPLODED OFF',  iso:'ALL',   tag:'COILING', hot:1, on:['TURNTABLE']},
  {t:21,   m:'HOLDING',     s:'STATION KEEPING',      b:'HERO',   st:'HOLDING',     log:'OPERATOR · EXPLODED OFF',  iso:'HERO',  tag:'COILING'},
  {t:22,   m:'DEPARTING',   s:'PITCH +40° · RELEASE', b:'HERO',   st:'DEPARTING',   log:'OPERATOR · HERO · RELEASE',iso:'HERO',  tag:'TRAILING', on:['JET WAKE']},
];
SECT[0].on = ['JET WAKE'];
const secAt = t => { let s = SECT[0]; for (const x of SECT) if (t >= x.t) s = x; return s; };

/* ---------- renderer ---------- */
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.setClearColor(0, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .62;
const camera = new THREE.PerspectiveCamera(26, 1, .1, 120);

const key = new THREE.DirectionalLight(0xffffff, 2.3);
key.position.set(5, 11, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, {left:-8, right:8, top:8, bottom:-8, near:1, far:40});
key.shadow.bias = -.0006; key.shadow.normalBias = .02; key.shadow.radius = 5;
scene.add(key, key.target);
const fill = new THREE.DirectionalLight(0xbdeee9, .7); fill.position.set(-7, -2, 5); scene.add(fill);

/* ---------- materials ---------- */
const ceramic = new THREE.MeshPhysicalMaterial({color:0xf6f8f7, roughness:.34, metalness:0, clearcoat:.7, clearcoatRoughness:.22});
const dark = new THREE.MeshStandardMaterial({color:0x10211f, roughness:.34, metalness:.7});
const steel = new THREE.MeshStandardMaterial({color:0x9db3b1, roughness:.3, metalness:.9});
const coral = new THREE.MeshPhysicalMaterial({color:0xff5536, roughness:.32, clearcoat:.5, emissive:0xff3a18, emissiveIntensity:.14});
const aqua = new THREE.MeshPhysicalMaterial({color:0x37cdbf, roughness:.25, clearcoat:.7, emissive:0x17b5a6, emissiveIntensity:.12});
const rivet = new THREE.MeshStandardMaterial({color:0x1c2d2c, roughness:.45, metalness:.5});
const glass = new THREE.MeshPhysicalMaterial({color:0xd6f5f1, roughness:.06, metalness:0, transparent:true, opacity:.2, depthWrite:false, side:THREE.DoubleSide, envMapIntensity:1.5, specularIntensity:1});
glass.onBeforeCompile = s => {
  s.fragmentShader = s.fragmentShader.replace('#include <opaque_fragment>',
    'float fr=pow(1.-abs(dot(normalize(vViewPosition),normal)),2.2);diffuseColor.a=mix(.1,.72,fr);outgoingLight+=vec3(.25,.75,.72)*fr*.3;\n#include <opaque_fragment>');
};
const tealGlass = new THREE.MeshPhysicalMaterial({color:0x0f6a68, roughness:.16, clearcoat:1});
const shadowed = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const nonIdx = g => { const x = g.index ? g.toNonIndexed() : g; x.deleteAttribute('uv2'); return x; };
const merge = l => mergeGeometries(l.map(nonIdx));
const place = (g, p, q, s) => g.clone().applyMatrix4(new THREE.Matrix4().compose(p, q || new THREE.Quaternion(), s || new THREE.Vector3(1, 1, 1)));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- bell ---------- */
const R = 1.34, H = 1.62;
const prof = u => { const a = u * Math.PI / 2; return [R * Math.cos(a) ** .82, H * Math.sin(a)]; };      // u 0 rim → 1 apex
const shell = (off, u0 = 0, u1 = 1) => { const p = []; for (let i = 0; i <= 26; i++) { const [r, y] = prof(mix(u0, u1, i / 26)); p.push(new THREE.Vector2(r + off, y + off * .6)); } return p; };
const sector = (off, a, b, u0, u1) => new THREE.LatheGeometry(shell(off, u0, u1), Math.max(3, Math.round((b - a) * 16)), a, b - a);
const onShell = (u, phi, off = 0) => { const [r, y] = prof(u); const s = Math.sin(phi), c = Math.cos(phi); return V((r + off) * s, y + off * .6, (r + off) * c); };

const jf = new THREE.Group(); scene.add(jf);
const inner = new THREE.Group(); jf.add(inner);
const anchors = {};
const anchor = (name, parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); anchors[name] = o; };
const petals = [];
const rivetG = new THREE.SphereGeometry(.0105, 8, 6);
for (let i = 0; i < 8; i++) {
  const w = Math.PI / 4, a = i * w - w / 2, b = a + w, mid = i * w, hinge = onShell(0, mid);
  const piv = new THREE.Group(); piv.position.copy(hinge);
  const box = new THREE.Group(); box.position.copy(hinge).multiplyScalar(-1); piv.add(box);
  piv.rotation.order = 'YXZ'; piv.rotation.y = 0;
  const pane = new THREE.Mesh(sector(0, a + .03, b - .03, .02, .9), glass); pane.renderOrder = 5; box.add(pane);
  // ceramic: ribs at both edges, a rim band, a shoulder plate and a small tag
  const white = [sector(.016, a, a + .075, 0, .94), sector(.016, b - .075, b, 0, .94), sector(.02, a, b, 0, .16), sector(.02, a + .1, b - .1, .72, .86)];
  const dots = [];
  for (let k = 0; k < 11; k++) { const u = .04 + k * .082; dots.push(place(rivetG, onShell(u, a + .038, .03)), place(rivetG, onShell(u, b - .038, .03))); }
  for (let k = 0; k < 6; k++) dots.push(place(rivetG, onShell(.13, mix(a + .14, b - .14, k / 5), .036)));
  box.add(shadowed(new THREE.Mesh(merge(white), ceramic)), new THREE.Mesh(merge(dots), rivet));
  const seam = new THREE.Mesh(sector(.026, a + .05, b - .05, .165, .178), dark); box.add(seam);
  const tagG = i % 2 ? sector(.03, mid - .06, mid + .06, .06, .105) : sector(.03, mid - .14, mid - .05, .06, .105);
  box.add(new THREE.Mesh(tagG, i % 2 ? aqua : coral));
  inner.add(piv);
  petals.push({piv, tan:V(Math.cos(mid), 0, -Math.sin(mid)), rad:V(Math.sin(mid), 0, Math.cos(mid)), box});
}
anchor('petal', petals[1].box, ...onShell(.45, Math.PI / 4, .05).toArray());

const capG = new THREE.Group(); inner.add(capG);
{
  const y0 = prof(.92)[1];
  capG.add(shadowed(new THREE.Mesh(new THREE.LatheGeometry([[.001,.13],[.12,.125],[.27,.05],[.3,0],[.27,-.05],[.001,-.05]].map(p => new THREE.Vector2(...p)), 32), ceramic)));
  capG.add(new THREE.Mesh(new THREE.TorusGeometry(.2, .016, 8, 40).rotateX(Math.PI / 2).translate(0, .075, 0), coral));
  capG.position.y = y0;
}

// fixed chassis: rim hoop, spokes, arm hub
const chassis = new THREE.Group(); inner.add(chassis);
{
  const list = [new THREE.TorusGeometry(R * .9, .05, 10, 72).rotateX(Math.PI / 2).translate(0, .02, 0),
    new THREE.LatheGeometry([[.15,.34],[.62,.3],[.92,.1],[1.02,-.04],[.9,-.2],[.5,-.3],[.2,-.3]].map(p => new THREE.Vector2(...p)), 48)];
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; list.push(place(new THREE.CylinderGeometry(.022, .022, .86, 8).rotateZ(Math.PI / 2), V(Math.sin(a) * .7, .12, Math.cos(a) * .7), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a - Math.PI / 2, 0)))); }
  chassis.add(shadowed(new THREE.Mesh(merge(list), dark)));
  chassis.add(new THREE.Mesh(new THREE.TorusGeometry(1.03, .022, 8, 72).rotateX(Math.PI / 2).translate(0, -.03, 0), aqua));
  chassis.add(new THREE.Mesh(new THREE.TorusGeometry(.6, .016, 8, 60).rotateX(Math.PI / 2).translate(0, -.285, 0), coral));
}
const gearShape = (r0, r1, hole, teeth) => {
  const s = new THREE.Shape(); const n = teeth * 4;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, r = (i % 4 < 2) ? r1 : r0; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h); return s;
};
// pump core
const pump = new THREE.Group(); inner.add(pump);
const pumpSpin = new THREE.Group(); pump.add(pumpSpin);
const pistons = [];
{
  pump.add(shadowed(new THREE.Mesh(new THREE.LatheGeometry([[.001,-.35],[.34,-.35],[.38,-.28],[.38,-.1],[.5,-.06],[.5,.04],[.36,.08],[.36,.46],[.42,.5],[.42,.58],[.26,.68],[.001,.7]].map(p => new THREE.Vector2(...p)), 48), dark)));
  const coils = []; for (let i = 0; i < 6; i++) coils.push(new THREE.TorusGeometry(.385, .017, 8, 48).rotateX(Math.PI / 2).translate(0, .13 + i * .055, 0));
  pump.add(new THREE.Mesh(merge(coils), aqua));
  const gear = new THREE.Mesh(new THREE.ExtrudeGeometry(gearShape(.54, .62, .4, 20), {depth:.06, bevelEnabled:false}).rotateX(Math.PI / 2).translate(0, .02, 0), coral);
  pumpSpin.add(shadowed(gear));
  const g = new THREE.CylinderGeometry(.038, .038, .3, 10), head = new THREE.CylinderGeometry(.06, .06, .05, 12);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, x = Math.cos(a) * .47, z = Math.sin(a) * .47, o = new THREE.Group();
    o.position.set(x, .22, z); o.add(shadowed(new THREE.Mesh(g, steel)));
    const h = new THREE.Mesh(head, ceramic); h.position.y = .17; o.add(h);
    pumpSpin.add(o); pistons.push(o);
  }
  const fins = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; fins.push(place(new THREE.BoxGeometry(.13, .22, .012), V(Math.cos(a) * .45, -.23, Math.sin(a) * .45), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, 0)))); }
  pumpSpin.add(new THREE.Mesh(merge(fins), steel));
  pump.position.y = .35;
}
anchor('pump', pump, .5, .35, .1);
// optic
const optic = new THREE.Group(); inner.add(optic);
const opHousing = new THREE.Group(), opRing = new THREE.Group(), opLens = new THREE.Group(), iris = [];
{
  optic.position.set(0, .58, .66); optic.add(opHousing, opRing, opLens);
  const cyl = new THREE.CylinderGeometry(.34, .4, .36, 40).rotateX(Math.PI / 2);
  opHousing.add(shadowed(new THREE.Mesh(cyl, dark)));
  const g = new THREE.Mesh(new THREE.ExtrudeGeometry(gearShape(.4, .46, .3, 18), {depth:.07, bevelEnabled:false}), coral);
  opRing.add(shadowed(g)); opRing.add(new THREE.Mesh(new THREE.TorusGeometry(.3, .022, 10, 48).translate(0, 0, .08), aqua));
  const blade = new THREE.Shape(); blade.moveTo(0, 0); blade.lineTo(.2, -.05); blade.quadraticCurveTo(.3, .1, .12, .22); blade.lineTo(0, 0);
  const bg = new THREE.ExtrudeGeometry(blade, {depth:.008, bevelEnabled:false});
  for (let i = 0; i < 8; i++) { const piv = new THREE.Group(); const a = i / 8 * Math.PI * 2; piv.position.set(Math.cos(a) * .25, Math.sin(a) * .25, .18); piv.rotation.z = a + 1.9; piv.add(new THREE.Mesh(bg, steel)); opHousing.add(piv); iris.push(piv); }
  opLens.add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .23, .14, 40).rotateX(Math.PI / 2), dark));
  const lens = new THREE.Mesh(new THREE.SphereGeometry(.19, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, .7).translate(0, 0, .05), new THREE.MeshPhysicalMaterial({color:0x050e10, roughness:.05, metalness:.3, clearcoat:1, envMapIntensity:2}));
  opLens.add(lens); opLens.add(new THREE.Mesh(new THREE.TorusGeometry(.2, .012, 8, 40).translate(0, 0, .07), coral));
}
anchor('optRim', opRing, .3, .2, .08); anchor('optIris', opHousing, -.05, -.2, .2); anchor('optLens', opLens, .1, -.1, .15);
// siphon
const siphon = new THREE.Group(); siphon.position.y = -.32; inner.add(siphon);
const slv = [], flaps = [];
{
  const mk = (r0, r1, m) => { const g = new THREE.Group(); g.add(shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, .24, 32, 1, true), m))); g.add(new THREE.Mesh(new THREE.TorusGeometry(r1, .016, 8, 36).rotateX(Math.PI / 2).translate(0, -.12, 0), aqua)); return g; };
  [mk(.3, .26, ceramic), mk(.25, .21, dark), mk(.2, .16, ceramic)].forEach(g => { siphon.add(g); slv.push(g); });
  const s = new THREE.Shape(); s.moveTo(-.09, 0); s.lineTo(.09, 0); s.lineTo(.05, -.24); s.lineTo(-.05, -.24); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth:.014, bevelEnabled:false}).translate(0, 0, .15);
  for (let i = 0; i < 6; i++) { const y = new THREE.Group(); y.rotation.y = i / 6 * Math.PI * 2; const x = new THREE.Group(); x.position.z = 0; const m = shadowed(new THREE.Mesh(g, i % 2 ? coral : ceramic)); x.add(m); y.add(x); slv[2].add(y); y.position.y = -.12; flaps.push(x); }
}
anchor('sipA', siphon, .24, -.2, .1); anchor('sipB', slv[2], -.12, -.2, .1);

/* ---------- arms ---------- */
const sleeveP = [[0,-.41],[.88,-.41],[.97,-.37],[1,-.31],[1,.31],[.97,.37],[.88,.41],[0,.41]].map(p => new THREE.Vector2(...p));
const G = {
  sleeve: new THREE.LatheGeometry(sleeveP, 24),
  collar: new THREE.CylinderGeometry(.74, .74, .95, 18, 1, true),
  ring: new THREE.TorusGeometry(1.0, .022, 6, 28).rotateX(Math.PI / 2).translate(0, .26, 0),
  window: new THREE.BoxGeometry(.3, .24, .06).translate(0, 0, .985),
  tagb: new THREE.BoxGeometry(.14, .5, .05).translate(.56, 0, .84),
  struts: merge([0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + .6; return new THREE.CylinderGeometry(.05, .05, 1.1, 6).translate(Math.cos(a) * .5, 0, Math.sin(a) * .5); })),
  bolts: merge(Array.from({length:12}, (_, i) => { const a = i / 12 * Math.PI * 2; return new THREE.SphereGeometry(.05, 6, 5).translate(Math.sin(a) * 1, i % 2 ? -.22 : .22, Math.cos(a) * 1); })),
};
const inst = (g, m, cast = true) => { const x = new THREE.InstancedMesh(g, m, ARMS * N); x.frustumCulled = false; x.castShadow = cast; x.receiveShadow = cast; x.instanceMatrix.setUsage(THREE.DynamicDrawUsage); jf.add(x); return x; };
const P = {sleeve:inst(G.sleeve, ceramic), collar:inst(G.collar, dark), ring:inst(G.ring, aqua, false), window:inst(G.window, tealGlass, false), tagb:inst(G.tagb, coral, false), struts:inst(G.struts, steel), bolts:inst(G.bolts, rivet, false)};
const armTip = []; for (let a = 0; a < ARMS; a++) armTip.push(new THREE.Vector3());
const armPt = V(0, 0, 0);
const _p = V(0, 0, 0), _d = V(0, 0, 0), _q = new THREE.Quaternion(), _q0 = new THREE.Quaternion(), _qk = new THREE.Quaternion(), _s = V(1, 1, 1), _o = V(0, 0, 0), _m = new THREE.Matrix4(), _b = new THREE.Matrix4(), _x = V(0, 0, 0), _y = V(0, 0, 0), _z = V(0, 0, 0);
const AX = {x:V(1, 0, 0), y:V(0, 1, 0), z:V(0, 0, 1)}, ZERO = V(0, 0, 0);
const setPart = (mesh, idx, ox, oy, oz, sx, sy, sz, on = true) => {
  if (!on) { _m.makeScale(0, 0, 0); mesh.setMatrixAt(idx, _m); return; }
  _o.set(ox, oy, oz).applyQuaternion(_q).add(_p); _s.set(sx, sy, sz); _m.compose(_o, _q, _s); mesh.setMatrixAt(idx, _m);
};
const curlOut = new Float32Array(ARMS);
function poseArms(S, t) {
  for (let a = 0; a < ARMS; a++) {
    const phi = (a + .5) * Math.PI / 4, ev = a % 2 === 0, sn = Math.sin(phi), cs = Math.cos(phi);
    const ap = a === 2 ? S.apart : 0, e = S.expl;
    const a0 = mix(1.42, ev ? .34 : .9, S.curl);
    const c = Math.cos(a0), s = Math.sin(a0);
    _y.set(sn * c, -s, cs * c); _z.set(-cs, 0, sn); _x.crossVectors(_y, _z);
    _b.makeBasis(_x, _y, _z); _q.setFromRotationMatrix(_b);
    _p.set(sn * .78, -.24, cs * .78);
    const pulse = S.pulse;
    const hair = (ev ? 1 : .8) * (.92 + hash(a) * .18), sp = ev ? 1 : -1;
    let coil = 0;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), f = mix(1, .26, u ** 1.15) * (ev ? 1 : .9);
      const L = .33 * f, r = .2 * f;
      const wave = .05 * Math.sin(5.5 * u - t * 1.5 + a * 1.7) * (.35 + u);
      const kHold = (ev ? .07 : .04) + .78 * u ** 3.6 * hair + .075 * Math.sin(u * 8.2 + a * 2.1 + .8) * (1 - u * .6) - (ev ? .13 : .06) * Math.exp(-(((u - .12) / .1) ** 2)) + wave;
      const kTrail = (.012 * Math.sin(a * 2.1)) + .09 * Math.sin(6 * u - t * 6 + a) * (.3 + u) * (1 + pulse * .5) + (.012 + .2 * u ** 5) * S.jet;
      let k = mix(kTrail, kHold, S.curl);
      coil += Math.max(0, k);
      if (ap) k = mix(k, .012 * Math.sin(u * 7), ap);
      if (i) {
        _qk.setFromAxisAngle(AX.z, k); _q.multiply(_qk);
        _qk.setFromAxisAngle(AX.x, .018 * sp * Math.sin(u * 5 + t * .7 + a)); _q.multiply(_qk);
        _qk.setFromAxisAngle(AX.y, .03 * u * sp); _q.multiply(_qk);
      }
      _d.set(0, 1, 0).applyQuaternion(_q);
      const gap = 1 + ap * 1.25 + e * (.5 + hash(a * 31 + i) * .55);
      _p.addScaledVector(_d, L * .5 * gap);
      const hi = hash(a * 13 + i * 7), idx = a * N + i;
      let ex = 0; if (e) { _x.set(_p.x, _p.y + .3, _p.z); ex = e * (.16 + hi * .24); }
      const px = _p.x, py = _p.y, pz = _p.z;
      if (e) _p.addScaledVector(_x, ex);
      if (e) { _qk.setFromAxisAngle(AX.x, e * (hi - .5) * 1.5); _q0.copy(_q); _q.multiply(_qk); }
      const pa = ap * L * .22 + e * L * .5, pb = e * r * 1.2;
      setPart(P.sleeve, idx, 0, pa * .2, 0, r, L, r);
      setPart(P.collar, idx, 0, -pa, 0, r, L, r);
      setPart(P.ring, idx, 0, pa * .8, 0, r, L, r);
      setPart(P.struts, idx, 0, -pa * 1.7, 0, r, L * (1 + e * .3), r);
      setPart(P.bolts, idx, 0, pa * .2, 0, r, L, r);
      setPart(P.window, idx, 0, 0, pb, r, L, r, i % 4 !== 1);
      setPart(P.tagb, idx, pb * .6, 0, pb * .6, r, L, r, i % 5 === 2);
      if (e) _q.copy(_q0);
      _p.set(px, py, pz);
      _p.addScaledVector(_d, L * .5 * gap);
      if (a === 2 && i === 13) armPt.copy(_p);
    }
    curlOut[a] = coil; armTip[a].copy(_p);
  }
  for (const k in P) P[k].instanceMatrix.needsUpdate = true;
}
const armMark = new THREE.Object3D(); jf.add(armMark); anchors.armLink = armMark;

/* ---------- wake + stage ---------- */
const BUB = 90;
const bubMat = new THREE.MeshPhysicalMaterial({color:0xffffff, roughness:.1, transparent:true, opacity:.5, envMapIntensity:1.6});
const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 10), bubMat, BUB);
bubbles.frustumCulled = false; bubbles.renderOrder = 6; scene.add(bubbles);
const rings = new THREE.Group(); scene.add(rings);
const ringMat = new THREE.LineBasicMaterial({color:0x97bcbb, transparent:true, opacity:.55});
const dashMat = new THREE.LineDashedMaterial({color:0x97bcbb, transparent:true, opacity:.45, dashSize:.14, gapSize:.1});
const nodeG = new THREE.RingGeometry(.05, .075, 24), nodeM = new THREE.MeshBasicMaterial({color:0x97bcbb, side:THREE.DoubleSide});
const ringSpec = [[4.6, .22, .3, 0], [6.4, -.5, .2, 1], [5.5, 1.28, -.2, 0], [8, .55, -.5, 1], [3.1, 1.46, .02, 0]];
const ringObjs = ringSpec.map(([r, rx, rz, dash], i) => {
  const pts = []; for (let k = 0; k <= 180; k++) { const a = k / 180 * Math.PI * 2; pts.push(V(Math.cos(a) * r, Math.sin(a) * r, 0)); }
  const g = new THREE.BufferGeometry().setFromPoints(pts), l = new THREE.Line(g, dash ? dashMat : ringMat);
  if (dash) l.computeLineDistances();
  const o = new THREE.Group(); o.rotation.set(rx, 0, rz); o.add(l);
  for (let k = 0; k < 3; k++) { const a = k * 2.1 + i, n = new THREE.Mesh(nodeG, nodeM); n.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); o.add(n); }
  rings.add(o); return o;
});
const shC = document.createElement('canvas'); shC.width = shC.height = 256;
{ const c = shC.getContext('2d'), g = c.createRadialGradient(128, 128, 8, 128, 128, 128); g.addColorStop(0, 'rgba(40,110,110,.34)'); g.addColorStop(.5, 'rgba(40,110,110,.12)'); g.addColorStop(1, 'rgba(40,110,110,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); }
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shC), transparent:true, depthWrite:false}));
floor.position.y = -5.2; scene.add(floor);

/* ---------- labels ---------- */
const LABELS = {
  optic:[['optRim','IR RIM','18 LEDS · 840 NM',16,-5],['optIris','IRIS','8 BLADES · OPENS 3 S',17,1],['optLens','OUTER LENS','SAPPHIRE · 40 M RATED',17,7],['petal','OPTIC SOCKET','Ø 44 MM · SEALED',-24,6]],
  bell:[['petal','BELL PETAL','8 OF 8 · GLASS PORT',17,-8],['pump','PUMP CORE','REACTOR RING',-21,-6]],
  pump:[['pump','PUMP CORE','SPINNING FREE',17,-6],['petal','GLASS PETAL','HINGED · 96°',-23,2]],
  arm:[['armLink','ARM LINK 14','SPLIT · 2.4× GAP',-3,-10]],
  siphon:[['sipA','OUTER SLEEVE','3 STAGE · TELESCOPE',-24,-4],['sipB','NOZZLE','6 FLAPS',-21,5]],
  all:[['pump','PUMP CORE','SPINNING FREE',20,-14],['optLens','OPTICS','1 × LENS',22,-1],['armLink','ARM LINKS','APART',-30,5],['sipA','ARM HUB','8 SOCKETS',20,11]],
};
const tagWrap = $('tags'), leaders = $('leaders'), MAXT = 4, tagEl = [];
for (let i = 0; i < MAXT; i++) {
  const d = document.createElement('div'); d.className = 'tag'; d.style.opacity = 0; tagWrap.append(d);
  const l = document.createElementNS('http://www.w3.org/2000/svg', 'line'), c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', 2.4);
  leaders.append(l, c); tagEl.push({d, l, c, key:''});
}

/* ---------- static hud ---------- */
$('plus').innerHTML = '<span>+</span>'.repeat(28);
for (let i = 0; i < 50; i++) $('loadbar').append(document.createElement('i'));
for (let i = 0; i < 10; i++) $('batt').append(document.createElement('i'));
const armNames = ['R1','R2','R3','R4','L1','L2','L3','L4'], armEls = armNames.map(n => {
  const d = document.createElement('div'); d.className = 'armrow'; d.innerHTML = `<span>${n}</span><u><i></i></u><s></s>`; $('arms').append(d);
  return {d, i:d.querySelector('i'), s:d.querySelector('s')};
});
const SUB = [['OPTIC ARRAY','1 × 52 MM LENS · IR RIM','TRACKING','OPEN'],['BELL SHELL','8 PETALS · GLASS PORT','SEALED','OPEN'],['PUMP CORE','REACTOR RING · 7 PISTONS','RUNNING','OUT'],['ARM CHAINS','224 LINKS · 8 ARMS','8 / 8 LIVE','APART'],['SIPHON','3 SLEEVES · 6-FLAP NOZZLE','IDLE','OPEN'],['BALANCE RING','8 RIM NODES · GYRO','SEALED','OPEN']];
const subEls = SUB.map((s, i) => {
  const d = document.createElement('div'); d.className = 'sub'; d.innerHTML = `<span class="n">0${i + 1}</span><span>${s[0]}<i>${s[1]}</i></span><span class="ctag"></span>`; $('subs').append(d);
  return {d, tag:d.querySelector('.ctag')};
});
const ASM = {HERO:0, OPTICS:3.3, BELL:5.7, PUMP:7.5, 'ARM R2':9.9, SIPHON:12.7}, asmEls = {}, disEls = {};
for (const k in ASM) { const b = document.createElement('button'); b.textContent = k; b.onclick = () => seekTo(k === 'HERO' ? 21 : ASM[k] - .05); $('asm').append(b); asmEls[k] = b; }
const manual = {};
for (const k of ['LABELS','EXPLODED','JET WAKE','TURNTABLE']) { const b = document.createElement('button'); b.textContent = k; b.onclick = () => { manual[k] = !flag(k); manSec = lastSec; }; $('dis').append(b); disEls[k] = b; }
SECT.forEach((s, i) => { if (!i || s.m === 'HOLDING' || s.t === 19.3) return; const e = document.createElement('em'); e.style.left = s.t / DUR * 100 + '%'; $('rail').append(e); });
let manSec = null, lastSec = null;
const flag = k => { if (k in manual) return manual[k]; const s = lastSec || SECT[0]; return k === 'LABELS' ? !!s.lab : (s.on || []).includes(k); };

/* ---------- jet maths ---------- */
const jetAt = t => sample(TR.jet, t);
const beat = t => { const x = (t * 1.8) % 1; return x < .42 ? Math.sin(x / .42 * Math.PI) ** 2 : 0; };
const pressure = t => 18 + 1.4 * Math.sin(t * 1.3) + jetAt(t) * beat(t) * 78;

const chart = $('chart'), cx = chart.getContext('2d');
function drawChart(t) {
  const w = chart.clientWidth, h = chart.clientHeight, dpr = Math.min(devicePixelRatio, 2);
  if (chart.width !== Math.round(w * dpr)) { chart.width = Math.round(w * dpr); chart.height = Math.round(h * dpr); }
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, h);
  cx.strokeStyle = '#d3e8e7'; cx.lineWidth = 1;
  for (const y of [.25, .6, .92]) { cx.beginPath(); cx.moveTo(0, h * y); cx.lineTo(w, h * y); cx.stroke(); }
  const line = (lag, col, lw) => {
    cx.strokeStyle = col; cx.lineWidth = lw; cx.beginPath();
    for (let i = 0; i <= 90; i++) { const tt = Math.max(0, t - lag - (90 - i) / 90 * 2.4), v = pressure(tt) / 100; const x = i / 90 * (w - 8), y = h * (.92 - v * .72); i ? cx.lineTo(x, y) : cx.moveTo(x, y); }
    cx.stroke();
  };
  line(.14, '#b9d4d3', 1); line(0, '#ff5a3c', 1.6);
  const v = pressure(t) / 100; cx.fillStyle = '#ff5a3c'; cx.beginPath(); cx.arc(w - 8, h * (.92 - v * .72), 3, 0, 7); cx.fill();
}

/* ---------- layout ---------- */
let W = 1, H_ = 1;
function resize() {
  W = innerWidth; H_ = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(W, H_, false);
  camera.aspect = W / H_; camera.updateProjectionMatrix();
  leaders.setAttribute('viewBox', `0 0 ${W} ${H_}`);
}
addEventListener('resize', resize); resize();

/* ---------- input ---------- */
let playT = 0, playing = true, orbitX = 0, orbitY = 0, orbitXs = 0, orbitYs = 0, drag = null, scrub = false;
const seekTo = t => { playT = clamp(t, 0, DUR - .001); for (const k in manual) delete manual[k]; };
$('play').onclick = () => { playing = !playing; $('pi').setAttribute('d', playing ? 'M2 1h3v10H2zM7 1h3v10H7z' : 'M3 1l8 5-8 5z'); };
canvas.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; canvas.classList.add('drag'); canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!drag) return; orbitX -= (e.clientX - drag[0]) * .006; orbitY = clamp(orbitY + (e.clientY - drag[1]) * .004, -.9, .9); drag = [e.clientX, e.clientY]; });
const endDrag = () => { drag = null; canvas.classList.remove('drag'); };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
const rail = $('rail'), railX = e => { const r = rail.getBoundingClientRect(); playT = clamp((e.clientX - r.left) / r.width, 0, .9999) * DUR; };
rail.addEventListener('pointerdown', e => { scrub = true; rail.setPointerCapture(e.pointerId); railX(e); });
rail.addEventListener('pointermove', e => { if (scrub) railX(e); });
rail.addEventListener('pointerup', () => scrub = false); rail.addEventListener('pointercancel', () => scrub = false);
addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); $('play').click(); } });

/* ---------- frame ---------- */
const S = {}, tmp = V(0, 0, 0), tmp2 = V(0, 0, 0);
const fmt2 = (v, u) => (v >= 0 ? '+' : '') + v.toFixed(2) + u;
const setTxt = (el, v) => { if (el.textContent !== v) el.textContent = v; };
function apply(t, wall) {
  for (const k in TR) S[k] = sample(TR[k], t);
  const sec = secAt(t);
  if (sec !== lastSec) { lastSec = sec; if (manSec && manSec !== sec) { for (const k in manual) delete manual[k]; manSec = null; } }
  // manual toggles lift the timeline values
  const ex = flag('EXPLODED'), tt = flag('TURNTABLE');
  if ('EXPLODED' in manual) { S.expl = manual.EXPLODED ? 1 : (sec.det ? 0 : S.expl); if (manual.EXPLODED) { S.petal = Math.max(S.petal, .6); S.pump = 1; } }
  S.pulse = beat(t) * Math.max(S.jet, .1);
  const idle = 1 - S.jet;
  // body
  jf.position.set(0, S.py + idle * .07 * Math.sin(t * 1.1), 0);
  jf.rotation.set(S.tilt + idle * .02 * Math.sin(t * .8), 0, S.roll + idle * .02 * Math.sin(t * .6));
  // petals: a soft squeeze with each pulse, a real hinge when opened
  const squeeze = S.pulse * (S.jet > .05 ? .16 : .035) - (1 - S.pulse) * .0;
  petals.forEach((p, i) => {
    const open = S.petal * 1.3;
    p.piv.quaternion.setFromAxisAngle(p.tan, open - squeeze);
    p.piv.position.copy(p.rad).multiplyScalar(prof(0)[0] * (1 - squeeze * .35) + S.expl * .75);
    p.piv.position.y = S.expl * .25 * (i % 2 ? 1 : .4);
  });
  capG.position.y = prof(.92)[1] + S.pump * 1.05 + S.expl * .55;
  pump.position.y = .35 + S.pump * 1.45 + S.expl * .4;
  pumpSpin.rotation.y = t * (1.2 + S.jet * 5) + S.pump * 9;
  pistons.forEach((o, i) => { o.position.y = .22 + .04 * Math.sin(t * 7 + i * .9) * (.4 + S.pump); });
  // optic unscrews
  const oe = Math.max(S.optic, S.expl);
  optic.position.z = .62 + S.expl * 1.15;
  opRing.position.z = .16 + oe * .24; opRing.rotation.z = oe * 3.4 + t * .05;
  opLens.position.z = .2 + oe * .46; opLens.rotation.z = -oe * 2;
  iris.forEach((p, i) => { p.rotation.z = (i / 8 * Math.PI * 2 + 1.9) + oe * .95; p.position.z = .18 + oe * .1; });
  // siphon telescopes
  const se = Math.max(S.siphon, S.expl * .7) ;
  slv[0].position.y = -.12 - se * .12; slv[1].position.y = -.22 - se * .32; slv[2].position.y = -.28 - se * .56 - S.pulse * .03;
  flaps.forEach((f, i) => { f.rotation.x = -.7 + se * 1.45 + S.pulse * .25; });
  siphon.position.y = -.32 - S.expl * .85;
  chassis.position.y = 0;
  // arms
  poseArms(S, t);
  armMark.position.copy(armPt);
  // wake
  const wakeOn = flag('JET WAKE') ? 1 : 0;
  const nz = tmp.set(0, -1.2, 0).applyMatrix4(jf.matrixWorld.compose(jf.position, jf.quaternion, tmp2.set(1, 1, 1)));
  const dir = tmp2.set(0, -1, 0).applyQuaternion(jf.quaternion).clone();
  for (let i = 0; i < BUB; i++) {
    const h = hash(i + 3), h2 = hash(i * 2 + 9), life = (t * (.55 + h * .4) + h2) % 1, s = wakeOn * (1 - life) * (.018 + h * .05);
    _p.copy(nz).addScaledVector(dir, life * (3 + h * 5));
    const a = i * 2.4, rr = life * (.3 + h2 * .9);
    _p.x += Math.cos(a) * rr; _p.z += Math.sin(a) * rr; _p.y -= life * life * .4;
    _m.compose(_p, _q0.identity(), _s.setScalar(Math.max(s, .00001))); bubbles.setMatrixAt(i, _m);
  }
  bubbles.instanceMatrix.needsUpdate = true;
  // stage
  rings.position.y = -.3 + S.py * .1;
  ringObjs.forEach((o, i) => { o.rotation.y = t * .03 * (i % 2 ? 1 : -1) + S.expl * .6 + i; });
  rings.scale.setScalar(1 + (S.dist - 12) * .03);
  floor.material.opacity = clamp(1 - Math.abs(S.py - .25) * .4, 0, 1) * (S.el < -.2 ? .4 : 1);
  // camera
  orbitXs += (orbitX - orbitXs) * .12; orbitYs += (orbitY - orbitYs) * .12;
  const turn = ('TURNTABLE' in manual ? (manual.TURNTABLE ? wall * .5 : 0) : S.turn);
  const az = S.az + turn + orbitXs, el = clamp(S.el + orbitYs, -1.3, 1.3);
  const portrait = clamp(1.35 / camera.aspect, 1, 2.1), d = S.dist * portrait;
  const tg = tmp.set(S.tx, S.ty + S.fol * S.py, 0);
  camera.position.set(tg.x + Math.sin(az) * Math.cos(el) * d, tg.y + Math.sin(el) * d, tg.z + Math.cos(az) * Math.cos(el) * d);
  camera.lookAt(tg);
  key.target.position.copy(jf.position); key.position.set(jf.position.x + 5, jf.position.y + 11, jf.position.z + 8);
}

function hud(t) {
  const sec = lastSec, jet = S.jet, p = pressure(t), kpa = Math.round(p), load = clamp(.12 + jet * (.25 + beat(t) * .72) + S.expl * .02);
  setTxt($('kpa'), String(kpa).padStart(2, '0'));
  setTxt($('thr'), String(Math.round(6 + jet * beat(t) * 210 + (t > 22 ? 4 : 0))));
  setTxt($('pul'), (jet > .1 ? 1.8 : 0).toFixed(1) + ' HZ');
  setTxt($('sipst'), jet > .1 ? 'SIPHON PULSE' : S.siphon > .1 ? 'SIPHON OPEN' : 'SIPHON IDLE');
  drawChart(t);
  setTxt($('loadv'), Math.round(load * 100) + '%');
  [...$('loadbar').children].forEach((b, i) => { const on = i / 50 < load; b.style.background = on ? (i > 35 ? 'var(--coral)' : i > 20 ? 'var(--teal)' : 'var(--ink)') : ''; });
  const bat = 76 - Math.round(t * .22);
  setTxt($('bat'), String(bat));
  [...$('batt').children].forEach((b, i) => { b.style.background = i / 10 < bat / 100 ? (i < 3 ? 'var(--coral)' : 'var(--aqua)') : ''; });
  setTxt($('draw'), (9.4 + jet * beat(t) * 18 + (S.optic + S.petal + S.pump + S.expl) * 7).toFixed(1) + ' W');
  setTxt($('mot'), (22 + Math.round(t * .34)) + ' °C');
  setTxt($('rt'), '00:00:' + String(Math.floor(t)).padStart(2, '0'));
  $('st').innerHTML = `<span class="dot${sec.hot ? ' hot' : ''}"></span>${sec.st}`;
  setTxt($('mm'), sec.m); setTxt($('ms'), sec.s); setTxt($('msg'), sec.log); setTxt($('iso'), 'ISOLATE · ' + sec.iso);
  const pct = t / DUR * 100; $('fill').style.width = pct + '%'; $('knob').style.left = pct + '%';
  setTxt($('tc'), `00:${String(Math.floor(t)).padStart(2, '0')} / 00:25`);
  // attitude
  const pitch = -S.tilt * 57.3 + 0.8 * Math.sin(t * .8), roll = S.roll * 57.3 + 1.1 * Math.sin(t * .6), vs = (sample(TR.py, t + .1) - sample(TR.py, t)) * 10 + .04 * Math.sin(t);
  setTxt($('dp'), fmt2(pitch, '°')); setTxt($('dr'), fmt2(roll, '°')); setTxt($('dv'), fmt2(vs, ' M/S'));
  setTxt($('dd'), (12.42 - S.py * .02 + .04 * Math.sin(t * .5)).toFixed(2) + ' M'); setTxt($('spd'), Math.abs(vs).toFixed(2) + ' M/S');
  setTxt($('hold'), jet > .5 ? 'OFF' : 'STATION');
  $('hg').setAttribute('transform', `rotate(${roll.toFixed(2)}) translate(0 ${(pitch * .4).toFixed(2)})`);
  // arm rows
  const det = sec.det;
  armEls.forEach((a, i) => {
    a.d.classList.toggle('det', !!det);
    const v = Math.round(clamp(mix(.14 + hash(i) * .2 + .08 * Math.sin(t * 3 + i), .88 + .1 * Math.sin(t * .9 + i * 1.8), S.curl)) * 100);
    if (det) { setTxt(a.s, 'DETACHED'); return; }
    a.i.style.width = v + '%'; a.i.style.background = S.curl > .5 ? 'var(--coral)' : 'var(--ink)'; setTxt(a.s, (i === 1 && S.apart > .4) ? 'APART' : v + '%');
  });
  const at = $('armtag'); setTxt(at, sec.tag); at.classList.toggle('hot', !!det);
  // subsystems
  subEls.forEach((s, i) => {
    s.d.classList.toggle('on', sec.sub === i || (det && i === 3));
    let txt = SUB[i][2]; if (i === 4 && jet > .1) txt = 'PULSING';
    const open = sec.sub === i, hot = open || det;
    setTxt(s.tag, det ? 'DETACHED' : open ? SUB[i][3] : txt);
    s.tag.className = 'ctag' + (hot ? ' hot' : txt === 'IDLE' ? ' idle' : '');
  });
  // buttons
  for (const k in asmEls) asmEls[k].classList.toggle('on', sec.b === k);
  for (const k in disEls) disEls[k].classList.toggle('on', flag(k));
  // labels
  const want = flag('LABELS') ? (LABELS[sec.lab] || LABELS.all) : [];
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  tagEl.forEach((e, i) => {
    const l = want[i];
    if (!l) { e.d.style.opacity = 0; e.l.setAttribute('opacity', 0); e.c.setAttribute('opacity', 0); return; }
    if (e.key !== l[1]) { e.key = l[1]; e.d.innerHTML = `<b></b>${l[1]}<i>${l[2]}</i>`; }
    anchors[l[0]].updateWorldMatrix(true, false);
    tmp.setFromMatrixPosition(anchors[l[0]].matrixWorld).project(camera);
    const x = (tmp.x + 1) / 2 * W, y = (1 - tmp.y) / 2 * H_;
    const lx = clamp(W / 2 + (l[3] * rem) * .92 + (x - W / 2) * .22, 26 * rem, W - 34 * rem + (l[3] > 0 ? 8 * rem : 0)), ly = clamp(H_ / 2 + (l[4] * rem) * 1.25, 11 * rem, H_ - 16 * rem);
    const left = l[3] < 0;
    e.d.style.transform = `translate(${lx - (left ? e.d.offsetWidth : 0)}px,${ly - .5 * rem}px)`; e.d.style.opacity = 1;
    const endx = left ? lx + .4 * rem : lx - .4 * rem;
    e.l.setAttribute('x1', x); e.l.setAttribute('y1', y); e.l.setAttribute('x2', endx); e.l.setAttribute('y2', ly); e.l.setAttribute('opacity', .8);
    e.c.setAttribute('cx', x); e.c.setAttribute('cy', y); e.c.setAttribute('opacity', 1);
  });
}

function draw(t, wall) { apply(t, wall); renderer.render(scene, camera); hud(t); }

let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!frozen) { if (playing && !scrub) playT = (playT + dt) % DUR; draw(playT, now / 1000); }
  requestAnimationFrame(loop);
}
let frozen = false;
document.fonts.ready.then(() => hud(playT));
requestAnimationFrame(loop);
