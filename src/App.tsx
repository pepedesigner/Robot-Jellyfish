import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/src/medusa.js';
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <main
      className="page"
      dangerouslySetInnerHTML={{
        __html: `
  <canvas id="gl"></canvas>
  <svg id="leaders"></svg>
  <div id="tags"></div>
  <div class="hud">
    <div class="logo"><svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M7 20C7 11 13 6 20 6s13 5 13 14c-3 2-6 1-8 0-3 1.500-7 1.500-10 0-2 1-5 2-8 0Z"/><path d="M12 23c0 4-3 5-2 9M17 24c0 4-2 7 0 11M23 24c0 4 2 7 0 11M28 23c0 4 3 5 2 9"/></svg>JF-4</div>
    <div class="head"><div class="k">ROBOTIC FIELD-SIMULATOR / OCEANIC EXPLORATION PLATFORM</div><h1>Medusa JF-4<em>/</em></h1><div class="s">SOFT-ROBOTIC TENTACLE DRONE / FLUID PROPULSION</div></div>
    <div class="load"><div class="row"><span>JET LOAD</span><b id="loadv">0%</b></div><div id="loadbar"></div><div class="row m"><span>IDLE</span><span>THRUST</span><span>BURST</span></div></div>
    <div class="meta"><div>UNIT ID<b>JF4-0731</b></div><div>RUNTIME<b id="rt">00:00:00</b></div><div>STATUS<b id="st"><span class="dot"></span>JETTING</b></div><div>OPERATOR<b>TANK 2 · M.S.</b></div></div>
    <div class="plus" id="plus"></div>
    <div class="rulelab" style="left:27.6rem">MODEL JF-4 · REV B</div>
    <div class="rulelab" style="right:27.6rem" id="iso">ISOLATE · HERO</div>

    <section class="card l" id="cJet"><div class="ct"><span>JET</span><small>01</small></div>
      <div class="jr"><div class="big"><span id="kpa">0</span><small>KPA</small></div><div class="big" style="font-size:1.9rem"><span id="thr">0</span> N</div></div>
      <div class="foot" style="margin-top:.2rem"><span>BELL PRESSURE</span><span>THRUST</span></div>
      <canvas id="chart"></canvas>
      <div class="foot"><span>PULSE <b id="pul">0.0 HZ</b></span><span id="sipst">SIPHON IDLE</span></div></section>
    <section class="card l" id="cPow"><div class="ct"><span>POWER</span><small>02</small></div>
      <div class="jr" style="align-items:center"><div class="big"><span id="bat">76</span><small>%</small></div><div id="batt"></div></div>
      <div class="tiny">BATTERY</div>
      <div class="tri tiny"><div>DRAW<b id="draw">9.4 W</b></div><div>CELL<b>3.72 V</b></div><div>MOTOR<b id="mot">23 °C</b></div></div></section>
    <section class="card l" id="cArm"><div class="ct"><span>ARM COIL</span><small>03</small></div>
      <div class="foot" style="margin-top:.4rem;align-items:center"><span>COIL PER ARM · TIP SPIRAL</span><span class="ctag" id="armtag">TRAILING</span></div>
      <div id="arms"></div></section>

    <section class="card r" id="cDep"><div class="ct"><span>DEPTH</span><small>04</small></div>
      <div class="dep"><svg id="hor" viewBox="-50 -50 100 100"><defs><clipPath id="hc"><circle r="47"/></clipPath></defs><circle r="47" fill="#f7fdfc" stroke="#cfe5e4"/><g clip-path="url(#hc)"><g id="hg"><rect x="-80" y="0" width="160" height="90" fill="#dcf0ee"/><line x1="-80" x2="80" stroke="#0e3a3d" stroke-width="1"/></g></g><path d="M-16 0h10l4 5 4-5h12" fill="none" stroke="#ff5a3c" stroke-width="1.800"/></svg>
      <dl><dt>DEPTH</dt><dd id="dd">12.42 M</dd><dt>V/S</dt><dd id="dv">+0.00 M/S</dd><dt>PITCH</dt><dd id="dp">+0.00°</dd><dt>ROLL</dt><dd id="dr">+0.00°</dd></dl></div>
      <div class="foot" style="border-top:1px solid var(--line);padding-top:.6rem;margin-top:.7rem"><span>HOLD <b id="hold">OFF</b></span><span>SPEED <b id="spd">0.00 M/S</b></span></div></section>
    <section class="card r" id="cAsm"><div class="ct"><span>ASSEMBLIES</span><small>05</small></div><div class="btns" id="asm"></div></section>
    <section class="card r" id="cDis"><div class="ct"><span>DISPLAY</span><small>06</small></div><div class="btns" id="dis"></div></section>
    <section class="card r" id="cSub"><div class="ct"><span>SUBSYSTEMS</span><small>07</small></div><div id="subs"></div></section>

    <div id="mode"><div class="t">OPERATING MODE</div><div class="m" id="mm">JETTING</div><div class="t" id="ms"></div></div>
    <section class="logcard"><div class="ct"><span>OPERATION LOG</span><small>08</small></div>
      <div class="lg"><button id="play" aria-label="Pause"><svg viewBox="0 0 12 12"><path id="pi" d="M2 1h3v10H2zM7 1h3v10H7z"/></svg></button>
        <div><div class="lgh"><span>DIVE</span><span id="msg"></span><span>SURFACE</span></div>
        <div id="rail" role="slider" tabindex="0" aria-label="Timeline"><div class="b"></div><div id="fill"></div><div id="knob"></div></div>
        <div class="sm"><span id="tc">00:00 / 00:25</span><span>8 OPERATOR ACTIONS</span></div></div></div></section>
    <div class="bot"><span>FIELD SIMULATOR &nbsp;·&nbsp; PROCEDURAL MODEL &nbsp;·&nbsp; 8 ARMS &nbsp;·&nbsp; 1 OPTIC &nbsp;·&nbsp; 1 SIPHON</span><span>MEDUSA MARINE ROBOTICS &nbsp;·&nbsp; DEEP LAB <b>//////</b></span></div>
  </div>
`,
      }}
    />
  );
}
