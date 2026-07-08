const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const el = {
  levelCounter: document.getElementById("levelCounter"),
  levelTag: document.getElementById("levelTag"),
  levelTitle: document.getElementById("levelTitle"),
  levelPrompt: document.getElementById("levelPrompt"),
  atpMeter: document.getElementById("atpMeter"),
  potentialRow: document.getElementById("potentialRow"),
  potentialMeter: document.getElementById("potentialMeter"),
  gradientLabel: document.getElementById("gradientLabel"),
  gradientMeter: document.getElementById("gradientMeter"),
  atpValue: document.getElementById("atpValue"),
  potentialValue: document.getElementById("potentialValue"),
  potentialPlotPanel: document.getElementById("potentialPlotPanel"),
  potentialPlot: document.getElementById("potentialPlot"),
  plotReadout: document.getElementById("plotReadout"),
  gradientValue: document.getElementById("gradientValue"),
  targetValue: document.getElementById("targetValue"),
  toolbox: document.getElementById("toolbox"),
  feedback: document.getElementById("feedback"),
  runButton: document.getElementById("runButton"),
  pauseButton: document.getElementById("pauseButton"),
  resetButton: document.getElementById("resetButton"),
  clearButton: document.getElementById("clearButton"),
  soundButton: document.getElementById("soundButton"),
  prevLevel: document.getElementById("prevLevel"),
  nextLevel: document.getElementById("nextLevel"),
  dropHint: document.getElementById("dropHint"),
  tutorialPanel: document.getElementById("tutorialPanel"),
  partInfo: document.getElementById("partInfo")
};

const sound = {
  enabled: loadSoundPreference(),
  ctx: null,
  master: null,
  lastPlayed: {}
};

const soundPresets = {
  toggle: { freq: 640, endFreq: 920, type: "sine", duration: 0.11, volume: 0.09, throttle: 0 },
  ui: { freq: 470, endFreq: 560, type: "triangle", duration: 0.08, volume: 0.06, throttle: 0.04 },
  run: { freq: 260, endFreq: 520, type: "sine", duration: 0.16, volume: 0.08, throttle: 0.08 },
  pause: { freq: 420, endFreq: 280, type: "sine", duration: 0.12, volume: 0.07, throttle: 0.08 },
  reset: { freq: 310, endFreq: 230, type: "triangle", duration: 0.13, volume: 0.07, throttle: 0.08 },
  install: { freq: 540, endFreq: 700, type: "triangle", duration: 0.1, volume: 0.07, throttle: 0.06 },
  remove: { freq: 330, endFreq: 190, type: "triangle", duration: 0.12, volume: 0.07, throttle: 0.06 },
  neutralDiffusion: { freq: 520, endFreq: 500, type: "sine", duration: 0.07, volume: 0.045, throttle: 0.16 },
  transportIn: { freq: 720, endFreq: 420, type: "sine", duration: 0.09, volume: 0.055, throttle: 0.1 },
  transportOut: { freq: 430, endFreq: 760, type: "sine", duration: 0.09, volume: 0.055, throttle: 0.1 },
  pumpBind: { freq: 240, endFreq: 300, type: "square", duration: 0.055, volume: 0.045, throttle: 0.08 },
  pumpCycle: { freq: 190, endFreq: 480, type: "sawtooth", duration: 0.17, volume: 0.07, throttle: 0.16 },
  ligandRelease: { freq: 840, endFreq: 420, type: "triangle", duration: 0.18, volume: 0.07, throttle: 0.18 },
  ligandBind: { freq: 620, endFreq: 620, type: "triangle", duration: 0.08, volume: 0.055, throttle: 0.1 },
  proteinRelease: { freq: 210, endFreq: 390, type: "triangle", duration: 0.16, volume: 0.065, throttle: 0.12 },
  dock: { freq: 360, endFreq: 520, type: "square", duration: 0.08, volume: 0.052, throttle: 0.12 },
  camp: { freq: 920, endFreq: 1220, type: "sine", duration: 0.08, volume: 0.048, throttle: 0.08 },
  phosphorylate: { freq: 760, endFreq: 1020, type: "triangle", duration: 0.13, volume: 0.065, throttle: 0.14 },
  glycogen: { freq: 300, endFreq: 170, type: "square", duration: 0.075, volume: 0.05, throttle: 0.09 },
  win: { freq: 520, endFreq: 1040, type: "sine", duration: 0.28, volume: 0.095, throttle: 0.3 },
  fail: { freq: 220, endFreq: 150, type: "sawtooth", duration: 0.22, volume: 0.07, throttle: 0.25 }
};

function loadSoundPreference() {
  try {
    return localStorage.getItem("cellMachineSound") !== "off";
  } catch (error) {
    return true;
  }
}

function saveSoundPreference() {
  try {
    localStorage.setItem("cellMachineSound", sound.enabled ? "on" : "off");
  } catch (error) {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}

function updateSoundButton() {
  if (!el.soundButton) return;
  el.soundButton.textContent = sound.enabled ? "Sound on" : "Sound off";
  el.soundButton.setAttribute("aria-pressed", sound.enabled ? "true" : "false");
}

function ensureAudioContext() {
  if (!sound.enabled) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!sound.ctx) {
    sound.ctx = new AudioContext();
    sound.master = sound.ctx.createGain();
    sound.master.gain.value = 0.16;
    sound.master.connect(sound.ctx.destination);
  }
  if (sound.ctx.state === "suspended") sound.ctx.resume();
  return sound.ctx;
}

function playSound(name, intensity = 1, force = false) {
  if (!sound.enabled) return;
  const preset = soundPresets[name] || soundPresets.ui;
  const audio = ensureAudioContext();
  if (!audio || !sound.master) return;
  const now = audio.currentTime;
  const throttle = preset.throttle ?? 0.08;
  const lastPlayed = sound.lastPlayed[name];
  if (!force && lastPlayed !== undefined && now - lastPlayed < throttle) return;
  sound.lastPlayed[name] = now;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const duration = preset.duration || 0.1;
  const volume = (preset.volume || 0.05) * Math.max(0.25, Math.min(1.4, intensity));
  osc.type = preset.type || "sine";
  osc.frequency.setValueAtTime(preset.freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, preset.endFreq || preset.freq), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(sound.master);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

const partTypes = {
  channel: {
    name: "O2 Channel",
    short: "O2",
    color: "#2563eb",
    text: "Allows small molecules to diffuse inward.",
    behavior: "Always open. O2 molecules outside the cell drift toward this channel and pass inward without ATP. It does not affect electric potential because O2 is neutral."
  },
  transporter: {
    name: "Glucose Transporter",
    short: "G",
    color: "#16a34a",
    text: "Moves glucose through the membrane without ATP.",
    behavior: "Always open. Glucose outside the cell can cross through this transporter by facilitated diffusion. It does not spend ATP and does not change electric potential."
  },
  pump: {
    name: "Ion Pump",
    short: "P",
    color: "#dc2626",
    text: "Spends ATP to push ions against a gradient.",
    behavior: "Always active when ATP is available. It pulls nearby positive ions from inside the cell, moves them outward, spends ATP, and increases the stored gradient."
  },
  receptor: {
    name: "Receptor",
    short: "R",
    color: "#7c3aed",
    text: "Activates nearby gated parts when signal molecules bind.",
    behavior: "Starts inactive. It activates when a signal molecule gets close, then flashes locally. An active receptor can open a nearby gated channel."
  },
  gated: {
    name: "Gated Channel",
    short: "Gate",
    color: "#0891b2",
    text: "Opens only after a receptor is activated.",
    behavior: "Closed until a nearby receptor is active. Once open, it lets ions enter the cell without ATP and makes the inside more positive."
  },
  acetylcholineReceptor: {
    name: "ACh Receptor",
    short: "AChR",
    color: "#9333ea",
    text: "Ligand-gated Na+ channel opened by acetylcholine.",
    behavior: "Starts closed. ACh is jetted into the outside compartment after the run begins; when an ACh molecule binds this receptor, it opens briefly and lets nearby Na+ enter, depolarizing the membrane toward threshold."
  },
  synthase: {
    name: "ATP Synthase",
    short: "ATP",
    color: "#ca8a04",
    text: "Turns a proton gradient into ATP.",
    behavior: "Always open when a proton gradient is available. H+ moves inward through synthase, ATP rises, the gradient falls, and electric potential moves toward charge balance."
  },
  protonPump: {
    name: "H+ Pump",
    short: "H+",
    color: "#ea580c",
    text: "Uses ATP to move H+ out and separate charge.",
    behavior: "Always active when ATP is available. It moves H+ from inside to outside, spends ATP, increases the proton gradient, and makes the inside more negative."
  },
  sodiumChannel: {
    name: "Na+ Channel",
    short: "Na",
    color: "#0284c7",
    text: "Lets Na+ enter and makes the inside more positive.",
    behavior: "Always open. Na+ outside the cell can enter through it without ATP. Each Na+ entry adds positive charge inside and depolarizes the membrane."
  },
  potassiumChannel: {
    name: "K+ Channel",
    short: "K",
    color: "#65a30d",
    text: "Lets K+ leave and makes the inside more negative.",
    behavior: "Always open. K+ inside the cell can leave through it without ATP. Each K+ exit removes positive charge from inside and makes the membrane more negative."
  },
  voltageSodiumChannel: {
    name: "Voltage Na+ Gate",
    short: "VNa",
    color: "#0369a1",
    text: "Opens after threshold and then inactivates.",
    behavior: "Voltage gated. It opens at -25 mV or above, conducts Na+ inward, and inactivates at about +35 mV until the membrane becomes strongly negative again."
  },
  delayedPotassiumChannel: {
    name: "Voltage K+ Gate",
    short: "DK",
    color: "#4d7c0f",
    text: "Opens at high voltage to repolarize the membrane.",
    behavior: "Voltage gated. It opens at 0 mV or above, conducts K+ outward, and stays open until the membrane falls below about -42 mV."
  },
  sodiumPotassiumPump: {
    name: "Na+/K+ Pump",
    short: "NaK",
    color: "#be123c",
    text: "Uses ATP to restore Na+ outside and K+ inside.",
    behavior: "Active transporter. It waits for three Na+ ions from inside and two K+ ions from outside, then uses ATP to send 3 Na+ out and bring 2 K+ in."
  },
  restingLeak: {
    name: "Resting Leak",
    short: "Leak",
    color: "#0f766e",
    text: "Lets K+ drift back in after hyperpolarization, returning voltage toward rest.",
    behavior: "Always open. When the inside is too negative, outside K+ can leak inward through it, nudging the membrane potential back toward the resting value."
  },
  betaAdrenergicReceptor: {
    name: "Adrenaline Receptor",
    short: "βAR",
    color: "#8b5cf6",
    zone: "membrane",
    text: "Detects adrenaline outside a liver cell.",
    behavior: "Starts inactive. When an adrenaline molecule binds outside the membrane, this receptor activates and can switch on a nearby G protein."
  },
  gProtein: {
    name: "G Protein",
    short: "Gα",
    color: "#14b8a6",
    zone: "membrane",
    text: "A three-subunit G protein with alpha, beta, and gamma pieces.",
    behavior: "Connects to a nearby adrenaline receptor. When the receptor activates, the alpha subunit separates and travels to adenylyl cyclase."
  },
  adenylylCyclase: {
    name: "Adenylyl Cyclase",
    short: "AC",
    color: "#0ea5e9",
    zone: "membrane",
    text: "Makes cAMP second messenger from ATP.",
    behavior: "Activates when the G alpha subunit docks. It pulls in ATP molecules and converts them into cAMP, with ADP and phosphate byproducts."
  },
  proteinKinaseA: {
    name: "Protein Kinase A",
    short: "PKA",
    color: "#f59e0b",
    zone: "cytoplasm",
    text: "A four-subunit kinase complex: two regulatory and two catalytic subunits.",
    behavior: "Each regulatory subunit binds two cAMP molecules. When all four slots are full, the two catalytic subunits separate and travel to phosphorylase kinase."
  },
  phosphorylaseKinase: {
    name: "Phosphorylase Kinase",
    short: "PhK",
    color: "#fb7185",
    zone: "cytoplasm",
    text: "Carries the kinase signal toward glycogen breakdown.",
    behavior: "Attracts released PKA catalytic subunits. When both arrive, it uses ATP to activate and then turns on nearby glycogen phosphorylase."
  },
  glycogenPhosphorylase: {
    name: "Glycogen Phosphorylase",
    short: "GP",
    color: "#dc2626",
    zone: "cytoplasm",
    text: "Breaks glycogen into glucose units.",
    behavior: "Activates near active phosphorylase kinase. Once active, it converts nearby glycogen granules into glucose."
  }
};

const levels = [
  {
    tutorial: true,
    title: "How To Play",
    tag: "Tutorial",
    prompt: "Cell Machine is a puzzle about building biological mechanisms. Use this screen to learn where the controls are before starting Unit 1.",
    tutorialSteps: [
      ["Mission", "Read the goal, target, and meters in the left panel.", "mission"],
      ["Cell Board", "The canvas shows outside cell, membrane, and cytoplasm. Build the mechanism here.", "board"],
      ["Parts", "Drag parts from the right panel onto the membrane or into the workspace.", "parts"],
      ["Run Controls", "Press Run to test the setup. Reset keeps parts and restarts molecules; Clear all removes parts.", "controls"],
      ["Inspect And Edit", "Hover over a part to see how it behaves. Select a placed part and press Del to remove it.", "parts"]
    ],
    parts: ["channel", "transporter", "pump", "receptor", "gated"],
    molecules: "tutorial",
    targetLabel: "tutorial",
    target: 1,
    startAtp: 50,
    startGradient: 0,
    startPotential: 0,
    success: "You are ready to start Unit 1.",
    hint: "Use this screen to learn the panels. You can skip it or step through the highlights, then start Unit 1.",
    timeout: 999,
    minRunTime: 1
  },
  {
    title: "Oxygen Diffusion",
    tag: "Membrane Transport",
    prompt: "O2 can slip directly through the lipid membrane. Press Run and watch diffusion continue until O2 equilibrates between outside and inside.",
    parts: [],
    molecules: "oxygen",
    targetLabel: "equilibrium",
    target: 0,
    startAtp: 42,
    startGradient: 0,
    startPotential: 0,
    success: "Oxygen equilibrated across the membrane by simple diffusion. Small nonpolar molecules do not need ATP or channels.",
    hint: "No part is needed here. Press Run and let O2 cross the membrane until the inside and outside counts match.",
    timeout: 22,
    minRunTime: 6
  },
  {
    title: "Feed The Cell",
    tag: "Facilitated Diffusion",
    prompt: "Glucose cannot simply slip through the membrane. Add a transporter and import enough glucose.",
    parts: ["transporter"],
    molecules: "glucose",
    targetLabel: "glucose",
    target: 7,
    startAtp: 45,
    startGradient: 30,
    startPotential: 0,
    success: "Glucose entered through a transporter. The cell gained fuel without spending ATP.",
    hint: "Place glucose transporters in the membrane. More than one transporter helps when glucose molecules are spread across the outside.",
    timeout: 14,
    minRunTime: 4
  },
  {
    title: "Build A Gradient",
    tag: "Active Transport",
    prompt: "Start with equal ion content on both sides. Use ion pumps to move ions outward and build a stored gradient. Watch the ATP cost.",
    parts: ["pump"],
    molecules: "balancedIon",
    targetLabel: "gradient",
    target: 78,
    startAtp: 90,
    startGradient: 0,
    startPotential: 0,
    success: "The pumps spent ATP to build a gradient. That stored energy can power later work.",
    hint: "Use several pumps across the membrane. Each pump only pulls nearby ions, so one pump cannot cover the whole surface."
  },
  {
    title: "Signal To Open",
    tag: "Cell Signaling",
    prompt: "A hormone signal is arriving. Place a receptor and a gated channel near each other so ions enter only after activation.",
    parts: ["receptor", "gated"],
    molecules: "signal",
    targetLabel: "ions",
    target: 6,
    startAtp: 52,
    startGradient: 48,
    startPotential: 0,
    success: "The receptor activated the gate. Cells often convert outside signals into controlled transport.",
    hint: "Place the receptor close to the gated channel. The gate opens only while a nearby receptor is active.",
    timeout: 12
  },
  {
    title: "Make ATP",
    tag: "Energy Coupling",
    prompt: "Use ATP synthase to convert a proton gradient into ATP for the cell.",
    parts: ["synthase"],
    molecules: "proton",
    targetLabel: "ATP",
    target: 82,
    startAtp: 28,
    startGradient: 92,
    startPotential: 0,
    success: "ATP synthase harvested the gradient. This is the core energy trick of mitochondria and chloroplasts.",
    hint: "Put ATP synthase in the membrane. It makes ATP only when protons pass through it down the stored H+ gradient.",
    timeout: 18,
    minRunTime: 4
  },
  {
    title: "Equal Charge",
    tag: "Electric Potential",
    prompt: "Start with equal H+ charge on both sides. Keep the electric potential at 0 mV while protons move through synthase.",
    parts: ["synthase"],
    molecules: "balancedProton",
    targetLabel: "potential",
    target: 0,
    tolerance: 4,
    startAtp: 30,
    startGradient: 50,
    startPotential: 0,
    success: "Equal positive charge on both sides gives 0 mV. The colors match because neither side is electrically favored.",
    hint: "Aim for equal positive charge on both sides. If one side becomes redder or bluer than the other, the potential is drifting away from 0 mV."
  },
  {
    title: "Separate H+ Charge",
    tag: "Proton Pumping",
    prompt: "Use H+ pumps to move positive charge out of the cell until the inside reaches about -30 mV.",
    parts: ["protonPump"],
    molecules: "hPump",
    targetLabel: "potential",
    target: -30,
    tolerance: 6,
    startAtp: 90,
    startGradient: 25,
    startPotential: 0,
    success: "Pumping H+ out leaves the inside more negative. The compartment colors now show the charge separation.",
    hint: "Use H+ pumps to export protons. Each visible proton moved outward spends ATP and makes the inside more negative."
  },
  {
    title: "Resting Membrane",
    tag: "Na+/K+ Setup",
    prompt: "Na+ starts outside and K+ starts inside. Let some K+ leave to bring the electric potential close to -30 mV.",
    parts: ["potassiumChannel"],
    molecules: "restingIons",
    targetLabel: "potential",
    target: -30,
    tolerance: 7,
    startAtp: 60,
    startGradient: 40,
    startPotential: -12,
    success: "K+ efflux makes the inside negative. This is a simplified resting membrane potential.",
    hint: "Place K+ channels in the membrane. K+ leaving the cytoplasm removes positive charge from inside and drives the voltage downward."
  },
  {
    title: "Depolarize",
    tag: "Action Potential",
    prompt: "Start near -30 mV with Na+ outside and K+ inside. Open Na+ channels to drive the membrane potential to +40 mV.",
    parts: ["sodiumChannel"],
    molecules: "actionIons",
    targetLabel: "potential",
    target: 40,
    tolerance: 6,
    startAtp: 60,
    startGradient: 40,
    startPotential: -30,
    success: "Na+ influx depolarized the cell to about +40 mV. You built the core electrical move of an action potential.",
    hint: "Place Na+ channels where outside sodium can reach them. Na+ influx adds positive charge inside and drives the voltage upward.",
    timeout: 16,
    minRunTime: 4
  },
  {
    title: "Reach Threshold",
    tag: "Action Potential",
    prompt: "ACh is released outside a few seconds after Run starts. Add ACh receptors so the signal opens Na+ entry and raises the membrane toward threshold.",
    parts: ["acetylcholineReceptor"],
    molecules: "thresholdIons",
    targetLabel: "potential",
    target: -15,
    tolerance: 6,
    startAtp: 60,
    startGradient: 40,
    startPotential: -30,
    achReleaseTime: 2.2,
    achReleaseCount: 6,
    achFreeLifetime: 8,
    achBoundLifetime: 4,
    success: "ACh opened ligand-gated Na+ entry and the membrane reached threshold. In real excitable cells this can trigger voltage-gated sodium channels nearby.",
    hint: "ACh appears after Run starts. Put ACh receptors in the membrane so bound ACh can open Na+ entry and reach threshold.",
    timeout: 22,
    minRunTime: 4
  },
  {
    title: "Voltage-Gated Spike",
    tag: "Action Potential",
    prompt: "ACh is jetted outside after Run starts. Use ACh receptors to reach threshold, then let voltage-gated Na+ channels open and drive the spike upward.",
    parts: ["acetylcholineReceptor", "voltageSodiumChannel"],
    molecules: "spikeIons",
    targetLabel: "potential",
    target: 40,
    tolerance: 8,
    startAtp: 60,
    startGradient: 40,
    startPotential: -30,
    achReleaseTime: 2.2,
    achReleaseCount: 6,
    achFreeLifetime: 8,
    achBoundLifetime: 4,
    success: "ACh receptors brought the membrane to threshold; voltage-gated Na+ channels opened and then inactivated.",
    hint: "Use ACh receptors to get to threshold, then add VNa gates nearby for the spike. VNa opens near -25 mV and inactivates near +35 mV.",
    timeout: 26,
    minRunTime: 5
  },
  {
    title: "Repolarize",
    tag: "Action Potential",
    prompt: "After the spike, voltage-gated K+ channels open at high voltage so K+ leaves and the cell returns toward -30 mV.",
    parts: ["delayedPotassiumChannel"],
    molecules: "repolarizeIons",
    targetLabel: "potential",
    target: -30,
    tolerance: 8,
    startAtp: 58,
    startGradient: 40,
    startPotential: 40,
    success: "Voltage-gated K+ efflux repolarized the membrane after the Na+ spike.",
    hint: "Place delayed K+ gates in the membrane. They open at high voltage so K+ efflux brings the voltage back down.",
    timeout: 20,
    minRunTime: 4
  },
  {
    title: "Hyperpolarization",
    tag: "Action Potential",
    prompt: "Start around 0 mV with voltage K+ gates open. Let K+ efflux dip below rest to about -45 mV, where the gates close.",
    parts: ["delayedPotassiumChannel"],
    molecules: "hyperIons",
    targetLabel: "potential",
    target: -45,
    tolerance: 10,
    startAtp: 58,
    startGradient: 35,
    startPotential: 0,
    success: "The membrane hyperpolarized because voltage K+ gates remained open until low voltage closed them.",
    hint: "Let delayed K+ gates keep exporting K+ until the membrane dips below rest. They close again near -42 mV.",
    timeout: 20,
    minRunTime: 4
  },
  {
    title: "Reset The Gradients",
    tag: "Na+/K+ ATPase",
    prompt: "After a spike, Na+ is high inside and K+ is high outside. Use the Na+/K+ pump to restore Na+ outside, K+ inside, and bring voltage back toward rest.",
    parts: ["sodiumPotassiumPump"],
    molecules: "resetIons",
    targetLabel: "reset",
    target: -30,
    tolerance: 8,
    startAtp: 95,
    startGradient: 25,
    startPotential: 30,
    gradientTarget: 80,
    success: "The Na+/K+ ATPase spent ATP to rebuild the Na+/K+ gradient and return voltage toward rest.",
    hint: "Place Na+/K+ pumps where both substrates can reach them. A cycle needs three inside Na+ slots and two outside K+ slots filled.",
    timeout: 45,
    minRunTime: 6
  },
  {
    title: "Return To Rest",
    tag: "Action Potential",
    prompt: "After hyperpolarization, resting leak pathways bring the membrane back toward -30 mV.",
    parts: ["restingLeak"],
    molecules: "returnIons",
    targetLabel: "potential",
    target: -30,
    tolerance: 7,
    startAtp: 58,
    startGradient: 70,
    startPotential: -45,
    success: "Leak current returned the cell from hyperpolarization toward the resting membrane potential.",
    hint: "Resting leak channels allow K+ to drift inward only when the membrane is too negative, nudging voltage back toward -30 mV.",
    timeout: 12
  },
  {
    title: "Full Action Potential",
    tag: "Action Potential",
    prompt: "Assemble the full electrical sequence: ACh trigger, threshold, Na+ spike, K+ repolarization, hyperpolarization, and return to rest.",
    parts: ["acetylcholineReceptor", "voltageSodiumChannel", "delayedPotassiumChannel", "restingLeak"],
    molecules: "fullActionIons",
    targetLabel: "sequence",
    target: 5,
    startAtp: 64,
    startGradient: 55,
    startPotential: -30,
    achReleaseTime: 2.2,
    achReleaseCount: 12,
    achFreeLifetime: 11,
    achBoundLifetime: 3.5,
    success: "You built a simplified action potential: ACh-triggered threshold, spike, repolarization, hyperpolarization, and return to rest.",
    hint: "Build the sequence in order: ACh receptor for the trigger, VNa for the upstroke, delayed K+ for the fall, then leak to settle near rest.",
    timeout: 48,
    minRunTime: 5.5
  },
  {
    title: "Pump Repolarization",
    tag: "Na+/K+ ATPase",
    prompt: "After a spike, Na+ is high inside and K+ is high outside. Use the Na+/K+ pump to repolarize the membrane by moving 3 Na+ out for every 2 K+ in.",
    parts: ["sodiumPotassiumPump"],
    molecules: "pumpRepolarizeIons",
    targetLabel: "potential",
    target: -30,
    tolerance: 8,
    startAtp: 96,
    startGradient: 0,
    startPotential: 30,
    success: "The Na+/K+ pump repolarized the membrane by exporting one net positive charge each cycle.",
    hint: "This level is pump-only. The Na+/K+ pump exports three Na+ and imports two K+, giving one net positive charge outward per cycle.",
    timeout: 60,
    minRunTime: 6
  },
  {
    title: "Two-Spike Recovery",
    tag: "Action Potential",
    prompt: "Build a cell that can fire, recover before the next ACh pulse, and fire again. Use the Na+/K+ pump to help reset the ion distribution between signals.",
    parts: ["acetylcholineReceptor", "voltageSodiumChannel", "delayedPotassiumChannel", "restingLeak", "sodiumPotassiumPump"],
    molecules: "doubleSpikeIons",
    targetLabel: "doubleSpike",
    target: 3,
    startAtp: 96,
    startGradient: 55,
    startPotential: -30,
    achReleaseTime: 2.2,
    secondAchReleaseTime: 22,
    achReleaseCount: 14,
    secondAchReleaseCount: 28,
    achFreeLifetime: 16,
    achBoundLifetime: 3.5,
    achReleaseSide: "left",
    vnaRecoverMv: -30,
    success: "The membrane spiked, recovered before the second ACh pulse, and spiked again.",
    hint: "Prepare for two ACh pulses. The first spike must recover before the second pulse, so include K+ gates, leak, and Na+/K+ pumps.",
    timeout: 62,
    minRunTime: 24
  },
  {
    title: "Signal Propagation",
    tag: "Action Potential",
    prompt: "ACh enters from the left. Place ACh receptors at the left, then VNa and K+ gates across lanes so the voltage wave propagates left to right.",
    parts: ["acetylcholineReceptor", "voltageSodiumChannel", "delayedPotassiumChannel"],
    molecules: "propagationIons",
    targetLabel: "propagation",
    target: 1,
    startAtp: 70,
    startGradient: 55,
    startPotential: -30,
    achReleaseTime: 2.2,
    achReleaseCount: 10,
    achFreeLifetime: 10,
    achBoundLifetime: 4,
    localVoltage: true,
    achReleaseSide: "left",
    requireAchPropagationTrigger: true,
    success: "The local depolarization wave reached the rightmost membrane lane.",
    hint: "ACh must bind a receptor in the left lane first. Then VNa gates in successive lanes can carry the wave to the right.",
    timeout: 50,
    minRunTime: 6
  },
  {
    title: "Myelinated Propagation",
    tag: "Action Potential",
    prompt: "ACh enters from the left. Myelin insulates most of the membrane, so parts can only be placed in the exposed nodes of Ranvier.",
    parts: ["acetylcholineReceptor", "voltageSodiumChannel"],
    molecules: "propagationIons",
    targetLabel: "propagation",
    target: 3,
    startAtp: 70,
    startGradient: 55,
    startPotential: -30,
    achReleaseTime: 2.2,
    achReleaseCount: 10,
    achFreeLifetime: 10,
    achBoundLifetime: 4,
    localVoltage: true,
    achReleaseSide: "left",
    requireAchPropagationTrigger: true,
    myelinated: true,
    laneCount: 3,
    ranvierNodes: [0.06, 0.5, 0.94],
    nodeWidth: 120,
    propagationIonSpecs: [
      { kind: "sodium", count: 14, inside: false },
      { kind: "potassium", count: 10, inside: true },
      { kind: "potassium", count: 6, inside: false }
    ],
    success: "The signal crossed the myelinated membrane and triggered the rightmost node.",
    hint: "Use the three Ranvier nodes only: ACh receptor at the left node, then VNa gates at left, middle, and right nodes.",
    timeout: 60,
    minRunTime: 6
  },
  {
    title: "Catch Adrenaline",
    tag: "Liver Signaling",
    prompt: "Adrenaline is arriving outside a liver cell. Place a membrane receptor so the hormone can bind and start the signal.",
    parts: ["betaAdrenergicReceptor"],
    molecules: "adrenalineCascade",
    targetLabel: "cascade",
    targetKey: "receptor",
    target: 1,
    startAtp: 70,
    startGradient: 0,
    startPotential: 0,
    success: "Adrenaline bound the receptor. The liver cell has detected the fight-or-flight signal.",
    hint: "Put at least one beta-adrenergic receptor in the membrane. If several are placed, adrenaline only needs to bind one of them.",
    timeout: 18,
    minRunTime: 3
  },
  {
    title: "Relay The Signal",
    tag: "Liver Signaling",
    prompt: "Place a three-subunit G protein near the receptor so it visibly links to the activated receptor.",
    parts: ["betaAdrenergicReceptor", "gProtein"],
    molecules: "adrenalineCascade",
    targetLabel: "cascade",
    targetKey: "gProtein",
    target: 1,
    startAtp: 70,
    startGradient: 0,
    startPotential: 0,
    success: "The G protein linked to the receptor and released its alpha subunit.",
    hint: "Place the G protein next to an adrenaline receptor. The linked receptor must activate before the G alpha subunit can leave.",
    timeout: 20,
    minRunTime: 3
  },
  {
    title: "Make cAMP",
    tag: "Second Messenger",
    prompt: "Add adenylyl cyclase so the released G alpha subunit can dock and ATP can be converted into cAMP.",
    parts: ["betaAdrenergicReceptor", "gProtein", "adenylylCyclase"],
    molecules: "adrenalineCascade",
    targetLabel: "cascade",
    targetKey: "cAMP",
    target: 8,
    startAtp: 70,
    startGradient: 0,
    startPotential: 0,
    success: "Adenylyl cyclase used ATP molecules to make cAMP.",
    hint: "Keep adenylyl cyclase reachable by the triangular G alpha subunit. It makes cAMP only after G alpha docks and ATP arrives.",
    timeout: 30,
    minRunTime: 4
  },
  {
    title: "Activate PKA",
    tag: "Kinase Cascade",
    prompt: "Bind four cAMP molecules to PKA: two on each regulatory subunit. Then the catalytic subunits separate.",
    parts: ["betaAdrenergicReceptor", "gProtein", "adenylylCyclase", "proteinKinaseA"],
    molecules: "adrenalineCascade",
    targetLabel: "cascade",
    targetKey: "pka",
    target: 1,
    startAtp: 70,
    startGradient: 0,
    startPotential: 0,
    success: "Four cAMP molecules bound PKA. The catalytic subunits separated from the regulatory subunits.",
    hint: "PKA needs four cAMP molecules: two slots on each regulatory subunit. Once all four fill, the catalytic triangles separate.",
    timeout: 34,
    minRunTime: 4
  },
  {
    title: "Activate Phosphorylase Kinase",
    tag: "Kinase Cascade",
    prompt: "Release PKA catalytic subunits, then let phosphorylase kinase attract them and use ATP to activate.",
    parts: ["betaAdrenergicReceptor", "gProtein", "adenylylCyclase", "proteinKinaseA", "phosphorylaseKinase"],
    molecules: "adrenalineCascade",
    targetLabel: "cascade",
    targetKey: "phosphorylaseKinase",
    target: 1,
    startAtp: 70,
    startGradient: 0,
    startPotential: 0,
    success: "The released PKA catalytic subunits reached phosphorylase kinase, which used ATP to activate.",
    hint: "After PKA releases catalytic triangles, phosphorylase kinase attracts them into its triangular sockets and uses ATP to activate.",
    timeout: 38,
    minRunTime: 4
  },
  {
    title: "Break Down Glycogen",
    tag: "Glucose Release",
    prompt: "Complete the adrenaline cascade: phosphorylase kinase activates glycogen phosphorylase, which breaks glycogen into glucose.",
    parts: ["betaAdrenergicReceptor", "gProtein", "adenylylCyclase", "proteinKinaseA", "phosphorylaseKinase", "glycogenPhosphorylase"],
    molecules: "adrenalineCascade",
    targetLabel: "cascade",
    targetKey: "glucose",
    target: 8,
    startAtp: 70,
    startGradient: 0,
    startPotential: 0,
    success: "Glycogen was broken down into glucose. The liver cell has mobilized stored fuel.",
    hint: "Finish the cascade, then keep glycogen phosphorylase near the glycogen chain so glucose units are removed at its active center.",
    timeout: 60,
    minRunTime: 5
  }
];

let state = {};
let levelIndex = 0;
let lastTime = 0;
let drag = null;
let pointer = { x: 0, y: 0 };
const PORE_REACH_X = 42;
const LOCAL_ATTRACTION_X = 150;
const PUMP_NA_OFFSETS = [-26, 0, 26];
const PUMP_K_OFFSETS = [-15, 15];
const VNA_OPEN_MV = -25;
const VNA_INACTIVATE_MV = 35;
const VK_OPEN_MV = 0;
const VK_CLOSE_MV = -42;
const RECEPTOR_RADIUS = 42;
const PROPAGATION_LANES = 6;
const RESERVOIR_RESPAWN_MARGIN = 34;
const RESERVOIR_ENTRY_MARGIN = 26;

function resetLevel(keepParts = false) {
  const level = levels[levelIndex];
  const keptParts = keepParts && state.parts ? state.parts.map(resetPart) : [];
  state = {
    running: false,
    paused: false,
    won: false,
    freeRun: false,
    time: 0,
    goalReachedAt: null,
    atp: level.startAtp,
    gradient: level.startGradient,
    potential: level.startPotential || 0,
    imported: 0,
    parts: keptParts,
    selectedPartId: keptParts[0] ? keptParts[0].id : null,
    molecules: makeMolecules(level),
    potentialTrace: [],
    propagatedParts: [],
    propagatedLanes: [],
    propagatedLaneEvents: [],
    propagationCursor: 0,
    achTriggeredLanes: [],
    lanes: null,
    achReleased: false,
    achReleaseIndex: 0,
    adrReleased: false,
    adrReleaseIndex: 0,
    tutorialStep: 0,
    lastTraceTime: -1,
    flash: 0,
    leakTimer: 0,
    sequence: {
      threshold: false,
      peak: false,
      repolarized: false,
      hyperpolarized: false,
      rested: false
    },
    sequenceEvents: {},
    doubleSpike: {
      firstSpike: false,
      repolarizedBeforeSecond: false,
      secondPulse: false,
      secondSpike: false
    },
    doubleSpikeEvents: {},
    cascade: {
      receptor: false,
      gProtein: false,
      cyclase: false,
      cAMP: 0,
      pka: false,
      phosphorylaseKinase: false,
      phosphorylase: false,
      glucose: 0,
      glucoseReleased: 0
    }
  };
  updateElectricState();
  state.potentialTrace = [{ time: 0, potential: state.potential }];
  updateLevelUi();
  setFeedback(level.tutorial ? "Explore the layout, drag a practice part if you like, then use the right arrow to start Unit 1." : level.parts.length === 0 ? "Press Run to start diffusion." : state.parts.length ? "Cell setup reset. Press Run to test the same assembly again." : "Drag parts from the toolbox onto the membrane, then press Run.", "");
}

function resetPart(part) {
  return {
    ...part,
    active: false,
    inactivated: false,
    pulse: 0,
    boundACh: part.type === "acetylcholineReceptor" ? null : part.boundACh,
    boundAdrenaline: part.type === "betaAdrenergicReceptor" ? null : part.boundAdrenaline,
    linkedReceptor: part.type === "gProtein" ? null : part.linkedReceptor,
    alphaReleased: part.type === "gProtein" ? false : part.alphaReleased,
    boundGAlpha: part.type === "adenylylCyclase" ? null : part.boundGAlpha,
    phosphorylatedByPka: false,
    phosphorylatedByPhk: false,
    phosphateMarks: 0,
    boundCamp: part.type === "proteinKinaseA" ? [null, null, null, null] : part.boundCamp,
    catalyticReleased: part.type === "proteinKinaseA" ? false : part.catalyticReleased,
    boundCatalytic: part.type === "phosphorylaseKinase" ? [null, null] : part.boundCatalytic,
    glycogenActiveSide: part.type === "glycogenPhosphorylase" ? -1 : part.glycogenActiveSide,
    glycogenTimer: part.type === "glycogenPhosphorylase" ? 0 : part.glycogenTimer,
    boundNa: part.type === "sodiumPotassiumPump" ? [null, null, null] : null,
    boundK: part.type === "sodiumPotassiumPump" ? [null, null] : null
  };
}

function makeMolecules(level) {
  const kind = level.molecules;
  const list = [];
  const b = board();
  if (kind === "tutorial") return list;
  if (level.localVoltage && kind === "propagationIons") return makePropagationMolecules(level, b);
  if (kind === "adrenalineCascade") return makeAdrenalineMolecules(b);
  const specs = moleculeSpecs(kind);
  const total = specs.reduce((sum, s) => sum + s.count, 0);
  const remaining = specs.map((spec) => ({ ...spec }));
  let index = 0;
  while (remaining.some((spec) => spec.count > 0)) {
    for (const spec of remaining) {
      if (spec.count <= 0) continue;
      const laneX = 70 + ((index + 0.5) / total) * (b.width - 140) + randomRange(-22, 22);
      list.push(createMolecule(spec.kind, laneX, spec.inside, b));
      spec.count -= 1;
      index += 1;
    }
  }
  return list;
}

function makeAdrenalineMolecules(b) {
  const list = [];
  const specs = [{ kind: "atp", count: 24, inside: true }];
  const total = specs.reduce((sum, s) => sum + s.count, 0);
  let index = 0;
  for (const spec of specs) {
    for (let i = 0; i < spec.count; i += 1) {
      const laneX = 70 + ((index + 0.5) / total) * (b.width - 140) + randomRange(-22, 22);
      list.push(createMolecule(spec.kind, laneX, spec.inside, b));
      index += 1;
    }
  }

  for (let i = 0; i < 2; i += 1) {
    const chain = createMolecule("glycogenChain", b.width * (0.32 + i * 0.32), true, b);
    chain.y = b.membraneY + b.membraneH + 190 + i * 42;
    chain.vx = randomRange(-3, 3);
    chain.vy = randomRange(-3, 3);
    chain.units = makeGlycogenUnits(i);
    list.push(chain);
  }
  return list;
}

function makeGlycogenUnits(seed) {
  const units = [];
  const count = 12;
  const spacing = 15;
  for (let i = 0; i < count; i += 1) {
    units.push({
      dx: (i - (count - 1) / 2) * spacing,
      dy: Math.sin(i * 0.9 + seed) * 10,
      used: false
    });
  }
  return units;
}

function makePropagationMolecules(level, b) {
  const list = [];
  const laneCount = laneCountForLevel(level);
  const specs = level.propagationIonSpecs || [
    { kind: "sodium", count: 10, inside: false },
    { kind: "potassium", count: 6, inside: true },
    { kind: "potassium", count: 6, inside: false }
  ];
  for (let lane = 0; lane < laneCount; lane += 1) {
    const laneLeft = (lane / laneCount) * b.width;
    const laneRight = ((lane + 1) / laneCount) * b.width;
    for (const spec of specs) {
      for (let i = 0; i < spec.count; i += 1) {
        const laneX = randomRange(laneLeft + 32, laneRight - 32);
        list.push(createMolecule(spec.kind, laneX, spec.inside, b));
      }
    }
  }
  return list;
}

function moleculeSpecs(kind) {
  if (kind === "balancedIon") return [{ kind: "ion", count: 18, inside: false }, { kind: "ion", count: 18, inside: true }];
  if (kind === "proton") return [{ kind: "proton", count: 24, inside: false }, { kind: "proton", count: 6, inside: true }];
  if (kind === "balancedProton") return [{ kind: "proton", count: 10, inside: false }, { kind: "proton", count: 10, inside: true }];
  if (kind === "hPump") return [{ kind: "proton", count: 12, inside: false }, { kind: "proton", count: 12, inside: true }];
  if (kind === "restingIons") return [{ kind: "sodium", count: 14, inside: false }, { kind: "potassium", count: 10, inside: true }];
  if (kind === "actionIons") return [{ kind: "sodium", count: 24, inside: false }, { kind: "potassium", count: 14, inside: true }];
  if (kind === "thresholdIons") return [{ kind: "sodium", count: 18, inside: false }, { kind: "potassium", count: 8, inside: true }];
  if (kind === "spikeIons") return [{ kind: "sodium", count: 24, inside: false }, { kind: "potassium", count: 14, inside: true }];
  if (kind === "repolarizeIons") return [{ kind: "sodium", count: 11, inside: false }, { kind: "potassium", count: 24, inside: true }];
  if (kind === "hyperIons") return [{ kind: "sodium", count: 18, inside: false }, { kind: "potassium", count: 18, inside: true }];
  if (kind === "resetIons") return [{ kind: "sodium", count: 30, inside: true }, { kind: "potassium", count: 20, inside: false }];
  if (kind === "pumpRepolarizeIons") return [{ kind: "sodium", count: 30, inside: true }, { kind: "potassium", count: 20, inside: false }];
  if (kind === "returnIons") return [{ kind: "sodium", count: 24, inside: false }, { kind: "potassium", count: 14, inside: true }, { kind: "potassium", count: 5, inside: false }];
  if (kind === "fullActionIons") return [{ kind: "sodium", count: 43, inside: false }, { kind: "potassium", count: 38, inside: true }, { kind: "potassium", count: 5, inside: false }];
  if (kind === "doubleSpikeIons") return [{ kind: "sodium", count: 90, inside: false }, { kind: "potassium", count: 85, inside: true }, { kind: "potassium", count: 5, inside: false }];
  if (kind === "propagationIons") return [{ kind: "sodium", count: 36, inside: false }, { kind: "potassium", count: 30, inside: true }, { kind: "potassium", count: 4, inside: false }];
  if (kind === "adrenalineCascade") return [{ kind: "atp", count: 24, inside: true }];
  return [{ kind, count: 18, inside: kind === "ion" }];
}

function createMolecule(kind, laneX, startInside, b) {
  const styles = {
    oxygen: { color: "#3b82f6", label: "O2", charge: 0 },
    glucose: { color: "#22c55e", label: "G", charge: 0 },
    ion: { color: "#ef4444", label: "+", charge: 1 },
    signal: { color: "#a855f7", label: "S", charge: 0 },
    acetylcholine: { color: "#c084fc", label: "ACh", charge: 0 },
    adrenaline: { color: "#f472b6", label: "Adr", charge: 0 },
    atp: { color: "#8b5cf6", label: "ATP", charge: 0 },
    adp: { color: "#7c3aed", label: "ADP", charge: 0 },
    phosphate: { color: "#a78bfa", label: "P", charge: 0 },
    pyrophosphate: { color: "#a78bfa", label: "PPi", charge: 0 },
    gAlpha: { color: "#14b8a6", label: "Gα", charge: 0 },
    cAMP: { color: "#38bdf8", label: "cAMP", charge: 0 },
    pkaCatalytic: { color: "#f59e0b", label: "Cat", charge: 0 },
    glycogen: { color: "#b45309", label: "Gly", charge: 0 },
    glycogenChain: { color: "#b45309", label: "Gly", charge: 0 },
    liverGlucose: { color: "#22c55e", label: "Glu", charge: 0 },
    proton: { color: "#eab308", label: "H+", charge: 1 },
    sodium: { color: "#0ea5e9", label: "Na+", charge: 1 },
    potassium: { color: "#84cc16", label: "K+", charge: 1 }
  };
  const style = styles[kind];
  const isGlycogen = kind === "glycogen" || kind === "glycogenChain";
  const vx = kind === "oxygen" ? randomRange(-42, 42) : isGlycogen ? randomRange(-4, 4) : randomRange(-22, 22);
  const vy = kind === "oxygen" ? randomRange(-42, 42) : isGlycogen ? randomRange(-4, 4) : startInside ? -16 - Math.random() * 20 : 16 + Math.random() * 20;
  return {
    x: laneX,
    y: startInside ? b.membraneY + b.membraneH + 45 + Math.random() * 150 : 50 + Math.random() * Math.max(80, b.membraneY - 95),
    vx,
    vy,
    diffusionBias: kind === "oxygen" ? randomRange(0.45, 1.35) : 1,
    membraneDelay: kind === "oxygen" ? randomRange(0, 1.8) : 0,
    laneX,
    kind,
    charge: style.charge,
    color: style.color,
    label: style.label,
    inside: startInside,
    age: 0,
    boundPart: null,
    boundAge: 0,
    used: false
  };
}

function updateLevelUi() {
  const level = levels[levelIndex];
  const unit = levelUnitPosition(levelIndex);
  el.levelCounter.textContent = unit.tutorial ? "Tutorial" : `Unit ${unit.unit} Level ${unit.level}`;
  el.levelTag.textContent = level.tag;
  el.levelTitle.textContent = level.title;
  el.levelPrompt.textContent = level.prompt;
  el.prevLevel.disabled = false;
  el.nextLevel.disabled = false;
  renderTutorialPanel(level);
  el.dropHint.textContent = level.parts.length === 0 ? "Press Run to start diffusion." : state.parts.length ? "Press Run to test the cell." : "Drag parts onto the membrane, then press Run.";
  updatePauseButton();
  renderToolbox(level.parts);
  applyLevelVisibility(level);
  updateMeters();
}

function levelUnitPosition(index) {
  if (levels[index]?.tutorial) return { tutorial: true };
  const firstUnitStart = firstPlayableLevelIndex();
  const adrenalineStart = levels.findIndex((level) => level.molecules === "adrenalineCascade");
  if (adrenalineStart < 0 || index < adrenalineStart) return { unit: 1, level: index - firstUnitStart + 1 };
  return { unit: 2, level: index - adrenalineStart + 1 };
}

function firstPlayableLevelIndex() {
  const index = levels.findIndex((level) => !level.tutorial);
  return index < 0 ? 0 : index;
}

function renderTutorialPanel(level) {
  if (!level.tutorial) {
    el.tutorialPanel.classList.add("is-hidden");
    el.tutorialPanel.innerHTML = "";
    document.body.classList.remove("tutorial-active");
    delete document.body.dataset.tutorialTarget;
    delete document.body.dataset.tutorialStep;
    return;
  }
  const stepIndex = Math.max(0, Math.min(state.tutorialStep || 0, level.tutorialSteps.length - 1));
  const [title, text, target] = level.tutorialSteps[stepIndex];
  state.tutorialStep = stepIndex;
  document.body.classList.add("tutorial-active");
  document.body.dataset.tutorialTarget = target;
  document.body.dataset.tutorialStep = String(stepIndex + 1);
  el.tutorialPanel.classList.remove("is-hidden");
  el.tutorialPanel.innerHTML = `
    <div class="tutorial-step is-current">
      <small>Step ${stepIndex + 1} / ${level.tutorialSteps.length}</small>
      <strong>${title}</strong>
      <span>${text}</span>
    </div>
    <div class="tutorial-controls">
      <button type="button" data-tutorial-action="prev" ${stepIndex === 0 ? "disabled" : ""}>Back</button>
      <button type="button" data-tutorial-action="skip">Skip tutorial</button>
      <button type="button" class="primary" data-tutorial-action="next">${stepIndex === level.tutorialSteps.length - 1 ? "Start Unit 1" : "Next"}</button>
    </div>
  `;
}

function startFirstPlayableLevel() {
  levelIndex = firstPlayableLevelIndex();
  resetLevel();
}

function updatePauseButton() {
  el.pauseButton.textContent = state.paused ? "Unpause" : "Pause";
}

function potentialUiHiddenForLevel(level) {
  const voltageTargets = ["potential", "reset", "sequence", "doubleSpike", "propagation"];
  return level.tutorial || !voltageTargets.includes(level.targetLabel);
}

function applyLevelVisibility(level) {
  const hidePotentialUi = potentialUiHiddenForLevel(level);
  const hideAtpUi = level.tutorial;
  const atpRow = el.atpMeter.closest ? el.atpMeter.closest(".meter-row") : null;
  if (atpRow) atpRow.classList.toggle("is-hidden", hideAtpUi);
  el.potentialRow.classList.toggle("is-hidden", hidePotentialUi);
  el.potentialPlotPanel.classList.toggle("is-hidden", hidePotentialUi);
}

function updateMeters() {
  const level = levels[levelIndex];
  updateElectricState();
  const colors = compartmentColors();
  document.body.dataset.parts = state.parts.map((part) => part.type).join(",");
  document.body.dataset.openParts = state.parts.filter(isPartOpen).map((part) => part.type).join(",");
  document.body.dataset.sequence = state.sequence ? ["threshold", "peak", "repolarized", "hyperpolarized", "rested"].filter((key) => state.sequence[key]).join(",") : "";
  document.body.dataset.outsideColor = colors.outside;
  document.body.dataset.insideColor = colors.inside;
  const gradientMetric = levelGradientMetric(level);
  const hidePotentialUi = potentialUiHiddenForLevel(level);
  const atpDisplay = level.molecules === "adrenalineCascade" ? availableAtpCount() : Math.round(state.atp);
  el.atpMeter.value = atpDisplay;
  el.gradientLabel.textContent = gradientMetric.label;
  el.gradientMeter.value = Math.round(gradientMetric.value);
  el.potentialMeter.value = Math.round(state.potential);
  el.atpValue.textContent = atpDisplay;
  el.potentialValue.textContent = `${Math.round(state.potential)} mV`;
  if (!hidePotentialUi) drawPotentialPlot(level);
  el.gradientValue.textContent = gradientMetric.text;
  el.targetValue.textContent = targetText(level, gradientMetric);
}

function availableAtpCount() {
  return (state.molecules || []).filter((m) => !m.used && m.kind === "atp").length;
}

function targetText(level, gradientMetric) {
  if (level.targetLabel === "tutorial") return state.won ? "Ready" : "Try the controls";
  if (level.targetLabel === "gradient") {
    return `${gradientMetric.label} ${Math.round(gradientMetric.value)} / ${level.target}`;
  }
  if (level.targetLabel === "ATP") return `ATP ${Math.round(state.atp)} / ${level.target}`;
  if (level.targetLabel === "potential") return `V ${Math.round(state.potential)} / ${level.target} +/- ${level.tolerance || 4} mV`;
  if (level.targetLabel === "reset") {
    const voltageMax = level.target + (level.tolerance || 4);
    return `${gradientMetric.label} ${Math.round(gradientMetric.value)} / ${level.gradientTarget || 55}; V ${Math.round(state.potential)} <= ${voltageMax} mV`;
  }
  if (level.targetLabel === "sequence") return sequenceTargetText(level);
  if (level.targetLabel === "doubleSpike") return doubleSpikeTargetText(level);
  if (level.targetLabel === "cascade") return cascadeTargetText(level);
  if (level.targetLabel === "propagation") return propagationTargetText();
  if (level.targetLabel === "equilibrium") {
    const counts = oxygenCounts(true);
    const total = counts.inside + counts.outside;
    return `O2 in ${counts.inside} / ${Math.round(total / 2)}`;
  }
  return `${targetNoun(level)} ${state.imported} / ${level.target}`;
}

function targetNoun(level) {
  if (level.targetLabel === "glucose") return "Glucose in";
  if (level.targetLabel === "ions") return "Gate crossings";
  return level.targetLabel;
}

function sequenceProgress() {
  if (!state.sequence) return 0;
  return ["threshold", "peak", "repolarized", "hyperpolarized", "rested"].filter((key) => state.sequence[key]).length;
}

function sequenceTargetText(level) {
  const eventText = eventTimeText(state.sequenceEvents?.peak);
  return eventText ? `Phases ${sequenceProgress()} / ${level.target}; AP ${eventText}` : `Phases ${sequenceProgress()} / ${level.target}; AP not yet`;
}

function doubleSpikeProgress() {
  if (!state.doubleSpike) return 0;
  return ["firstSpike", "repolarizedBeforeSecond", "secondSpike"].filter((key) => state.doubleSpike[key]).length;
}

function doubleSpikeTargetText(level) {
  const first = eventTimeText(state.doubleSpikeEvents?.firstSpike);
  const second = eventTimeText(state.doubleSpikeEvents?.secondSpike);
  if (first && second) return `Cycle ${doubleSpikeProgress()} / ${level.target}; APs ${first}, ${second}`;
  if (first) return `Cycle ${doubleSpikeProgress()} / ${level.target}; AP1 ${first}`;
  return `Cycle ${doubleSpikeProgress()} / ${level.target}; AP not yet`;
}

function propagationTargetText() {
  const latest = latestPropagatedLaneEvent();
  const latestText = latest ? `; L${latest.lane + 1} ${eventTimeText(latest.time)}` : "; no lane yet";
  return `Wave ${propagationProgress()} / ${laneCountForLevel()}${latestText}`;
}

function latestPropagatedLaneEvent() {
  const events = state.propagatedLaneEvents || [];
  return events.length ? events[events.length - 1] : null;
}

function eventTimeText(time) {
  return Number.isFinite(time) ? `${time.toFixed(1)}s` : "";
}

function cascadeTargetText(level) {
  const value = cascadeTargetValue(level);
  const required = cascadeTargetRequired(level);
  const labels = {
    receptor: "Receptor",
    gProtein: "G protein",
    cAMP: "cAMP",
    pka: "PKA",
    phosphorylaseKinase: "Phosphorylase kinase",
    glucose: "Glucose"
  };
  return `${labels[level.targetKey] || "Cascade"} ${Math.round(value)} / ${required}`;
}

function cascadeTargetValue(level) {
  const cascade = state.cascade || {};
  if (level.targetKey === "receptor") return (state.parts || []).filter((part) => part.type === "betaAdrenergicReceptor" && part.active).length;
  if (level.targetKey === "gProtein") return (state.parts || []).filter((part) => part.type === "gProtein" && part.active).length;
  if (level.targetKey === "cAMP") return cascade.cAMP || 0;
  if (level.targetKey === "pka") return (state.parts || []).filter((part) => part.type === "proteinKinaseA" && part.active).length;
  if (level.targetKey === "phosphorylaseKinase") return (state.parts || []).filter((part) => part.type === "phosphorylaseKinase" && part.active).length;
  if (level.targetKey === "glucose") return cascade.glucose || 0;
  return 0;
}

function cascadeTargetRequired(level) {
  if (level.targetKey === "receptor") {
    return level.target;
  }
  if (level.targetKey === "gProtein") {
    return Math.max(level.target, (state.parts || []).filter((part) => part.type === "gProtein").length);
  }
  if (level.targetKey === "pka") {
    return Math.max(level.target, (state.parts || []).filter((part) => part.type === "proteinKinaseA").length);
  }
  if (level.targetKey === "phosphorylaseKinase") {
    return Math.max(level.target, (state.parts || []).filter((part) => part.type === "phosphorylaseKinase").length);
  }
  return level.target;
}

function propagationProgress() {
  return Math.min(state.propagationCursor || 0, laneCountForLevel());
}

function signalPropagatedLeftToRight() {
  return propagationProgress() >= laneCountForLevel();
}

function trackPropagationWave(level) {
  if (level.targetLabel !== "propagation" || !level.localVoltage || !state.lanes) return;
  let advanced = true;
  while (advanced && propagationProgress() < laneCountForLevel()) {
    advanced = false;
    const lane = propagationProgress();
    const laneVoltage = state.lanes[lane]?.potential ?? -Infinity;
    if (!propagationTriggerSatisfied(level, lane)) return;
    if (laneVoltage < VNA_OPEN_MV || !laneHasVoltageSodiumChannel(lane)) return;
    recordPropagatedLane(lane);
    advanced = true;
  }
}

function laneHasVoltageSodiumChannel(lane) {
  return (state.parts || []).some((part) => part.type === "voltageSodiumChannel" && laneIndexForX(part.x) === lane);
}

function recordPropagatedLane(lane, part = null) {
  const level = levels[levelIndex];
  if (!propagationTriggerSatisfied(level, lane)) return false;
  const expectedLane = state.propagationCursor || 0;
  if (lane !== expectedLane) return false;
  if (part && !state.propagatedParts.includes(part.id)) state.propagatedParts.push(part.id);
  state.propagationCursor = expectedLane + 1;
  state.propagatedLaneEvents = [...(state.propagatedLaneEvents || []), { lane, time: state.time }];
  state.propagatedLanes = Array.from(new Set([...(state.propagatedLanes || []), lane])).sort((a, b) => a - b);
  return true;
}

function propagationTriggerSatisfied(level, lane) {
  if (!level?.requireAchPropagationTrigger || lane !== 0) return true;
  return (state.achTriggeredLanes || []).includes(0);
}

function markAChPropagationTrigger(part) {
  const level = levels[levelIndex];
  if (!level?.requireAchPropagationTrigger || level.targetLabel !== "propagation") return;
  const lane = laneIndexForX(part.x);
  if (!state.achTriggeredLanes.includes(lane)) state.achTriggeredLanes.push(lane);
}

function chargeCounts() {
  let inside = 0;
  let outside = 0;
  for (const m of state.molecules || []) {
    if (!m.charge || m.used) continue;
    if (m.inside) inside += m.charge;
    else outside += m.charge;
  }
  return { inside, outside };
}

function oxygenCounts(usePosition = false) {
  let inside = 0;
  let outside = 0;
  const b = usePosition ? board() : null;
  for (const m of state.molecules || []) {
    if (m.kind !== "oxygen" || m.used) continue;
    const isInside = usePosition ? m.y >= b.membraneY + b.membraneH : m.inside;
    if (isInside) inside += 1;
    else outside += 1;
  }
  return { inside, outside };
}

function moleculeCounts(kinds) {
  const accepted = Array.isArray(kinds) ? kinds : [kinds];
  let inside = 0;
  let outside = 0;
  for (const m of state.molecules || []) {
    if (m.used || !accepted.includes(m.kind)) continue;
    if (m.inside) inside += 1;
    else outside += 1;
  }
  return { inside, outside, total: inside + outside };
}

function separationPercent(counts, direction) {
  if (!counts.total) return 0;
  const raw = direction === "inside" ? counts.inside - counts.outside : counts.outside - counts.inside;
  return Math.max(0, Math.min(100, Math.round((raw / counts.total) * 100)));
}

function differencePercent(counts) {
  if (!counts.total) return 0;
  return Math.round((Math.abs(counts.inside - counts.outside) / counts.total) * 100);
}

function naKGradientPercent() {
  const na = moleculeCounts("sodium");
  const k = moleculeCounts("potassium");
  const naRestored = na.total ? na.outside / na.total : 0;
  const kRestored = k.total ? k.inside / k.total : 0;
  return Math.max(0, Math.min(100, Math.round(((naRestored + kRestored) / 2) * 100)));
}

function levelGradientMetric(level) {
  if (level.molecules === "tutorial") return { label: "Practice", value: state.parts.length ? 100 : 0, text: state.parts.length ? "part placed" : "no parts" };
  if (level.molecules === "oxygen") {
    const counts = oxygenCounts(true);
    return concentrationMetric("O2 diff", { ...counts, total: counts.inside + counts.outside }, "difference");
  }
  if (level.molecules === "glucose") return concentrationMetric("Glucose diff", moleculeCounts("glucose"), "outside");
  if (level.molecules === "adrenalineCascade") return { label: "cAMP", value: Math.min(100, (state.cascade?.cAMP || 0) * 8), text: String(Math.round(state.cascade?.cAMP || 0)) };
  if (level.molecules === "signal") return concentrationMetric("Signal diff", moleculeCounts("signal"), "outside");
  if (level.molecules === "ion" || level.molecules === "balancedIon") return concentrationMetric("Ion gradient", moleculeCounts("ion"), "outside");
  if (level.molecules === "proton" || level.molecules === "balancedProton" || level.molecules === "hPump") return concentrationMetric("H+ gradient", moleculeCounts("proton"), "outside");
  if (["restingIons", "actionIons", "thresholdIons", "spikeIons", "resetIons", "returnIons", "fullActionIons", "doubleSpikeIons", "pumpRepolarizeIons", "propagationIons"].includes(level.molecules)) {
    return concentrationMetric("Na/K grad", { value: naKGradientPercent() }, "preset");
  }
  if (level.molecules === "repolarizeIons" || level.molecules === "hyperIons") return concentrationMetric("K+ gradient", moleculeCounts("potassium"), "inside");
  return { label: "Gradient", value: Math.round(state.gradient), text: String(Math.round(state.gradient)) };
}

function concentrationMetric(label, counts, mode) {
  const value = mode === "preset" ? counts.value : mode === "difference" ? differencePercent(counts) : separationPercent(counts, mode);
  if (mode === "preset") return { label, value, text: String(value) };
  return { label, value, text: `${value} (${counts.inside}/${counts.outside})` };
}

function updateElectricState() {
  const level = levels[levelIndex];
  if (level && level.localVoltage) {
    updateLaneVoltages();
    return;
  }
  const charges = chargeCounts();
  state.potential = Math.max(-80, Math.min(60, Math.round((charges.inside - charges.outside) * 3)));
}

function updateLaneVoltages() {
  const level = levels[levelIndex];
  const differences = laneChargeDifferences();
  const laneCount = laneCountForLevel(level);
  const lanes = Array.from({ length: laneCount }, () => ({ inside: 0, outside: 0, raw: level.startPotential || -30, potential: level.startPotential || -30 }));
  for (let i = 0; i < lanes.length; i += 1) {
    lanes[i].inside = Math.max(0, differences[i]);
    lanes[i].outside = Math.max(0, -differences[i]);
    lanes[i].raw = Math.max(-80, Math.min(60, Math.round(differences[i] * 3)));
    lanes[i].potential = lanes[i].raw;
  }
  state.lanes = lanes;
  state.potential = Math.max(...lanes.map((lane) => lane.potential));
}

function laneChargeDifferences() {
  const laneCount = laneCountForLevel();
  const differences = Array.from({ length: laneCount }, () => 0);
  for (const m of state.molecules || []) {
    if (!m.charge || m.used) continue;
    const index = laneIndexForX(m.x);
    differences[index] += m.inside ? m.charge : -m.charge;
  }
  return differences;
}

function laneIndexForX(x) {
  const b = board();
  const laneCount = laneCountForLevel();
  return Math.max(0, Math.min(laneCount - 1, Math.floor((x / Math.max(1, b.width)) * laneCount)));
}

function laneCountForLevel(level = levels[levelIndex]) {
  return level?.laneCount || PROPAGATION_LANES;
}

function partVoltage(part) {
  const level = levels[levelIndex];
  if (!level || !level.localVoltage || !state.lanes) return state.potential;
  return state.lanes[laneIndexForX(part.x)]?.potential ?? state.potential;
}

function recordPotentialSample() {
  if (!state.running || !state.potentialTrace) return;
  if (state.lastTraceTime >= 0 && state.time - state.lastTraceTime < 0.12) return;
  state.potentialTrace.push({ time: state.time, potential: state.potential });
  state.lastTraceTime = state.time;
}

function drawPotentialPlot(level) {
  const plot = el.potentialPlot;
  if (!plot) return;
  const plotCtx = plot.getContext("2d");
  const width = plot.width;
  const height = plot.height;
  const padLeft = 34;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 24;
  const graphW = width - padLeft - padRight;
  const graphH = height - padTop - padBottom;
  const minMv = -80;
  const maxMv = 60;
  const trace = state.potentialTrace && state.potentialTrace.length ? state.potentialTrace : [{ time: 0, potential: state.potential }];
  const last = trace[trace.length - 1];
  const maxT = Math.max(level.timeout || 8, last.time || 0, 4);
  const xOf = (time) => padLeft + Math.min(1, time / maxT) * graphW;
  const yOf = (mv) => padTop + ((maxMv - mv) / (maxMv - minMv)) * graphH;

  plotCtx.clearRect(0, 0, width, height);
  plotCtx.fillStyle = "#fbfcfc";
  plotCtx.fillRect(0, 0, width, height);

  plotCtx.strokeStyle = "#d8e2df";
  plotCtx.lineWidth = 1;
  plotCtx.strokeRect(padLeft, padTop, graphW, graphH);

  const referenceLines = [
    { mv: 40, label: "+40" },
    { mv: 0, label: "0" },
    { mv: -30, label: "-30" },
    { mv: -80, label: "-80" }
  ];
  plotCtx.font = "700 10px Inter, sans-serif";
  plotCtx.textAlign = "right";
  plotCtx.textBaseline = "middle";
  for (const line of referenceLines) {
    const y = yOf(line.mv);
    plotCtx.strokeStyle = line.mv === 0 ? "#9fb8b1" : "#e3ebe8";
    plotCtx.beginPath();
    plotCtx.moveTo(padLeft, y);
    plotCtx.lineTo(padLeft + graphW, y);
    plotCtx.stroke();
    plotCtx.fillStyle = "#65756f";
    plotCtx.fillText(line.label, padLeft - 5, y);
  }

  plotCtx.strokeStyle = "#0f766e";
  plotCtx.lineWidth = 2.5;
  plotCtx.beginPath();
  trace.forEach((sample, index) => {
    const x = xOf(sample.time);
    const y = yOf(sample.potential);
    if (index === 0) plotCtx.moveTo(x, y);
    else plotCtx.lineTo(x, y);
  });
  plotCtx.stroke();

  plotCtx.fillStyle = "#0f766e";
  plotCtx.beginPath();
  plotCtx.arc(xOf(last.time), yOf(last.potential), 3.5, 0, Math.PI * 2);
  plotCtx.fill();

  plotCtx.fillStyle = "#65756f";
  plotCtx.textAlign = "left";
  plotCtx.textBaseline = "alphabetic";
  plotCtx.fillText("0s", padLeft, height - 7);
  plotCtx.textAlign = "right";
  plotCtx.fillText(`${Math.round(maxT)}s`, padLeft + graphW, height - 7);

  if (el.plotReadout) el.plotReadout.textContent = `${last.time.toFixed(1)}s / ${Math.round(last.potential)} mV`;
}

function renderToolbox(parts) {
  el.toolbox.innerHTML = "";
  for (const id of parts) {
    const part = partTypes[id];
    const card = document.createElement("div");
    card.className = "part-card";
    card.draggable = true;
    card.dataset.part = id;
    card.innerHTML = `
      <div class="part-icon" style="background:${part.color}">${part.short}</div>
      <div><strong>${part.name}</strong><span>${part.text}</span></div>
    `;
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", id);
    });
    card.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      drag = { type: id, fromToolbox: true };
      pointer = screenToCanvas(event);
    });
    card.addEventListener("mouseenter", () => showPartInfo(part));
    card.addEventListener("pointerenter", () => showPartInfo(part));
    card.addEventListener("focus", () => showPartInfo(part));
    el.toolbox.appendChild(card);
  }
  const level = levels[levelIndex];
  if (level.tutorial) {
    el.partInfo.innerHTML = levelTipHtml(level, "Practice Parts");
  } else {
    el.partInfo.innerHTML = levelTipHtml(level);
  }
}

function showPartInfo(part) {
  el.partInfo.innerHTML = partInfoHtml(part);
}

el.toolbox.addEventListener("mousemove", (event) => {
  const card = event.target.closest(".part-card");
  if (card && partTypes[card.dataset.part]) showPartInfo(partTypes[card.dataset.part]);
});

el.toolbox.addEventListener("pointermove", (event) => {
  const card = event.target.closest(".part-card");
  if (card && partTypes[card.dataset.part]) showPartInfo(partTypes[card.dataset.part]);
});

el.tutorialPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tutorial-action]");
  if (!button || !levels[levelIndex].tutorial) return;
  const action = button.dataset.tutorialAction;
  if (action === "prev") {
    state.tutorialStep = Math.max(0, (state.tutorialStep || 0) - 1);
    updateLevelUi();
    return;
  }
  if (action === "skip") {
    startFirstPlayableLevel();
    return;
  }
  if (action === "next") {
    const steps = levels[levelIndex].tutorialSteps || [];
    if ((state.tutorialStep || 0) >= steps.length - 1) {
      startFirstPlayableLevel();
      return;
    }
    state.tutorialStep = Math.min(steps.length - 1, (state.tutorialStep || 0) + 1);
    updateLevelUi();
  }
});

function partInfoHtml(part) {
  return `<strong>${part.name}</strong><p>${part.text}</p><p>${part.behavior}</p>`;
}

function levelTipHtml(level, title = "Tip") {
  return `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(level.hint || "Use the current target to decide which parts to place and when to press Run.")}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setFeedback(message, tone) {
  el.feedback.textContent = message;
  el.feedback.className = `feedback ${tone || ""}`.trim();
}

function board() {
  const width = canvas.width;
  const height = canvas.height;
  const level = levels[levelIndex] || {};
  const membraneFraction = level.molecules === "adrenalineCascade" ? 0.32 : 0.47;
  return {
    width,
    height,
    membraneY: Math.round(height * membraneFraction),
    membraneH: 86,
    outsideH: Math.round(height * membraneFraction)
  };
}

function addPart(type, x, y) {
  const level = levels[levelIndex];
  const b = board();
  const clampedX = Math.max(70, Math.min(b.width - 70, x));
  if (level.myelinated && !isPartFullyInRanvierNode(level, type, clampedX, b)) {
    setFeedback("Parts can only be placed in Ranvier node gaps.", "warning");
    return false;
  }
  const part = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    type,
    x: clampedX,
    y: partYForPlacement(type, y, b),
    active: false,
    inactivated: false,
    pulse: 0,
    boundACh: type === "acetylcholineReceptor" ? null : undefined,
    boundAdrenaline: type === "betaAdrenergicReceptor" ? null : undefined,
    linkedReceptor: type === "gProtein" ? null : undefined,
    alphaReleased: type === "gProtein" ? false : undefined,
    boundGAlpha: type === "adenylylCyclase" ? null : undefined,
    phosphorylatedByPka: false,
    phosphorylatedByPhk: false,
    phosphateMarks: 0,
    boundCamp: type === "proteinKinaseA" ? [null, null, null, null] : null,
    catalyticReleased: type === "proteinKinaseA" ? false : undefined,
    boundCatalytic: type === "phosphorylaseKinase" ? [null, null] : null,
    glycogenActiveSide: type === "glycogenPhosphorylase" ? -1 : undefined,
    glycogenTimer: type === "glycogenPhosphorylase" ? 0 : undefined,
    boundNa: type === "sodiumPotassiumPump" ? [null, null, null] : null,
    boundK: type === "sodiumPotassiumPump" ? [null, null] : null
  };
  state.parts.push(part);
  state.selectedPartId = part.id;
  state.running = false;
  state.paused = false;
  state.won = false;
  state.freeRun = false;
  updateLevelUi();
  setFeedback("Part installed. Press Run to test the assembly.", "");
  playSound("install");
  return true;
}

function isRanvierNodeX(level, x, b = board()) {
  if (!level.myelinated) return true;
  const width = level.nodeWidth || 96;
  return (level.ranvierNodes || []).some((fraction) => Math.abs(x - fraction * b.width) <= width / 2);
}

function isPartFullyInRanvierNode(level, type, x, b = board()) {
  if (!level.myelinated) return true;
  const nodeHalf = (level.nodeWidth || 96) / 2;
  const partHalf = partWidth(type) / 2;
  return (level.ranvierNodes || []).some((fraction) => {
    const center = fraction * b.width;
    return x - partHalf >= center - nodeHalf && x + partHalf <= center + nodeHalf;
  });
}

function clampPartXForLevel(level, type, x, b = board()) {
  const clamped = Math.max(70, Math.min(b.width - 70, x));
  if (!level.myelinated) return clamped;
  const intervals = ranvierPlacementIntervals(level, type, b);
  if (!intervals.length) return clamped;
  for (const interval of intervals) {
    if (clamped >= interval.left && clamped <= interval.right) return clamped;
  }
  let nearest = intervals[0].left;
  let nearestDistance = Math.abs(clamped - nearest);
  for (const interval of intervals) {
    for (const edge of [interval.left, interval.right]) {
      const d = Math.abs(clamped - edge);
      if (d < nearestDistance) {
        nearest = edge;
        nearestDistance = d;
      }
    }
  }
  return nearest;
}

function ranvierPlacementIntervals(level, type, b = board()) {
  if (!level.myelinated) return [];
  const nodeHalf = (level.nodeWidth || 96) / 2;
  const partHalf = partWidth(type) / 2;
  return (level.ranvierNodes || [])
    .map((fraction) => {
      const center = fraction * b.width;
      return {
        left: Math.max(70, center - nodeHalf + partHalf),
        right: Math.min(b.width - 70, center + nodeHalf - partHalf)
      };
    })
    .filter((interval) => interval.left <= interval.right);
}

function partWidth(type) {
  if (type === "sodiumPotassiumPump") return 96;
  if (type === "acetylcholineReceptor") return 84;
  if (type === "proteinKinaseA") return 98;
  if (partTypes[type]?.zone === "cytoplasm") return 86;
  if (type === "receptor") return 58;
  return 70;
}

function partYForPlacement(type, y, b = board()) {
  if (partTypes[type]?.zone === "cytoplasm") {
    return Math.max(70, Math.min(b.height - 70, y));
  }
  return b.membraneY + b.membraneH / 2;
}

function selectedPart() {
  return state.parts ? state.parts.find((part) => part.id === state.selectedPartId) : null;
}

function removeSelectedPart() {
  const part = selectedPart();
  if (!part) {
    setFeedback("Select a part first.", "warning");
    return;
  }
  state.parts = state.parts.filter((candidate) => candidate.id !== part.id);
  state.selectedPartId = state.parts[0] ? state.parts[0].id : null;
  state.running = false;
  state.paused = false;
  state.won = false;
  state.freeRun = false;
  state.goalReachedAt = null;
  updateLevelUi();
  setFeedback(`${partTypes[part.type].name} removed.`, "");
  playSound("remove");
}

function screenToCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

function partAt(x, y) {
  for (let i = state.parts.length - 1; i >= 0; i -= 1) {
    const p = state.parts[i];
    if (Math.abs(p.x - x) < 46 && Math.abs(p.y - y) < 58) return p;
  }
  return null;
}

function update(dt) {
  if (!state.running || (state.won && !state.freeRun)) return;
  const level = levels[levelIndex];
  const b = board();
  state.time += dt;
  state.flash = Math.max(0, state.flash - dt);
  updateElectricState();
  releaseScheduledMolecules(level, b);

  for (const part of state.parts) {
    part.pulse = Math.max(0, part.pulse - dt);
    updatePartOpenState(part);
    if (part.type === "receptor") {
      const signalNear = state.molecules.some((m) => !m.used && distance(m.x, m.y, part.x, part.y - 60) < RECEPTOR_RADIUS);
      if (signalNear) {
        part.active = true;
        part.pulse = 0.6;
      }
    }
    if (part.type === "gated") {
      part.active = state.parts.some((other) => other.type === "receptor" && other.active && distance(other.x, other.y, part.x, part.y) < 150);
    }
    if (part.type === "acetylcholineReceptor") {
      const boundACh = state.molecules.find((m) => !m.used && m.kind === "acetylcholine" && m.boundPart === part.id);
      part.boundACh = boundACh || null;
      part.active = Boolean(boundACh);
      if (part.active) {
        part.pulse = 0.6;
      }
    }
    if (part.type === "voltageSodiumChannel") {
      const voltage = partVoltage(part);
      if (voltage <= (level.vnaRecoverMv ?? VK_CLOSE_MV)) part.inactivated = false;
      if (voltage >= VNA_INACTIVATE_MV) part.inactivated = true;
      part.active = voltage >= VNA_OPEN_MV && !part.inactivated;
    }
    if (part.type === "delayedPotassiumChannel") {
      const voltage = partVoltage(part);
      part.active = voltage >= VK_OPEN_MV || (part.active && voltage > VK_CLOSE_MV);
    }
  }

  moveMolecules(dt, level, b);
  runPartEffects(dt, level);
  checkWin(level);
  recordPotentialSample();
  updateMeters();
}

function releaseScheduledMolecules(level, b) {
  releaseScheduledAdrenaline(level, b);
  releaseScheduledAcetylcholine(level, b);
}

function releaseScheduledAdrenaline(level, b) {
  if (level.molecules !== "adrenalineCascade") return;
  const releaseTime = level.adrReleaseTime ?? 0.45;
  if ((state.adrReleaseIndex || 0) > 0 || state.time < releaseTime) return;
  const count = level.adrReleaseCount || 10;
  const center = b.width / 2;
  for (let i = 0; i < count; i += 1) {
    const x = center + (i - (count - 1) / 2) * 18 + randomRange(-9, 9);
    const molecule = createMolecule("adrenaline", x, false, b);
    molecule.y = -28 - i * 8;
    molecule.vx = randomRange(-42, 42);
    molecule.vy = randomRange(122, 158);
    molecule.jet = true;
    state.molecules.push(molecule);
  }
  state.adrReleased = true;
  state.adrReleaseIndex = 1;
  setFeedback("Adrenaline jetted into the outside compartment.", "");
  playSound("ligandRelease");
}

function releaseScheduledAcetylcholine(level, b) {
  if (!level.achReleaseTime) return;
  const schedule = achReleaseSchedule(level);
  const index = state.achReleaseIndex || 0;
  if (index >= schedule.length || state.time < schedule[index]) return;
  const count = (index === 1 ? level.secondAchReleaseCount : null) || level.achReleaseCount || 5;
  const center = b.width / 2;
  for (let i = 0; i < count; i += 1) {
    const fromLeft = level.achReleaseSide === "left";
    const x = fromLeft ? -32 - i * 8 : center + (i - (count - 1) / 2) * 18 + randomRange(-9, 9);
    const molecule = createMolecule("acetylcholine", x, false, b);
    molecule.y = fromLeft ? b.membraneY - 92 + (i - (count - 1) / 2) * 8 + randomRange(-4, 4) : -28 - i * 8;
    molecule.vx = fromLeft ? achJetSpeedToCanvas(level, b, molecule.x) + randomRange(-10, 10) : randomRange(-42, 42);
    molecule.vy = fromLeft ? randomRange(-8, 18) : achJetSpeedToMembrane(level, b, molecule.y) + randomRange(-12, 12);
    molecule.jet = true;
    molecule.jetFrom = fromLeft ? "left" : "top";
    molecule.sourceEntryEdge = molecule.jetFrom;
    state.molecules.push(molecule);
  }
  state.achReleased = true;
  state.achReleaseIndex = index + 1;
  setFeedback(level.achReleaseSide === "left" ? `ACh pulse ${state.achReleaseIndex} jetted in from the left.` : `ACh pulse ${state.achReleaseIndex} jetted into the outside compartment.`, "");
  playSound("ligandRelease");
}

function achReleaseSchedule(level) {
  const schedule = [level.achReleaseTime];
  if (level.secondAchReleaseTime) schedule.push(level.secondAchReleaseTime);
  return schedule;
}

function achFreeLifetime(level) {
  return level.achFreeLifetime || 8;
}

function achJetTravelTime(level) {
  return Math.max(1.2, Math.min(2.4, achFreeLifetime(level) * 0.35));
}

function achJetSpeedToMembrane(level, b, y) {
  const targetY = b.membraneY - 92;
  return Math.max(122, Math.min(680, (targetY - y) / achJetTravelTime(level)));
}

function achJetSpeedToCanvas(level, b, x) {
  const targetX = Math.min(70, b.width * 0.1);
  return Math.max(126, Math.min(520, (targetX - x) / achJetTravelTime(level)));
}

function achJetReachedOutsideMembrane(m, b) {
  if (m.jetFrom === "left") return m.x >= Math.min(70, b.width * 0.1);
  return m.y >= b.membraneY - 92;
}

function moleculeLeavesCanvas(m, b) {
  return m.x < -RESERVOIR_RESPAWN_MARGIN || m.x > b.width + RESERVOIR_RESPAWN_MARGIN || m.y < -RESERVOIR_RESPAWN_MARGIN || m.y > b.height + RESERVOIR_RESPAWN_MARGIN;
}

function isFreeMovingMolecule(m) {
  return !m.boundPump && !m.boundPart && !m.boundReceptor && !m.boundCyclase && !m.boundPka && !m.boundPhosphorylaseKinase;
}

function isIntentionalReservoirEntry(m, b) {
  if (!m.jet) return false;
  const enteringFromTop = m.y < 0 && m.vy > 0 && m.x > -RESERVOIR_RESPAWN_MARGIN && m.x < b.width + RESERVOIR_RESPAWN_MARGIN;
  const enteringFromLeft = m.x < 0 && m.vx > 0 && m.y > -RESERVOIR_RESPAWN_MARGIN && m.y < b.height + RESERVOIR_RESPAWN_MARGIN;
  return (m.kind === "acetylcholine" || m.kind === "adrenaline") && (enteringFromTop || enteringFromLeft);
}

function shouldRespawnFromReservoir(m, b) {
  return isFreeMovingMolecule(m) && !isIntentionalReservoirEntry(m, b) && moleculeLeavesCanvas(m, b);
}

function reservoirRespawnInside(m, b) {
  if (m.y > b.height + RESERVOIR_RESPAWN_MARGIN) return true;
  if (m.y < -RESERVOIR_RESPAWN_MARGIN) return false;
  return m.inside;
}

function respawnMoleculeFromReservoir(m, level, b) {
  const sameLaneX = reservoirEntryX(m, level, b);
  const respawnInside = reservoirRespawnInside(m, b);
  const entryEdge = reservoirEntryEdge(m, b, respawnInside);
  m.x = sameLaneX;
  m.laneX = sameLaneX;
  m.inside = respawnInside;
  m.jet = false;
  m.jetFrom = null;
  m.boundPump = null;
  m.pumpSupplyDrift = false;
  m.membraneDelay = 0;
  if (entryEdge === "left") {
    m.x = -RESERVOIR_ENTRY_MARGIN;
    m.y = Math.max(26, Math.min(b.membraneY - 36, b.membraneY - 92 + randomRange(-24, 24)));
    m.vx = randomRange(126, 164);
    m.vy = randomRange(-8, 18);
  } else if (respawnInside) {
    m.y = b.height + RESERVOIR_ENTRY_MARGIN;
    m.vx = randomRange(-22, 22);
    m.vy = -randomRange(20, 38);
  } else {
    m.y = -RESERVOIR_ENTRY_MARGIN;
    m.vx = randomRange(-22, 22);
    m.vy = randomRange(20, 38);
  }
}

function reservoirEntryEdge(m, b, respawnInside) {
  if (m.y > b.height + RESERVOIR_RESPAWN_MARGIN) return "bottom";
  if (m.y < -RESERVOIR_RESPAWN_MARGIN) return "top";
  if (!respawnInside && m.kind === "acetylcholine" && m.sourceEntryEdge === "left") return "left";
  return respawnInside ? "bottom" : "top";
}

function reservoirEntryX(m, level, b) {
  if (level.localVoltage && laneCountForLevel() > 1) {
    const lane = laneIndexForX(m.laneX ?? m.x);
    const laneWidth = b.width / laneCountForLevel();
    const left = lane * laneWidth;
    const right = left + laneWidth;
    const padding = Math.min(32, laneWidth * 0.24);
    return randomRange(left + padding, right - padding);
  }
  return randomRange(32, b.width - 32);
}

function moveMolecules(dt, level, b) {
  for (const m of state.molecules) {
    if (m.used) continue;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    if (m.fadeAfter) {
      m.age = (m.age || 0) + dt;
      if (m.age > m.fadeAfter) {
        m.used = true;
        continue;
      }
    }

    if (level.molecules === "ion" || level.molecules === "balancedIon") {
      moveIonForPump(m, dt, b);
    }
    if (level.molecules === "oxygen" && level.parts.length === 0) {
      moveOxygenThroughMembrane(m, dt, b);
    }
    if ((level.molecules === "proton" || level.molecules === "balancedProton") && m.kind === "proton") {
      diffuseWithinCompartment(m, dt, b);
    }
    if (level.molecules === "adrenalineCascade" && m.kind === "adrenaline" && m.jet && m.y < b.membraneY - 56) {
      m.vx += randomRange(-8, 8) * dt;
      m.vx = Math.max(-34, Math.min(34, m.vx));
      m.vy = Math.max(104, Math.min(166, m.vy));
    } else if (level.molecules === "adrenalineCascade") {
      if (m.kind === "adrenaline") m.jet = false;
      diffuseWithinCompartment(m, dt, b);
    }
    if (m.kind === "acetylcholine") {
      moveAcetylcholine(m, dt, b);
      continue;
    }
    if (level.molecules === "hPump" && m.kind === "proton") {
      movePositiveOut(m, dt, b, "protonPump", 4, () => {
        state.atp = Math.max(0, state.atp - 4);
        state.gradient = Math.min(100, state.gradient + 5);
      });
    }
    if ((level.molecules === "restingIons" || level.molecules === "actionIons") && m.kind === "potassium") {
      movePositiveOut(m, dt, b, "potassiumChannel", 0, () => {
        state.gradient = Math.min(100, state.gradient + 2);
      });
    }
    if ((level.molecules === "repolarizeIons" || level.molecules === "hyperIons" || level.molecules === "fullActionIons" || level.molecules === "doubleSpikeIons" || level.molecules === "propagationIons") && m.kind === "potassium") {
      movePositiveOut(m, dt, b, "delayedPotassiumChannel", 0, () => {
        state.gradient = Math.min(100, state.gradient + 2);
      });
    }
    if (level.molecules === "resetIons" || level.molecules === "pumpRepolarizeIons" || level.molecules === "doubleSpikeIons") {
      diffuseUnboundResetPumpSubstrate(m, dt, b);
      moveResetIon(m, dt, b);
    }
    if ((level.molecules === "returnIons" || level.molecules === "fullActionIons" || level.molecules === "doubleSpikeIons") && m.kind === "potassium" && !m.inside) {
      const leakReady = level.molecules === "returnIons" || state.potential <= VK_CLOSE_MV;
      if (leakReady) {
        movePositiveIn(m, dt, b, "restingLeak", () => {
          state.gradient = Math.max(0, state.gradient - 1);
        });
      }
    }

    const openPart = findOpenPartFor(level, m);
    if (!m.inside && openPart && inLocalAttractionZone(m, openPart)) {
      const desiredX = partLaneTarget(openPart, m);
      const steerX = 78;
      const steerY = 86;
      const maxX = 96;
      const maxY = 104;
      m.vx += Math.sign(desiredX - m.x) * steerX * dt;
      m.vy += Math.sign(b.membraneY - m.y) * steerY * dt;
      m.vx = Math.max(-maxX, Math.min(maxX, m.vx));
      m.vy = Math.max(-maxY, Math.min(maxY, m.vy));
    } else if (!m.inside && !m.pumpSupplyDrift) {
      m.vx += Math.sign((m.laneX || m.x) - m.x) * 16 * dt;
      m.vx = Math.max(-36, Math.min(36, m.vx));
    }
    if (shouldRespawnFromReservoir(m, b)) {
      respawnMoleculeFromReservoir(m, level, b);
      continue;
    }

    if (!m.inside && openPart && ionReachesPore(m, openPart, false, b)) {
      m.inside = true;
      m.x = openPart.x + randomRange(-12, 12);
      m.y = b.membraneY + b.membraneH + 24;
      m.vx = randomRange(-20, 20);
      m.vy = randomRange(18, 34);
      openPart.pulse = 0.45;
      if (level.molecules === "proton") {
        state.atp = Math.min(100, state.atp + 6);
        state.gradient = Math.max(0, state.gradient - 5);
      } else if (m.kind === "sodium") {
        state.imported += 1;
      } else {
        state.imported += 1;
      }
      state.flash = 0.25;
      markVoltageGateRecruited(openPart);
      playSound(m.kind === "proton" ? "pumpCycle" : "transportIn");
    }

    if (level.molecules === "oxygen" && level.parts.length === 0) {
      continue;
    }

    if (!m.inside && m.y > b.membraneY - 12) {
      m.y = b.membraneY - 14;
      m.vy = -Math.abs(m.vy);
    }
    if (m.inside && m.y < b.membraneY + b.membraneH + 16) {
      m.y = b.membraneY + b.membraneH + 16;
      m.vy = Math.abs(m.vy);
    }
  }
}

function diffuseWithinCompartment(m, dt, b) {
  m.vx += randomRange(-30, 30) * dt;
  m.vy += randomRange(-30, 30) * dt;
  m.vx = Math.max(-48, Math.min(48, m.vx));
  m.vy = Math.max(-48, Math.min(48, m.vy));
  if (!m.inside && m.y > b.membraneY - 18) {
    m.y = b.membraneY - 18;
    m.vy = -Math.abs(m.vy);
  }
  if (m.inside && m.y < b.membraneY + b.membraneH + 18) {
    m.y = b.membraneY + b.membraneH + 18;
    m.vy = Math.abs(m.vy);
  }
}

function moveAcetylcholine(m, dt, b) {
  const level = levels[levelIndex];
  m.age = (m.age || 0) + dt;
  if (m.boundPart) {
    const receptor = state.parts.find((part) => part.id === m.boundPart);
    if (!receptor) {
      m.boundPart = null;
      return;
    }
    m.boundAge = (m.boundAge || 0) + dt;
    if (m.boundAge >= (level.achBoundLifetime || 4)) {
      receptor.boundACh = null;
      receptor.active = false;
      m.used = true;
      return;
    }
    m.x = receptor.x;
    m.y = receptor.y - 58;
    m.vx = 0;
    m.vy = 0;
    receptor.boundACh = m;
    receptor.active = true;
    receptor.pulse = Math.max(receptor.pulse || 0, 0.3);
    return;
  }

  if (m.age >= (level.achFreeLifetime || 8)) {
    m.used = true;
    return;
  }
  if (m.jet && achJetReachedOutsideMembrane(m, b)) m.jet = false;

  const receptor = nearestPart("acetylcholineReceptor", m.x, m.y, (part) => !part.boundACh);
  if (receptor && inLocalAttractionZone(m, receptor)) {
    const bindX = receptor.x;
    const bindY = receptor.y - 58;
    m.vx += Math.sign(bindX - m.x) * 82 * dt;
    m.vy += Math.sign(bindY - m.y) * 88 * dt;
    if (Math.abs(m.x - bindX) < 18 && Math.abs(m.y - bindY) < 18) {
      m.boundPart = receptor.id;
      m.boundAge = 0;
      receptor.boundACh = m;
      receptor.active = true;
      receptor.pulse = 0.7;
      markAChPropagationTrigger(receptor);
      m.x = bindX;
      m.y = bindY;
      m.vx = 0;
      m.vy = 0;
      playSound("ligandBind");
      return;
    }
  } else {
    m.vx += randomRange(-28, 28) * dt;
    m.vy += randomRange(-18, 22) * dt;
  }
  const maxX = m.jet ? Math.max(164, Math.abs(m.vx) + 12) : 62;
  const maxY = m.jet ? Math.max(166, Math.abs(m.vy) + 12) : 66;
  m.vx = Math.max(-maxX, Math.min(maxX, m.vx));
  m.vy = Math.max(-maxY, Math.min(maxY, m.vy));
  if (shouldRespawnFromReservoir(m, b)) {
    respawnMoleculeFromReservoir(m, level, b);
    return;
  }
  if (m.y > b.membraneY - 18) {
    m.y = b.membraneY - 18;
    m.vy = -Math.abs(m.vy) * 0.45;
  }
}

function moveOxygenThroughMembrane(m, dt, b) {
  const counts = oxygenCounts(true);
  const difference = counts.outside - counts.inside;
  m.membraneDelay = Math.max(0, (m.membraneDelay || 0) - dt);
  m.vx += randomRange(-36, 36) * dt;
  m.vy += randomRange(-36, 36) * dt;
  if (!m.inside && difference > 0) m.vy += 12 * (m.diffusionBias || 1) * dt;
  if (m.inside && difference < 0) m.vy -= 12 * (m.diffusionBias || 1) * dt;
  m.vx = Math.max(-52, Math.min(52, m.vx));
  m.vy = Math.max(-52, Math.min(52, m.vy));

  const crossingChance = Math.min(0.95, 0.35 + Math.abs(difference) * 0.03) * (m.diffusionBias || 1);
  if (!m.inside && m.y >= b.membraneY + b.membraneH && difference > 0 && m.membraneDelay <= 0 && Math.random() < crossingChance * dt) {
    m.inside = true;
    m.vy = Math.max(10, Math.abs(m.vy) * 0.72 + randomRange(4, 16));
    m.vx += randomRange(-8, 8);
    m.vx = Math.max(-52, Math.min(52, m.vx));
    m.membraneDelay = randomRange(0.4, 1.7);
    state.imported = oxygenCounts(true).inside;
    playSound("neutralDiffusion");
  } else if (m.inside && m.y <= b.membraneY && difference < 0 && m.membraneDelay <= 0 && Math.random() < crossingChance * dt) {
    m.inside = false;
    m.vy = -Math.max(10, Math.abs(m.vy) * 0.72 + randomRange(4, 16));
    m.vx += randomRange(-8, 8);
    m.vx = Math.max(-52, Math.min(52, m.vx));
    m.membraneDelay = randomRange(0.4, 1.7);
    state.imported = oxygenCounts(true).inside;
    playSound("neutralDiffusion");
  }
}

function movePositiveOut(m, dt, b, partType, energyCost, onCross) {
  const level = levels[levelIndex];
  const part = nearestPart(partType, m.x, m.y);
  if (!part) {
    if (m.inside && m.y < b.membraneY + b.membraneH + 16) {
      m.y = b.membraneY + b.membraneH + 16;
      m.vy = Math.abs(m.vy);
    }
    return;
  }
  if (!isPartOpen(part)) return;

  if (m.inside) {
    const channelLike = partType === "potassiumChannel" || partType === "delayedPotassiumChannel";
    if (channelLike && !inLocalAttractionZone(m, part)) return;
    const desiredX = partLaneTarget(part, m);
    const steerX = channelLike ? 78 : 86;
    const steerY = channelLike ? 86 : 90;
    const maxX = channelLike ? 96 : 92;
    const maxY = channelLike ? 104 : 96;
    m.vx += Math.sign(desiredX - m.x) * steerX * dt;
    m.vy += Math.sign(part.y - m.y) * steerY * dt;
    m.vx = Math.max(-maxX, Math.min(maxX, m.vx));
    m.vy = Math.max(-maxY, Math.min(maxY, m.vy));

    const canCross = ionReachesPore(m, part, true, b);
    if (state.atp >= energyCost && canCross) {
      m.inside = false;
      m.x = part.x + randomRange(-10, 10);
      m.y = b.membraneY - 22;
      m.vx = randomRange(-24, 24);
      m.vy = -randomRange(24, 42);
      part.pulse = 0.5;
      onCross();
      state.imported += 1;
      markVoltageGateRecruited(part);
      playSound(partType === "protonPump" ? "pumpCycle" : "transportOut");
    }
  }
}

function movePositiveIn(m, dt, b, partType, onCross) {
  const part = nearestPart(partType, m.x, m.y);
  if (!part) return;
  if (!isPartOpen(part) || !inLocalAttractionZone(m, part)) return;

  const desiredX = partLaneTarget(part, m);
  const steerX = 78;
  const steerY = 86;
  const maxX = 96;
  const maxY = 104;
  m.vx += Math.sign(desiredX - m.x) * steerX * dt;
  m.vy += Math.sign(part.y - m.y) * steerY * dt;
  m.vx = Math.max(-maxX, Math.min(maxX, m.vx));
  m.vy = Math.max(-maxY, Math.min(maxY, m.vy));

  if (ionReachesPore(m, part, false, b)) {
    m.inside = true;
    m.x = part.x + randomRange(-10, 10);
    m.y = b.membraneY + b.membraneH + 24;
    m.vx = randomRange(-20, 20);
    m.vy = randomRange(20, 36);
    part.pulse = 0.5;
    onCross();
    state.imported += 1;
    markVoltageGateRecruited(part);
    playSound("transportIn");
  }
}

function markVoltageGateRecruited(part) {
  if (!part) return;
  if (part.type === "voltageSodiumChannel") {
    recordPropagatedLane(laneIndexForX(part.x), part);
  }
}

function moveResetIon(m, dt, b) {
  const slotType = m.kind === "sodium" && m.inside ? "boundNa" : m.kind === "potassium" && !m.inside ? "boundK" : null;
  if (!slotType || state.atp < 4) return;
  const pump = m.boundPump ? state.parts.find((part) => part.id === m.boundPump) : bestPumpForIon(m, slotType, b);
  if (!pump) return;

  bindIonAtPump(m, pump, dt, b, slotType);

  if (pumpCycleReady(pump) && state.atp >= 4) {
    exchangePumpCycle(pump, b);
  }
}

function diffuseUnboundResetPumpSubstrate(m, dt, b) {
  const slotType = m.kind === "sodium" && m.inside ? "boundNa" : m.kind === "potassium" && !m.inside ? "boundK" : null;
  m.pumpSupplyDrift = false;
  if (!slotType || m.boundPump || state.atp < 4) return;
  if (bestPumpForIon(m, slotType, b)) return;
  mixResetPumpSubstrate(m, dt, b);
  m.laneX = m.x;
  m.pumpSupplyDrift = true;
}

function mixResetPumpSubstrate(m, dt, b) {
  m.vx += randomRange(-72, 72) * dt;
  m.vx += Math.sign(b.width / 2 - m.x) * 34 * dt;
  m.vy += randomRange(-34, 34) * dt;
  m.vx = Math.max(-86, Math.min(86, m.vx));
  m.vy = Math.max(-54, Math.min(54, m.vy));
  if (!m.inside && m.y > b.membraneY - 18) {
    m.y = b.membraneY - 18;
    m.vy = -Math.abs(m.vy);
  }
  if (m.inside && m.y < b.membraneY + b.membraneH + 18) {
    m.y = b.membraneY + b.membraneH + 18;
    m.vy = Math.abs(m.vy);
  }
}

function ensurePumpSlots(pump) {
  if (!Array.isArray(pump.boundNa)) pump.boundNa = [null, null, null];
  if (!Array.isArray(pump.boundK)) pump.boundK = [null, null];
}

function pumpHasOpenSlot(pump, slotType) {
  ensurePumpSlots(pump);
  return pump[slotType].some((ion) => !ion);
}

function pumpCycleReady(pump) {
  ensurePumpSlots(pump);
  return pump.boundNa.every(Boolean) && pump.boundK.every(Boolean);
}

function pumpOccupancy(pump) {
  ensurePumpSlots(pump);
  return pump.boundNa.filter(Boolean).length + pump.boundK.filter(Boolean).length;
}

function bestPumpForIon(m, slotType, b) {
  let best = null;
  let bestScore = Infinity;
  for (const pump of state.parts.filter((part) => part.type === "sodiumPotassiumPump")) {
    if (!pumpHasOpenSlot(pump, slotType)) continue;
    if (!ionInPumpAttractionZone(m, pump, slotType, b)) continue;
    const d = distance(m.x, m.y, pump.x, pump.y);
    const score = d - pumpOccupancy(pump) * 220;
    if (score < bestScore) {
      best = pump;
      bestScore = score;
    }
  }
  return best;
}

function ionInPumpAttractionZone(m, pump, slotType, b) {
  if (slotType === "boundNa" && !m.inside) return false;
  if (slotType === "boundK" && m.inside) return false;
  const slotIndex = nearestOpenPumpSlot(m, pump, slotType, b);
  if (slotIndex === -1) return false;
  return Math.abs(m.x - pump.x) <= LOCAL_ATTRACTION_X;
}

function pumpSlotPosition(pump, slotType, index, b) {
  const offsets = slotType === "boundNa" ? PUMP_NA_OFFSETS : PUMP_K_OFFSETS;
  return {
    x: pump.x + offsets[index],
    y: slotType === "boundNa" ? b.membraneY + b.membraneH + 18 : b.membraneY - 18
  };
}

function bindIonAtPump(m, pump, dt, b, slotType) {
  ensurePumpSlots(pump);
  if (m.boundPump && m.boundPump !== pump.id) return;
  const slots = pump[slotType];
  let slotIndex = slots.indexOf(m);
  if (slotIndex === -1) slotIndex = nearestOpenPumpSlot(m, pump, slotType, b);
  if (slotIndex === -1) return;

  const target = pumpSlotPosition(pump, slotType, slotIndex, b);
  if (slots[slotIndex] === m) {
    m.boundPump = pump.id;
    m.x = target.x;
    m.y = target.y;
    m.vx = 0;
    m.vy = 0;
    return;
  }
  if (!ionInPumpAttractionZone(m, pump, slotType, b)) return;

  m.vx += Math.sign(target.x - m.x) * 168 * dt;
  m.vy += Math.sign(target.y - m.y) * 172 * dt;
  m.vx = Math.max(-176, Math.min(176, m.vx));
  m.vy = Math.max(-184, Math.min(184, m.vy));

  if (Math.abs(m.x - target.x) < 34 && Math.abs(m.y - target.y) < 30 && !slots[slotIndex]) {
    slots[slotIndex] = m;
    m.boundPump = pump.id;
    m.x = target.x;
    m.y = target.y;
    m.vx = 0;
    m.vy = 0;
    pump.pulse = 0.35;
    playSound("pumpBind");
  }
}

function nearestOpenPumpSlot(m, pump, slotType, b) {
  const slots = pump[slotType];
  let bestIndex = -1;
  let bestDistance = Infinity;
  for (let index = 0; index < slots.length; index += 1) {
    if (slots[index]) continue;
    const target = pumpSlotPosition(pump, slotType, index, b);
    const d = distance(m.x, m.y, target.x, target.y);
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function exchangePumpCycle(pump, b) {
  ensurePumpSlots(pump);
  pump.boundNa.forEach((na, index) => {
    na.boundPump = null;
    na.inside = false;
    na.x = pump.x + PUMP_NA_OFFSETS[index];
    na.y = b.membraneY - 22;
    na.vx = randomRange(-22, 22);
    na.vy = -randomRange(24, 42);
  });
  pump.boundK.forEach((k, index) => {
    k.boundPump = null;
    k.inside = true;
    k.x = pump.x + PUMP_K_OFFSETS[index];
    k.y = b.membraneY + b.membraneH + 24;
    k.vx = randomRange(-20, 20);
    k.vy = randomRange(20, 36);
  });
  pump.boundNa = [null, null, null];
  pump.boundK = [null, null];
  pump.pulse = 0.7;
  state.atp = Math.max(0, state.atp - 4);
  state.gradient = Math.min(100, state.gradient + 6);
  state.imported += 5;
  state.flash = 0.25;
  playSound("pumpCycle");
}

function moveIonTowardPump(m, part, dt, b, direction, onCross) {
  const desiredX = partLaneTarget(part, m);
  m.vx += Math.sign(desiredX - m.x) * 82 * dt;
  m.vy += Math.sign(part.y - m.y) * 88 * dt;
  m.vx = Math.max(-92, Math.min(92, m.vx));
  m.vy = Math.max(-96, Math.min(96, m.vy));

  const closeEnough = Math.abs(m.x - part.x) < 46;
  const reachesMembrane = direction === "out" ? m.y < b.membraneY + b.membraneH + 30 : m.y > b.membraneY - 30;
  if (closeEnough && reachesMembrane) {
    m.inside = direction === "in";
    m.x = part.x + randomRange(-10, 10);
    m.y = direction === "in" ? b.membraneY + b.membraneH + 24 : b.membraneY - 22;
    m.vx = randomRange(-22, 22);
    m.vy = direction === "in" ? randomRange(22, 38) : -randomRange(24, 42);
    part.pulse = 0.5;
    onCross();
    state.imported += 1;
    state.flash = 0.25;
    playSound(direction === "in" ? "transportIn" : "transportOut");
  }
}

function moveIonForPump(m, dt, b) {
  const pump = nearestPart("pump", m.laneX || m.x, m.y, (part) => genericPumpCanAttractIon(m, part, b));
  if (!pump) {
    m.vx += Math.sign((m.laneX || m.x) - m.x) * 18 * dt;
    m.vx = Math.max(-34, Math.min(34, m.vx));
    if (m.inside && m.y < b.membraneY + b.membraneH + 16) {
      m.y = b.membraneY + b.membraneH + 16;
      m.vy = Math.abs(m.vy);
    }
    return;
  }

  if (m.inside) {
    const desiredX = partLaneTarget(pump, m);
    m.vx += Math.sign(desiredX - m.x) * 46 * dt;
    m.vy += Math.sign(pump.y - m.y) * 46 * dt;
    m.vx = Math.max(-62, Math.min(62, m.vx));
    m.vy = Math.max(-62, Math.min(62, m.vy));

    if (state.atp >= 4 && Math.abs(m.x - pump.x) < 34 && m.y < b.membraneY + b.membraneH + 24) {
      m.inside = false;
      m.x = pump.x + randomRange(-10, 10);
      m.y = b.membraneY - 22;
      m.vx = randomRange(-24, 24);
      m.vy = -randomRange(24, 42);
      pump.pulse = 0.5;
      state.atp = Math.max(0, state.atp - 4);
      state.gradient = Math.min(100, state.gradient + 5);
      state.imported = Math.round(state.gradient);
      state.flash = 0.25;
      playSound("pumpCycle");
    }
  }
}

function genericPumpCanAttractIon(m, pump, b) {
  if (!m.inside) return false;
  const target = { x: pump.x, y: b.membraneY + b.membraneH + 18 };
  return distance(m.x, m.y, target.x, target.y) <= LOCAL_ATTRACTION_X;
}

function partLaneTarget(part, molecule) {
  return part.x + Math.max(-18, Math.min(18, (molecule.laneX || part.x) - part.x));
}

function nearestPart(type, x, y, predicate = () => true) {
  let best = null;
  let bestDistance = Infinity;
  for (const part of state.parts) {
    if (part.type !== type) continue;
    if (!predicate(part)) continue;
    const d = distance(x, y, part.x, part.y);
    if (d < bestDistance) {
      best = part;
      bestDistance = d;
    }
  }
  return best;
}

function findOpenPartFor(level, molecule) {
  if (level.molecules === "oxygen") return nearestPart("channel", molecule.x, molecule.y, isPartOpen);
  if (level.molecules === "glucose") return nearestPart("transporter", molecule.x, molecule.y, isPartOpen);
  if (level.molecules === "signal") return nearestPart("gated", molecule.x, molecule.y, isPartOpen);
  if (level.molecules === "proton" || level.molecules === "balancedProton") return nearestPart("synthase", molecule.x, molecule.y, () => levelGradientMetric(level).value >= 5);
  if (["thresholdIons", "spikeIons", "fullActionIons", "doubleSpikeIons", "propagationIons"].includes(level.molecules) && molecule.kind === "sodium") {
    return nearestOpenPartOfTypes(["acetylcholineReceptor", "voltageSodiumChannel"], molecule.x, molecule.y);
  }
  if (level.molecules === "actionIons" && molecule.kind === "sodium") {
    return nearestOpenPartOfTypes(["sodiumChannel", "voltageSodiumChannel"], molecule.x, molecule.y);
  }
  return null;
}

function nearestOpenPartOfTypes(types, x, y) {
  let best = null;
  let bestDistance = Infinity;
  for (const part of state.parts) {
    if (!types.includes(part.type) || !isPartOpen(part)) continue;
    const d = distance(x, y, part.x, part.y);
    if (d < bestDistance) {
      best = part;
      bestDistance = d;
    }
  }
  return best;
}

function runPartEffects(dt, level) {
  updateElectricState();
  if (level.molecules === "adrenalineCascade") updateAdrenalineCascade(dt, level);
}

function updateAdrenalineCascade(dt, level) {
  const b = board();
  const cascade = state.cascade;
  const receptors = state.parts.filter((part) => part.type === "betaAdrenergicReceptor");
  for (const receptor of receptors) {
    updateAdrenalineReceptorBinding(dt, receptor);
  }

  const gProteins = state.parts.filter((part) => part.type === "gProtein");
  for (const gProtein of gProteins) {
    const receptor = nearestPart("betaAdrenergicReceptor", gProtein.x, gProtein.y, (part) => distance(part.x, part.y, gProtein.x, gProtein.y) < 150);
    if (receptor) updateGProteinActivation(dt, gProtein, receptor, b);
  }

  const cyclases = state.parts.filter((part) => part.type === "adenylylCyclase");
  for (const cyclase of cyclases) {
    updateGAlphaDocking(dt, cyclase, b);
    if (cyclase.boundGAlpha) {
      cyclase.active = true;
      cyclase.pulse = Math.max(cyclase.pulse || 0, 0.22);
      cascade.cyclase = true;
    }
    maybeSpawnCamp(cyclase, b, dt);
  }

  updateAllPkaCampBinding(dt, b);

  updateAllCatalyticSubunits(dt, b);

  const phosphorylases = state.parts.filter((part) => part.type === "glycogenPhosphorylase");
  for (const phosphorylase of phosphorylases) {
    const activePhosphorylaseKinase = nearestPart("phosphorylaseKinase", phosphorylase.x, phosphorylase.y, (part) => part.active);
    if (!activePhosphorylaseKinase || distance(phosphorylase.x, phosphorylase.y, activePhosphorylaseKinase.x, activePhosphorylaseKinase.y) >= 190) continue;
    if (!phosphorylase.phosphorylatedByPhk) {
      phosphorylatePartWithAtp(dt, phosphorylase, 0, -6, "phosphorylatedByPhk", b);
    }
    if (phosphorylase.phosphorylatedByPhk) {
      phosphorylase.active = true;
      phosphorylase.pulse = Math.max(phosphorylase.pulse || 0, 0.2);
      cascade.phosphorylase = true;
      breakGlycogen(dt, phosphorylase, b);
    }
  }
}

function updateAdrenalineReceptorBinding(dt, receptor) {
  const cascade = state.cascade;
  if (receptor.boundAdrenaline) {
    receptor.active = true;
    cascade.receptor = true;
    return;
  }
  const target = { x: receptor.x, y: receptor.y - 54 };
  const adrenaline = nearestMolecule((m) => m.kind === "adrenaline" && !m.boundReceptor, target.x, target.y);
  if (!adrenaline || distance(adrenaline.x, adrenaline.y, target.x, target.y) >= 92) return;
  adrenaline.vx += Math.sign(target.x - adrenaline.x) * 96 * dt;
  adrenaline.vy += Math.sign(target.y - adrenaline.y) * 96 * dt;
  if (distance(adrenaline.x, adrenaline.y, target.x, target.y) >= 24) return;
  adrenaline.x = target.x;
  adrenaline.y = target.y;
  adrenaline.vx = 0;
  adrenaline.vy = 0;
  adrenaline.boundReceptor = receptor.id;
  receptor.active = true;
  receptor.pulse = 0.6;
  receptor.boundAdrenaline = adrenaline;
  cascade.receptor = true;
  playSound("ligandBind");
}

function updateGProteinActivation(dt, gProtein, receptor, b) {
  gProtein.linkedReceptor = receptor.id;
  gProtein.pulse = Math.max(gProtein.pulse || 0, 0.16);
  if (!receptor.active) return;
  gProtein.active = true;
  state.cascade.gProtein = true;
  if (!gProtein.alphaReleased) {
    releaseGAlpha(gProtein, b);
  }
}

function releaseGAlpha(gProtein, b) {
  gProtein.alphaReleased = true;
  gProtein.pulse = 0.55;
  const alpha = createMolecule("gAlpha", gProtein.x, true, b);
  alpha.y = gProtein.y + 42;
  alpha.vx = randomRange(-14, 14);
  alpha.vy = randomRange(16, 34);
  alpha.sourceGProtein = gProtein.id;
  state.molecules.push(alpha);
  playSound("proteinRelease");
}

function updateGAlphaDocking(dt, cyclase, b) {
  if (cyclase.boundGAlpha) return;
  const alpha = nearestMolecule((m) => m.kind === "gAlpha", cyclase.x, cyclase.y + 42);
  if (!alpha) return;
  const target = { x: cyclase.x, y: cyclase.y + 42 };
  alpha.vx += Math.sign(target.x - alpha.x) * 148 * dt;
  alpha.vy += Math.sign(target.y - alpha.y) * 150 * dt;
  alpha.vx = Math.max(-164, Math.min(164, alpha.vx));
  alpha.vy = Math.max(-168, Math.min(168, alpha.vy));
  if (Math.abs(alpha.x - target.x) < 22 && Math.abs(alpha.y - target.y) < 22) {
    cyclase.boundGAlpha = alpha;
    alpha.boundCyclase = cyclase.id;
    alpha.used = true;
    cyclase.pulse = 0.5;
    playSound("dock");
  }
}

function maybeSpawnCamp(cyclase, b, dt) {
  const cascade = state.cascade;
  if (!cyclase.active) return;
  cyclase.campTimer = (cyclase.campTimer || 0) + dt;
  if (cyclase.campTimer < 0.18) return;
  const atp = nearestMolecule((m) => m.kind === "atp", cyclase.x, cyclase.y + 52);
  if (!atp) return;
  const target = { x: cyclase.x, y: cyclase.y + 52 };
  atp.vx += Math.sign(target.x - atp.x) * 132 * dt;
  atp.vy += Math.sign(target.y - atp.y) * 136 * dt;
  atp.vx = Math.max(-148, Math.min(148, atp.vx));
  atp.vy = Math.max(-152, Math.min(152, atp.vy));
  if (Math.abs(atp.x - target.x) > 20 || Math.abs(atp.y - target.y) > 20) return;
  cyclase.campTimer = 0;
  atp.used = true;
  cascade.cAMP = Math.min(30, cascade.cAMP + 1);
  cyclase.pulse = 0.5;
  const molecule = createMolecule("cAMP", cyclase.x + randomRange(-14, 14), true, b);
  molecule.y = b.membraneY + b.membraneH + 32;
  molecule.vx = randomRange(-30, 30);
  molecule.vy = randomRange(34, 58);
  state.molecules.push(molecule);
  spawnEnergyProduct("pyrophosphate", cyclase.x + 18, target.y + 12, b);
  playSound("camp");
}

function spawnEnergyProduct(kind, x, y, b) {
  const molecule = createMolecule(kind, x, true, b);
  molecule.y = y;
  molecule.vx = randomRange(-34, 34);
  molecule.vy = randomRange(18, 48);
  molecule.age = 0;
  molecule.fadeAfter = 3.6;
  state.molecules.push(molecule);
  return molecule;
}

function ensurePkaSlots(pka) {
  if (!Array.isArray(pka.boundCamp)) pka.boundCamp = [null, null, null, null];
}

function pkaCampSlotPosition(pka, index) {
  const offsets = [
    { x: -22, y: -32 },
    { x: -22, y: -12 },
    { x: 22, y: -32 },
    { x: 22, y: -12 }
  ];
  return { x: pka.x + offsets[index].x, y: pka.y + offsets[index].y };
}

function pkaSlotsFull(pka) {
  ensurePkaSlots(pka);
  return pka.boundCamp.every(Boolean);
}

function updateAllPkaCampBinding(dt, b) {
  const pkas = state.parts.filter((part) => part.type === "proteinKinaseA");
  for (const pka of pkas) ensurePkaSlots(pka);
  for (const camp of state.molecules) {
    if (camp.used || camp.kind !== "cAMP" || camp.boundPka) continue;
    const openSlot = nearestOpenPkaSlot(camp, pkas);
    if (!openSlot) continue;
    const { pka, slotIndex, target } = openSlot;
    if (distance(camp.x, camp.y, target.x, target.y) > 340) continue;
    camp.vx += Math.sign(target.x - camp.x) * 142 * dt;
    camp.vy += Math.sign(target.y - camp.y) * 146 * dt;
    camp.vx = Math.max(-154, Math.min(154, camp.vx));
    camp.vy = Math.max(-158, Math.min(158, camp.vy));
    if (Math.abs(camp.x - target.x) < 18 && Math.abs(camp.y - target.y) < 18 && !pka.boundCamp[slotIndex]) {
      pka.boundCamp[slotIndex] = camp;
      camp.boundPka = pka.id;
      camp.used = true;
      pka.pulse = 0.35;
      playSound("ligandBind");
    }
  }

  for (const pka of pkas) {
    if (pkaSlotsFull(pka) && !pka.catalyticReleased) {
      releasePkaCatalyticSubunits(pka, b);
    }
  }
}

function nearestOpenPkaSlot(camp, pkas) {
  let best = null;
  let bestDistance = Infinity;
  for (const pka of pkas) {
    ensurePkaSlots(pka);
    if (pka.catalyticReleased) continue;
    for (let index = 0; index < pka.boundCamp.length; index += 1) {
      if (pka.boundCamp[index]) continue;
      const target = pkaCampSlotPosition(pka, index);
      const d = distance(camp.x, camp.y, target.x, target.y);
      if (d < bestDistance) {
        bestDistance = d;
        best = { pka, slotIndex: index, target };
      }
    }
  }
  return best;
}

function releasePkaCatalyticSubunits(pka, b) {
  pka.catalyticReleased = true;
  pka.active = true;
  pka.pulse = 0.7;
  state.cascade.pka = true;
  [-18, 18].forEach((offset, index) => {
    const catalytic = createMolecule("pkaCatalytic", pka.x + offset, true, b);
    catalytic.y = pka.y + 34;
    catalytic.vx = randomRange(-22, 22);
    catalytic.vy = randomRange(18, 42);
    catalytic.catalyticIndex = index;
    catalytic.sourcePka = pka.id;
    state.molecules.push(catalytic);
  });
  playSound("proteinRelease");
}

function ensurePhosphorylaseKinaseSlots(phosphorylaseKinase) {
  if (!Array.isArray(phosphorylaseKinase.boundCatalytic)) phosphorylaseKinase.boundCatalytic = [null, null];
}

function phosphorylaseKinaseSlotPosition(phosphorylaseKinase, index) {
  return { x: phosphorylaseKinase.x + (index === 0 ? -20 : 20), y: phosphorylaseKinase.y - 46 };
}

function updateAllCatalyticSubunits(dt, b) {
  const phosphorylaseKinases = state.parts.filter((part) => part.type === "phosphorylaseKinase");
  for (const phosphorylaseKinase of phosphorylaseKinases) ensurePhosphorylaseKinaseSlots(phosphorylaseKinase);
  for (const catalytic of state.molecules) {
    if (catalytic.used || catalytic.kind !== "pkaCatalytic" || catalytic.boundPhosphorylaseKinase) continue;
    const openSlot = nearestOpenCatalyticSlot(catalytic, phosphorylaseKinases);
    if (!openSlot) continue;
    const { phosphorylaseKinase, slotIndex, target } = openSlot;
    catalytic.vx += Math.sign(target.x - catalytic.x) * 156 * dt;
    catalytic.vy += Math.sign(target.y - catalytic.y) * 160 * dt;
    catalytic.vx = Math.max(-174, Math.min(174, catalytic.vx));
    catalytic.vy = Math.max(-178, Math.min(178, catalytic.vy));
    if (Math.abs(catalytic.x - target.x) < 20 && Math.abs(catalytic.y - target.y) < 20 && !phosphorylaseKinase.boundCatalytic[slotIndex]) {
      phosphorylaseKinase.boundCatalytic[slotIndex] = catalytic;
      catalytic.boundPhosphorylaseKinase = phosphorylaseKinase.id;
      catalytic.used = true;
      phosphorylaseKinase.pulse = 0.42;
      playSound("dock");
    }
  }

  for (const phosphorylaseKinase of phosphorylaseKinases) {
    if (phosphorylaseKinase.boundCatalytic.every(Boolean) && !phosphorylaseKinase.phosphorylatedByPka) {
      phosphorylatePartWithAtp(dt, phosphorylaseKinase, 0, -4, "phosphorylatedByPka", b);
    }

    if (phosphorylaseKinase.phosphorylatedByPka) {
      phosphorylaseKinase.active = true;
      phosphorylaseKinase.pulse = Math.max(phosphorylaseKinase.pulse || 0, 0.45);
      state.cascade.phosphorylaseKinase = true;
    }
  }
}

function nearestOpenCatalyticSlot(catalytic, phosphorylaseKinases) {
  let best = null;
  let bestDistance = Infinity;
  for (const phosphorylaseKinase of phosphorylaseKinases) {
    ensurePhosphorylaseKinaseSlots(phosphorylaseKinase);
    for (let index = 0; index < phosphorylaseKinase.boundCatalytic.length; index += 1) {
      if (phosphorylaseKinase.boundCatalytic[index]) continue;
      const target = phosphorylaseKinaseSlotPosition(phosphorylaseKinase, index);
      const d = distance(catalytic.x, catalytic.y, target.x, target.y);
      if (d < bestDistance) {
        bestDistance = d;
        best = { phosphorylaseKinase, slotIndex: index, target };
      }
    }
  }
  return best;
}

function breakGlycogen(dt, phosphorylase, b) {
  const cascade = state.cascade;
  const release = nearestGlycogenChainEnd(phosphorylase);
  if (!release || release.distance > 340) return;
  pullGlycogenChainTowardPhosphorylase(release, dt);
  phosphorylase.glycogenTimer = (phosphorylase.glycogenTimer || 0) + dt;
  if (phosphorylase.glycogenTimer < 0.45) return;
  if (release.distance > 30) return;
  phosphorylase.glycogenTimer = 0;
  release.unit.used = true;
  if ((release.chain.units || []).every((unit) => unit.used)) release.chain.used = true;
  const glucose = createMolecule("liverGlucose", release.target.x, true, b);
  glucose.y = release.target.y;
  glucose.vx = randomRange(-34, 34);
  glucose.vy = randomRange(-30, 30);
  state.molecules.push(glucose);
  cascade.glucose += 1;
  cascade.glucoseReleased += 1;
  phosphorylase.pulse = 0.55;
  playSound("glycogen");
}

function pullGlycogenChainTowardPhosphorylase(release, dt) {
  const dx = release.target.x - release.x;
  const dy = release.target.y - release.y;
  release.chain.vx += Math.sign(dx) * 92 * dt;
  release.chain.vy += Math.sign(dy) * 92 * dt;
  release.chain.vx = Math.max(-86, Math.min(86, release.chain.vx));
  release.chain.vy = Math.max(-86, Math.min(86, release.chain.vy));
  release.phosphorylase.pulse = Math.max(release.phosphorylase.pulse || 0, 0.18);
}

function nearestGlycogenChainEnd(phosphorylase) {
  let best = null;
  for (const chain of state.molecules || []) {
    if (chain.used || chain.kind !== "glycogenChain" || !Array.isArray(chain.units)) continue;
    const active = chain.units
      .map((unit, index) => ({ unit, index }))
      .filter(({ unit }) => !unit.used);
    if (!active.length) continue;
    const candidates = [active[0], active[active.length - 1]];
    for (const candidate of candidates) {
      const x = chain.x + candidate.unit.dx;
      const y = chain.y + candidate.unit.dy;
      const target = glycogenActiveCenterPosition(phosphorylase, x);
      const d = distance(x, y, target.x, target.y);
      if (!best || d < best.distance) {
        best = { chain, unit: candidate.unit, x, y, target, phosphorylase, distance: d };
      }
    }
  }
  return best;
}

function glycogenActiveCenterPosition(phosphorylase) {
  const side = phosphorylase.glycogenActiveSide || -1;
  return {
    x: phosphorylase.x + side * (partWidth("glycogenPhosphorylase") / 2 + 18),
    y: phosphorylase.y + 4,
    side
  };
}

function phosphorylatePartWithAtp(dt, part, offsetX, offsetY, flag, b) {
  const target = { x: part.x + offsetX, y: part.y + offsetY };
  const atp = nearestMolecule((m) => m.kind === "atp", target.x, target.y);
  if (!atp) return false;
  atp.vx += Math.sign(target.x - atp.x) * 150 * dt;
  atp.vy += Math.sign(target.y - atp.y) * 154 * dt;
  atp.vx = Math.max(-168, Math.min(168, atp.vx));
  atp.vy = Math.max(-172, Math.min(172, atp.vy));
  if (Math.abs(atp.x - target.x) > 22 || Math.abs(atp.y - target.y) > 22) return false;
  atp.used = true;
  part[flag] = true;
  part.phosphateMarks = (part.phosphateMarks || 0) + 1;
  part.pulse = Math.max(part.pulse || 0, 0.55);
  spawnEnergyProduct("adp", target.x - 16, target.y + 10, b);
  playSound("phosphorylate");
  return true;
}

function inLocalAttractionZone(molecule, part) {
  return Math.abs(molecule.x - part.x) <= LOCAL_ATTRACTION_X;
}

function ionReachesPore(molecule, part, fromInside, b) {
  if (Math.abs(molecule.x - part.x) > PORE_REACH_X) return false;
  if (fromInside) return molecule.y < b.membraneY + b.membraneH + 26;
  return molecule.y > b.membraneY - 20;
}

function nearestMolecule(predicate, x, y) {
  let best = null;
  let bestDistance = Infinity;
  for (const molecule of state.molecules) {
    if (molecule.used || !predicate(molecule)) continue;
    const d = distance(x, y, molecule.x, molecule.y);
    if (d < bestDistance) {
      best = molecule;
      bestDistance = d;
    }
  }
  return best;
}

function checkWin(level) {
  updateElectricState();
  trackSequence(level);
  trackPropagationWave(level);
  if (state.freeRun) return;
  const gradientMetric = levelGradientMetric(level);
  let goalReached = false;
  if (level.targetLabel === "tutorial") goalReached = state.time >= 0.6 || state.parts.length > 0;
  else if (level.targetLabel === "gradient") goalReached = gradientMetric.value >= level.target;
  else if (level.targetLabel === "ATP") goalReached = state.atp >= level.target;
  else if (level.targetLabel === "potential") goalReached = Math.abs(state.potential - level.target) <= (level.tolerance || 4);
  else if (level.targetLabel === "reset") goalReached = state.potential <= level.target + (level.tolerance || 4) && gradientMetric.value >= (level.gradientTarget || 55);
  else if (level.targetLabel === "sequence") goalReached = sequenceProgress() >= level.target && Math.abs(state.potential + 30) <= 8;
  else if (level.targetLabel === "doubleSpike") goalReached = doubleSpikeProgress() >= level.target;
  else if (level.targetLabel === "cascade") goalReached = cascadeTargetValue(level) >= cascadeTargetRequired(level);
  else if (level.targetLabel === "propagation") goalReached = signalPropagatedLeftToRight();
  else if (level.targetLabel === "equilibrium") {
    const counts = oxygenCounts(true);
    goalReached = Math.abs(counts.inside - counts.outside) <= 1;
  }
  else goalReached = state.imported >= level.target;

  if (goalReached && state.goalReachedAt === null) state.goalReachedAt = state.time;
  const minRunTime = level.minRunTime || 3.2;
  const settleDelay = level.settleDelay || 0.45;
  const targetSettled = state.goalReachedAt !== null && state.time - state.goalReachedAt >= settleDelay && state.flash <= 0.01;
  const won = state.goalReachedAt !== null && state.time >= minRunTime && targetSettled;

  if (won) {
    state.won = true;
    state.running = false;
    state.paused = false;
    updatePauseButton();
    setFeedback(level.success, "success");
    playSound("win", 1, true);
  } else if (state.time >= (level.timeout || 8) && !state.won) {
    recordPotentialSample();
    updateMeters();
    const missing = state.parts.length === 0 ? "No parts are installed yet." : levels[levelIndex].hint;
    setFeedback(`${missing} Adjust the design and run it again.`, "warning");
    state.running = false;
    state.paused = false;
    updatePauseButton();
    playSound("fail");
  }
}

function trackSequence(level) {
  if (level.targetLabel === "doubleSpike") {
    trackDoubleSpike(level);
    return;
  }
  if (level.targetLabel !== "sequence") return;
  const seq = state.sequence;
  if (!seq.threshold && state.potential >= -20) markSequenceEvent("threshold");
  if (seq.threshold && !seq.peak && state.potential >= 30) markSequenceEvent("peak");
  if (seq.peak && !seq.repolarized && state.potential <= -28) markSequenceEvent("repolarized");
  if (seq.repolarized && !seq.hyperpolarized && state.potential <= -42) markSequenceEvent("hyperpolarized");
  if (seq.hyperpolarized && !seq.rested && state.potential >= -36 && state.potential <= -24) markSequenceEvent("rested");
}

function trackDoubleSpike(level) {
  const seq = state.doubleSpike;
  const secondTime = level.secondAchReleaseTime || Infinity;
  if (!seq.firstSpike && state.time < secondTime && state.potential >= 30) markDoubleSpikeEvent("firstSpike");
  if (seq.firstSpike && !seq.repolarizedBeforeSecond && state.time < secondTime && state.potential <= -28) markDoubleSpikeEvent("repolarizedBeforeSecond");
  if (state.time >= secondTime && !seq.secondPulse) markDoubleSpikeEvent("secondPulse");
  if (seq.repolarizedBeforeSecond && seq.secondPulse && !seq.secondSpike && state.potential >= 30) markDoubleSpikeEvent("secondSpike");
}

function markSequenceEvent(key) {
  state.sequence[key] = true;
  if (!Number.isFinite(state.sequenceEvents[key])) state.sequenceEvents[key] = state.time;
}

function markDoubleSpikeEvent(key) {
  state.doubleSpike[key] = true;
  if (!Number.isFinite(state.doubleSpikeEvents[key])) state.doubleSpikeEvents[key] = state.time;
}

function draw() {
  resizeCanvasToDisplay();
  const b = board();
  ctx.clearRect(0, 0, b.width, b.height);
  drawBackground(b);
  drawMolecules();
  drawParts();
  drawDragPreview();
  requestAnimationFrame(loop);
}

function drawBackground(b) {
  const level = levels[levelIndex];
  updateElectricState();
  if (level.localVoltage) {
    drawLaneCompartments(b);
  } else {
    const colors = compartmentColors();
    ctx.fillStyle = colors.outside;
    ctx.fillRect(0, 0, b.width, b.membraneY);
    ctx.fillStyle = colors.inside;
    ctx.fillRect(0, b.membraneY + b.membraneH, b.width, b.height - b.membraneY - b.membraneH);
  }

  drawLipidBilayer(b);
  if (level.myelinated) drawMyelinSheath(b, level);
  if (level.localVoltage) drawLaneVoltageLabels(b);
  if (level.targetLabel === "sequence" || level.targetLabel === "doubleSpike") drawActionPotentialEventBadges(b, level);

  ctx.fillStyle = "rgba(21, 32, 43, 0.58)";
  ctx.font = "700 15px Inter, sans-serif";
  ctx.fillText("Outside cell", 22, 32);
  ctx.fillText("Cytoplasm", 22, b.height - 24);
  if (!level.localVoltage && !potentialUiHiddenForLevel(level)) ctx.fillText(`${Math.round(state.potential)} mV`, b.width - 86, b.membraneY + b.membraneH + 24);

  drawCellOrganelles(b);
  if (level.tutorial) drawTutorialCallouts(b);
}

function drawTutorialCallouts(b) {
  const target = document.body.dataset.tutorialTarget;
  const labels = target === "board"
    ? [
      { title: "Outside cell", text: "Molecules start here", x: 28, y: 58, w: 190 },
      { title: "Membrane", text: "Place channels, pumps, and receptors across this layer", x: b.width / 2 - 170, y: b.membraneY + 12, w: 340 },
      { title: "Cytoplasm", text: "Some enzymes work inside the cell", x: 28, y: b.membraneY + b.membraneH + 48, w: 235 }
    ]
    : target === "controls"
      ? [{ title: "Run, Reset, Clear", text: "Use the buttons in the left panel to test and revise.", x: b.width - 316, y: b.height - 98, w: 286 }]
      : target === "parts"
        ? [{ title: "Practice Space", text: "Drag a part here, select it, and press Del to remove it.", x: b.width / 2 - 180, y: b.height - 96, w: 360 }]
        : [];
  if (!labels.length) return;
  ctx.save();
  ctx.font = "800 13px Inter, sans-serif";
  ctx.textBaseline = "top";
  for (const label of labels) {
    roundedRect(label.x, label.y, label.w, 54, 8);
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.fill();
    ctx.strokeStyle = "rgba(15, 118, 110, 0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#115e59";
    ctx.fillText(label.title, label.x + 11, label.y + 8);
    ctx.font = "700 11px Inter, sans-serif";
    ctx.fillStyle = "rgba(21, 32, 43, 0.66)";
    ctx.fillText(label.text, label.x + 11, label.y + 29);
    ctx.font = "800 13px Inter, sans-serif";
  }
  ctx.restore();
}

function drawLaneCompartments(b) {
  const laneCount = laneCountForLevel();
  const laneW = b.width / laneCount;
  for (let i = 0; i < laneCount; i += 1) {
    const voltage = state.lanes?.[i]?.potential ?? -30;
    const colors = colorsForPotential(voltage);
    const x = i * laneW;
    ctx.fillStyle = colors.outside;
    ctx.fillRect(x, 0, laneW + 1, b.membraneY);
    ctx.fillStyle = colors.inside;
    ctx.fillRect(x, b.membraneY + b.membraneH, laneW + 1, b.height - b.membraneY - b.membraneH);
    ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, b.height);
    ctx.stroke();
  }
}

function drawLaneVoltageLabels(b) {
  const level = levels[levelIndex];
  const laneCount = laneCountForLevel();
  const laneW = b.width / laneCount;
  const y = level.myelinated ? b.membraneY + b.membraneH + 58 : b.membraneY + b.membraneH + 24;
  const events = laneEventMap();
  ctx.save();
  ctx.font = "800 12px Inter, sans-serif";
  ctx.textBaseline = "middle";
  for (let i = 0; i < laneCount; i += 1) {
    const voltage = state.lanes?.[i]?.potential ?? -30;
    const x = i * laneW + 8;
    const text = `${Math.round(voltage)} mV`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.76)";
    roundedRect(x - 4, y - 10, 48, 20, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(21, 32, 43, 0.72)";
    ctx.fillText(text, x, y);
    const event = events.get(i);
    if (event) drawLaneEventPill(x - 4, y + 15, i, event.time, laneW);
  }
  ctx.restore();
}

function laneEventMap() {
  const map = new Map();
  for (const event of state.propagatedLaneEvents || []) {
    if (!map.has(event.lane)) map.set(event.lane, event);
  }
  return map;
}

function drawLaneEventPill(x, y, lane, time, laneW) {
  const text = `L${lane + 1} AP ${eventTimeText(time)}`;
  const w = Math.min(Math.max(64, laneW - 16), 84);
  ctx.fillStyle = "rgba(13, 148, 136, 0.9)";
  roundedRect(x, y, w, 20, 6);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 11px Inter, sans-serif";
  ctx.fillText(text, x + 6, y + 10);
}

function drawActionPotentialEventBadges(b, level) {
  const badges = actionPotentialBadges(level);
  if (!badges.length) return;
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.font = "800 12px Inter, sans-serif";
  const x = b.width - 172;
  let y = b.membraneY + b.membraneH + 25;
  for (const text of badges) {
    ctx.fillStyle = "rgba(13, 148, 136, 0.92)";
    roundedRect(x, y, 148, 22, 7);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x + 9, y + 11);
    y += 26;
  }
  ctx.restore();
}

function actionPotentialBadges(level) {
  if (level.targetLabel === "sequence") {
    const time = eventTimeText(state.sequenceEvents?.peak);
    return time ? [`AP peak ${time}`] : [];
  }
  if (level.targetLabel === "doubleSpike") {
    const badges = [];
    const first = eventTimeText(state.doubleSpikeEvents?.firstSpike);
    const second = eventTimeText(state.doubleSpikeEvents?.secondSpike);
    if (first) badges.push(`AP 1 ${first}`);
    if (second) badges.push(`AP 2 ${second}`);
    return badges;
  }
  return [];
}

function drawLipidBilayer(b) {
  const topY = b.membraneY;
  const bottomY = b.membraneY + b.membraneH;
  const midY = b.membraneY + b.membraneH / 2;
  const headTopY = topY + 13;
  const headBottomY = bottomY - 13;

  const membraneGradient = ctx.createLinearGradient(0, topY, 0, bottomY);
  membraneGradient.addColorStop(0, "#fce7a1");
  membraneGradient.addColorStop(0.22, "#f9d26d");
  membraneGradient.addColorStop(0.5, "#b45309");
  membraneGradient.addColorStop(0.78, "#f9d26d");
  membraneGradient.addColorStop(1, "#fce7a1");
  ctx.fillStyle = membraneGradient;
  ctx.fillRect(0, topY, b.width, b.membraneH);

  ctx.fillStyle = "rgba(146, 64, 14, 0.24)";
  ctx.fillRect(0, midY - 9, b.width, 18);

  ctx.strokeStyle = "rgba(120, 72, 0, 0.48)";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.fillStyle = "#fff3c4";

  for (let x = 10; x < b.width + 14; x += 18) {
    drawPhospholipid(x, headTopY, 1);
    drawPhospholipid(x + 9, headBottomY, -1);
  }
  ctx.lineCap = "butt";
}

function drawMyelinSheath(b, level) {
  const nodes = (level.ranvierNodes || []).map((fraction) => fraction * b.width).sort((a, bValue) => a - bValue);
  const nodeHalf = (level.nodeWidth || 96) / 2;
  const segments = [];
  let cursor = 0;
  for (const center of nodes) {
    const start = Math.max(0, center - nodeHalf);
    if (start > cursor) segments.push([cursor, start]);
    cursor = Math.min(b.width, center + nodeHalf);
  }
  if (cursor < b.width) segments.push([cursor, b.width]);

  ctx.save();
  for (const [start, end] of segments) {
    const width = end - start;
    if (width < 8) continue;
    const wrapGradient = ctx.createLinearGradient(0, b.membraneY - 28, 0, b.membraneY + b.membraneH + 28);
    wrapGradient.addColorStop(0, "rgba(238, 242, 255, 0.95)");
    wrapGradient.addColorStop(0.5, "rgba(165, 180, 252, 0.82)");
    wrapGradient.addColorStop(1, "rgba(238, 242, 255, 0.95)");
    ctx.fillStyle = wrapGradient;
    roundedRect(start + 4, b.membraneY - 20, width - 8, b.membraneH + 40, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(79, 70, 229, 0.32)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (const center of nodes) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillRect(center - nodeHalf, b.membraneY - 22, nodeHalf * 2, b.membraneH + 44);
    ctx.strokeStyle = "rgba(15, 118, 110, 0.42)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center - nodeHalf, b.membraneY - 18);
    ctx.lineTo(center - nodeHalf, b.membraneY + b.membraneH + 18);
    ctx.moveTo(center + nodeHalf, b.membraneY - 18);
    ctx.lineTo(center + nodeHalf, b.membraneY + b.membraneH + 18);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhospholipid(x, headY, direction) {
  const tailLength = 28;
  const bend = direction * 12;
  ctx.beginPath();
  ctx.moveTo(x - 3, headY + direction * 4.8);
  ctx.quadraticCurveTo(x - 8, headY + bend, x - 7, headY + direction * tailLength);
  ctx.moveTo(x + 3, headY + direction * 4.8);
  ctx.quadraticCurveTo(x + 9, headY + bend, x + 7, headY + direction * tailLength);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, headY, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(120, 72, 0, 0.42)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.strokeStyle = "rgba(120, 72, 0, 0.48)";
  ctx.lineWidth = 2.2;
}

function compartmentColors() {
  const charges = chargeCounts();
  return colorsForChargeDifference(charges.inside - charges.outside);
}

function colorsForPotential(voltage) {
  return colorsForChargeDifference(voltage / 3);
}

function colorsForChargeDifference(difference) {
  const amount = Math.min(1, Math.abs(difference * 3) / 60);
  const neutral = [222, 238, 232];
  const red = [255, 205, 193];
  const blue = [196, 225, 255];
  if (difference > 0) {
    return {
      inside: rgb(mix(neutral, red, amount)),
      outside: rgb(mix(neutral, blue, amount))
    };
  }
  if (difference < 0) {
    return {
      inside: rgb(mix(neutral, blue, amount)),
      outside: rgb(mix(neutral, red, amount))
    };
  }
  return {
    inside: rgb(neutral),
    outside: rgb(neutral)
  };
}

function mix(a, b, t) {
  return a.map((value, index) => Math.round(value + (b[index] - value) * t));
}

function rgb(parts) {
  return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
}

function drawCellOrganelles(b) {
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = "#91d5ad";
  roundedRect(b.width - 180, b.height - 124, 112, 66, 28);
  ctx.fill();
  ctx.strokeStyle = "#3f8f63";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 4; i += 1) {
    ctx.moveTo(b.width - 160 + i * 24, b.height - 96);
    ctx.quadraticCurveTo(b.width - 148 + i * 24, b.height - 112, b.width - 136 + i * 24, b.height - 96);
    ctx.quadraticCurveTo(b.width - 124 + i * 24, b.height - 80, b.width - 112 + i * 24, b.height - 96);
  }
  ctx.stroke();

  ctx.fillStyle = "#b7dfef";
  ctx.beginPath();
  ctx.arc(b.width - 70, b.height - 225, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMolecules() {
  ctx.font = "800 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const m of state.molecules) {
    if (m.used) continue;
    if (m.kind === "glycogenChain") {
      drawGlycogenChain(m);
      continue;
    }
    if (["atp", "adp", "phosphate", "pyrophosphate"].includes(m.kind)) {
      drawEnergyMolecule(m);
      continue;
    }
    if (m.kind === "gAlpha" || m.kind === "pkaCatalytic") {
      drawProteinSubunitMolecule(m);
      continue;
    }
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = ["acetylcholine", "adrenaline", "cAMP", "gAlpha", "pkaCatalytic"].includes(m.kind) ? "900 8px Inter, sans-serif" : "800 12px Inter, sans-serif";
    ctx.fillText(m.label, m.x, m.y + 1);
  }
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function drawGlycogenChain(chain) {
  const units = (chain.units || []).filter((unit) => !unit.used);
  if (!units.length) return;
  ctx.save();
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(146, 64, 14, 0.42)";
  ctx.beginPath();
  units.forEach((unit, index) => {
    const x = chain.x + unit.dx;
    const y = chain.y + unit.dy;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  for (const unit of units) {
    const x = chain.x + unit.dx;
    const y = chain.y + unit.dy;
    ctx.beginPath();
    ctx.fillStyle = "#b45309";
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 2;
    ctx.arc(x, y, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawParts() {
  for (const part of state.parts) {
    if (part.type === "gProtein") drawGProteinLink(part);
  }
  for (const part of state.parts) {
    updatePartOpenState(part);
    drawPart(part, false);
  }
}

function drawEnergyMolecule(m) {
  ctx.save();
  ctx.translate(m.x, m.y);
  if (m.kind === "phosphate" || m.kind === "pyrophosphate") {
    const phosphates = m.kind === "pyrophosphate" ? [-7, 7] : [0];
    ctx.beginPath();
    for (const x of phosphates) {
      ctx.beginPath();
      ctx.fillStyle = m.color;
      ctx.arc(x, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "900 8px Inter, sans-serif";
      ctx.fillText("P", x, 0.5);
    }
    ctx.restore();
    return;
  }
  const phosphateCount = m.kind === "atp" ? 3 : 2;
  ctx.fillStyle = "#c4b5fd";
  roundedRect(-27, -8, 18, 16, 6);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "900 7px Inter, sans-serif";
  ctx.fillText("A", -18, 0.5);
  for (let i = 0; i < phosphateCount; i += 1) {
    const x = -1 + i * 13;
    ctx.beginPath();
    ctx.fillStyle = i === phosphateCount - 1 && m.kind === "atp" ? "#a78bfa" : "#8b5cf6";
    ctx.arc(x, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 6px Inter, sans-serif";
    ctx.fillText("P", x, 0.5);
  }
  ctx.restore();
}

function drawProteinSubunitMolecule(m, localX = null, localY = null) {
  const x = localX === null ? m.x : localX;
  const y = localY === null ? m.y : localY;
  ctx.save();
  if (localX === null) ctx.translate(0, 0);
  ctx.fillStyle = m.color;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawTrianglePath(x, y, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "900 8px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(m.label, x, y + 1);
  ctx.restore();
}

function drawTrianglePath(x, y, size) {
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size, y + size * 0.82);
  ctx.lineTo(x + size, y + size * 0.82);
  ctx.closePath();
}

function drawGProteinLink(part) {
  const receptor = part.linkedReceptor
    ? state.parts.find((candidate) => candidate.id === part.linkedReceptor)
    : state.parts.find((candidate) => candidate.type === "betaAdrenergicReceptor" && distance(candidate.x, candidate.y, part.x, part.y) < 150);
  if (!receptor) return;
  ctx.save();
  ctx.strokeStyle = part.active ? "rgba(20, 184, 166, 0.78)" : "rgba(20, 184, 166, 0.38)";
  ctx.lineWidth = part.active ? 4 : 3;
  ctx.setLineDash(part.active ? [] : [5, 5]);
  ctx.beginPath();
  ctx.moveTo(receptor.x, receptor.y + 34);
  ctx.quadraticCurveTo((receptor.x + part.x) / 2, receptor.y + 70, part.x, part.y + 34);
  ctx.stroke();
  ctx.restore();
}

function drawGProteinComplex(part, w, h) {
  const active = isPartOpen(part);
  const color = partTypes.gProtein.color;
  ctx.fillStyle = active ? activePartColor(color) : color;
  ctx.strokeStyle = "rgba(255,255,255,0.86)";
  ctx.lineWidth = 2;
  const subunits = part.alphaReleased
    ? [{ x: -17, y: 15, label: "β" }, { x: 17, y: 15, label: "γ" }]
    : [{ x: 0, y: -18, label: "α" }, { x: -20, y: 17, label: "β" }, { x: 20, y: 17, label: "γ" }];
  for (const subunit of subunits) {
    ctx.beginPath();
    if (subunit.label === "α") {
      ctx.moveTo(subunit.x, subunit.y - 18);
      ctx.lineTo(subunit.x - 18, subunit.y + 16);
      ctx.lineTo(subunit.x + 18, subunit.y + 16);
      ctx.closePath();
    } else {
      ctx.arc(subunit.x, subunit.y, 17, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "900 13px Inter, sans-serif";
    ctx.fillText(subunit.label, subunit.x, subunit.y + 1);
    ctx.fillStyle = active ? activePartColor(color) : color;
  }
  ctx.fillStyle = "#fff";
  ctx.font = "900 10px Inter, sans-serif";
  ctx.fillText("G", 0, -43);
}

function drawPart(part, ghost) {
  const type = partTypes[part.type];
  const w = partWidth(part.type);
  const h = part.type === "receptor" ? 92 : 112;
  const open = isPartOpen(part);
  ctx.save();
  ctx.globalAlpha = ghost ? 0.65 : 1;
  ctx.translate(part.x, part.y);
  if (!ghost && part.id === state.selectedPartId) {
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    roundedRect(-w / 2 - 7, -h / 2 - 7, w + 14, h + 14, 18);
    ctx.stroke();
  }
  if (part.pulse > 0) {
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 52 + part.pulse * 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (part.type === "proteinKinaseA") {
    drawPkaComplex(part, w, h, open);
    ctx.restore();
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
    return;
  }
  if (part.type === "gProtein") {
    drawGProteinComplex(part, w, h);
    ctx.restore();
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
    return;
  }
  ctx.fillStyle = open ? activePartColor(type.color) : type.color;
  roundedRect(-w / 2, -h / 2, w, h, 16);
  ctx.fill();
  if (part.pulse > 0) {
    ctx.fillStyle = `rgba(254, 240, 138, ${Math.min(0.65, 0.25 + part.pulse)})`;
    roundedRect(-w / 2, -h / 2, w, h, 16);
    ctx.fill();
  }
  ctx.fillStyle = open ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.22)";
  roundedRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 10);
  ctx.fill();
  if (open && showsTransportPore(part.type)) {
    ctx.strokeStyle = "#fef9c3";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -h / 2 + 18);
    ctx.lineTo(0, h / 2 - 18);
    ctx.stroke();
    ctx.lineCap = "butt";
  }
  ctx.fillStyle = "#fff";
  ctx.font = part.type === "gated" || part.type === "synthase" || part.type === "acetylcholineReceptor" ? "800 14px Inter, sans-serif" : "900 18px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(type.short, 0, 0);
  if (part.type === "acetylcholineReceptor" && part.boundACh) drawBoundAcetylcholine(h);
  if (part.type === "betaAdrenergicReceptor" && part.boundAdrenaline) drawBoundAdrenaline(h);
  if (part.type === "adenylylCyclase") drawGAlphaDockingSocket(part, h);
  if (part.type === "phosphorylaseKinase") drawPhosphorylaseKinaseSlots(part, h);
  if (part.type === "glycogenPhosphorylase") drawGlycogenPhosphorylaseActiveCenter(part, w);
  if (part.type === "sodiumPotassiumPump") drawSodiumPotassiumSlots(part, w, h);
  drawPhosphateMarks(part, w, h);
  ctx.restore();
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function showsTransportPore(type) {
  return [
    "channel",
    "transporter",
    "pump",
    "synthase",
    "protonPump",
    "sodiumChannel",
    "potassiumChannel",
    "sodiumPotassiumPump",
    "restingLeak",
    "acetylcholineReceptor",
    "voltageSodiumChannel",
    "delayedPotassiumChannel",
    "gated"
  ].includes(type);
}

function drawGlycogenPhosphorylaseActiveCenter(part, w) {
  const side = part.glycogenActiveSide || -1;
  const x = side * (w / 2 + 18);
  const y = 4;
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = part.active ? "#fbbf24" : "rgba(255,255,255,0.36)";
  ctx.strokeStyle = part.active ? "#fff7ed" : "rgba(255,255,255,0.82)";
  ctx.lineWidth = 3;
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = part.active ? "#92400e" : "rgba(21,32,43,0.28)";
  ctx.arc(x, y, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPkaComplex(part, w, h, open) {
  ensurePkaSlots(part);
  const color = partTypes.proteinKinaseA.color;
  ctx.fillStyle = open ? activePartColor(color) : color;
  ctx.strokeStyle = "rgba(255,255,255,0.82)";
  ctx.lineWidth = 2;

  for (const x of [-22, 22]) {
    roundedRect(x - 18, -42, 36, 48, 10);
    ctx.fill();
    ctx.stroke();
  }

  if (!part.catalyticReleased) {
    for (const x of [-22, 22]) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x - 19, 46);
      ctx.lineTo(x + 19, 46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.setLineDash([4, 4]);
    for (const x of [-22, 22]) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x - 19, 46);
      ctx.lineTo(x + 19, 46);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  drawPkaCampSlot(part, 0, "R1");
  drawPkaCampSlot(part, 1, "");
  drawPkaCampSlot(part, 2, "R2");
  drawPkaCampSlot(part, 3, "");

  ctx.fillStyle = "#fff";
  ctx.font = "900 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("R", -22, -2);
  ctx.fillText("R", 22, -2);
  if (!part.catalyticReleased) {
    ctx.fillText("C", -22, 35);
    ctx.fillText("C", 22, 35);
  }
  ctx.font = "900 10px Inter, sans-serif";
  ctx.fillText("PKA", 0, -52);
}

function drawPkaCampSlot(part, index, label) {
  const local = pkaCampSlotPosition({ x: 0, y: 0 }, index);
  const filled = Boolean(part.boundCamp && part.boundCamp[index]);
  ctx.beginPath();
  ctx.fillStyle = filled ? "#38bdf8" : "rgba(255,255,255,0.2)";
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.arc(local.x, local.y, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = filled ? "#fff" : "rgba(255,255,255,0.75)";
  ctx.font = "900 5.5px Inter, sans-serif";
  ctx.fillText("c", local.x, local.y + 0.5);
  if (label) {
    ctx.font = "800 7px Inter, sans-serif";
    ctx.fillText(label, local.x, local.y - 12);
  }
}

function drawBoundAcetylcholine(h) {
  ctx.beginPath();
  ctx.fillStyle = "#c084fc";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.arc(0, -h / 2 - 7, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "900 7px Inter, sans-serif";
  ctx.fillText("ACh", 0, -h / 2 - 6);
}

function drawBoundAdrenaline(h) {
  ctx.beginPath();
  ctx.fillStyle = "#f472b6";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.arc(0, -h / 2 - 7, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "900 7px Inter, sans-serif";
  ctx.fillText("Adr", 0, -h / 2 - 6);
}

function drawGAlphaDockingSocket(part, h) {
  const y = h / 2 - 14;
  drawProteinDockingSocket(0, y, "#14b8a6");
  if (part.boundGAlpha) {
    drawProteinSubunitMolecule({ kind: "gAlpha", color: "#14b8a6", label: "Gα" }, 0, y);
    drawProteinSocketRim(0, y, "#14b8a6");
  }
}

function drawPhosphorylaseKinaseSlots(part, h) {
  ensurePhosphorylaseKinaseSlots(part);
  for (let index = 0; index < 2; index += 1) {
    const x = index === 0 ? -20 : 20;
    const y = -h / 2 + 16;
    drawProteinDockingSocket(x, y, "#f59e0b");
    if (part.boundCatalytic[index]) {
      drawProteinSubunitMolecule({ kind: "pkaCatalytic", color: "#f59e0b", label: "Cat" }, x, y);
      drawProteinSocketRim(x, y, "#f59e0b");
    }
  }
}

function drawProteinDockingSocket(x, y, color) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.fillStyle = "rgba(15, 23, 42, 0.42)";
  ctx.beginPath();
  drawTrianglePath(x, y, 21);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  drawTrianglePath(x, y - 1, 15);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  drawTrianglePath(x, y, 21);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  drawTrianglePath(x, y, 25);
  ctx.stroke();
  ctx.restore();
}

function drawProteinSocketRim(x, y, color) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.94)";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  drawTrianglePath(x, y, 22);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  drawTrianglePath(x, y, 25);
  ctx.stroke();
  ctx.restore();
}

function drawPhosphateMarks(part, w, h) {
  const count = part.phosphateMarks || 0;
  if (!count) return;
  for (let i = 0; i < count; i += 1) {
    const x = w / 2 - 15 - i * 16;
    const y = -h / 2 + 16;
    ctx.beginPath();
    ctx.fillStyle = "#a78bfa";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "900 6px Inter, sans-serif";
    ctx.fillText("P", x, y + 0.5);
  }
}

function drawSodiumPotassiumSlots(part, w, h) {
  ensurePumpSlots(part);
  drawPumpSlotRow(PUMP_K_OFFSETS, part.boundK, -h / 2 + 17, "#84cc16", "K");
  drawPumpSlotRow(PUMP_NA_OFFSETS, part.boundNa, h / 2 - 17, "#0ea5e9", "Na");
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "800 10px Inter, sans-serif";
  ctx.fillText("2 K+ in", 0, -h / 2 + 34);
  ctx.fillText("3 Na+ out", 0, h / 2 - 34);
}

function drawPumpSlotRow(offsets, boundIons, y, color, label) {
  for (let index = 0; index < offsets.length; index += 1) {
    const filled = Boolean(boundIons[index]);
    ctx.beginPath();
    ctx.fillStyle = filled ? color : "rgba(255,255,255,0.18)";
    ctx.strokeStyle = "rgba(255,255,255,0.86)";
    ctx.lineWidth = 2;
    ctx.arc(offsets[index], y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = filled ? "#fff" : "rgba(255,255,255,0.75)";
    ctx.font = "900 7px Inter, sans-serif";
    ctx.fillText(label, offsets[index], y + 0.5);
  }
}

function updatePartOpenState(part) {
  if (["channel", "transporter", "pump", "synthase", "protonPump", "sodiumChannel", "potassiumChannel", "sodiumPotassiumPump", "restingLeak"].includes(part.type)) {
    part.active = true;
  }
}

function isPartOpen(part) {
  if (part.type === "receptor" || part.type === "acetylcholineReceptor" || part.type === "betaAdrenergicReceptor") return part.active;
  if (["gProtein", "adenylylCyclase", "proteinKinaseA", "phosphorylaseKinase", "glycogenPhosphorylase"].includes(part.type)) return part.active;
  if (part.type === "voltageSodiumChannel" || part.type === "delayedPotassiumChannel" || part.type === "gated") return part.active;
  return ["channel", "transporter", "pump", "synthase", "protonPump", "sodiumChannel", "potassiumChannel", "sodiumPotassiumPump", "restingLeak"].includes(part.type);
}

function activePartColor(hex) {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  return rgb(mix(channels, [250, 204, 21], 0.32));
}

function drawDragPreview() {
  if (!drag) return;
  drawPart({ type: drag.type, x: pointer.x, y: pointer.y, active: false, pulse: 0 }, true);
}

function loop(now) {
  const dt = Math.min(0.25, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(dt);
  draw();
}

function resizeCanvasToDisplay() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(620, Math.floor(rect.width * dpr));
  const height = Math.max(430, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    anchorPartsToMembrane();
  }
}

function anchorPartsToMembrane() {
  if (!state.parts) return;
  const level = levels[levelIndex];
  const b = board();
  for (const part of state.parts) {
    part.x = clampPartXForLevel(level, part.type, part.x, b);
    part.y = partYForPlacement(part.type, part.y, b);
  }
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

canvas.addEventListener("dragover", (event) => event.preventDefault());
canvas.addEventListener("drop", (event) => {
  event.preventDefault();
  const type = event.dataTransfer.getData("text/plain");
  const p = screenToCanvas(event);
  if (partTypes[type]) addPart(type, p.x, p.y);
});

canvas.addEventListener("pointerdown", (event) => {
  pointer = screenToCanvas(event);
  const p = partAt(pointer.x, pointer.y);
  if (p) {
    state.selectedPartId = p.id;
    drag = { part: p, type: p.type, fromToolbox: false };
    state.running = false;
    state.paused = false;
    updateLevelUi();
    setFeedback(`${partTypes[p.type].name} selected.`, "");
  } else if (state.selectedPartId) {
    state.selectedPartId = null;
    state.paused = false;
    updateLevelUi();
  }
});

canvas.addEventListener("pointermove", (event) => {
  pointer = screenToCanvas(event);
  if (drag && drag.part) {
    const b = board();
    const level = levels[levelIndex];
    drag.part.x = clampPartXForLevel(level, drag.part.type, pointer.x, b);
    drag.part.y = partYForPlacement(drag.part.type, pointer.y, b);
    state.running = false;
    state.paused = false;
    state.freeRun = false;
    updatePauseButton();
  }
});

window.addEventListener("pointermove", (event) => {
  if (drag && drag.fromToolbox) pointer = screenToCanvas(event);
});

window.addEventListener("pointerup", () => {
  if (drag && drag.fromToolbox) addPart(drag.type, pointer.x, pointer.y);
  drag = null;
});

el.runButton.addEventListener("click", () => {
  playSound("run", 1, true);
  const continuingAfterTarget = state.freeRun || state.won || state.goalReachedAt !== null;
  const runningWithoutParts = !state.parts.length && levels[levelIndex].parts.length > 0;
  state.running = true;
  state.paused = false;
  state.won = false;
  state.freeRun = continuingAfterTarget;
  if (!continuingAfterTarget) {
    state.time = 0;
    state.goalReachedAt = null;
    state.potentialTrace = [{ time: 0, potential: state.potential }];
    state.lastTraceTime = 0;
  } else {
    state.goalReachedAt = null;
  }
  updateElectricState();
  state.selectedPartId = null;
  updateLevelUi();
  setFeedback(levels[levelIndex].tutorial ? "Tutorial checked. Use the right arrow to start Unit 1." : continuingAfterTarget ? "Free run resumed. The simulation will keep going past the target." : runningWithoutParts ? "Simulation running without installed parts." : "Simulation running. Watch molecules, ATP, and the gradient change.", "");
});

el.pauseButton.addEventListener("click", () => {
  if (state.running) {
    playSound("pause", 1, true);
    state.running = false;
    state.paused = true;
    updatePauseButton();
    setFeedback("Simulation paused. Press Unpause to continue.", "");
    return;
  }
  if (state.paused) {
    playSound("run", 1, true);
    state.running = true;
    state.paused = false;
    updatePauseButton();
    setFeedback("Simulation resumed.", "");
    return;
  }
  setFeedback("Press Run to start the simulation.", "warning");
  playSound("fail");
});

el.resetButton.addEventListener("click", () => {
  playSound("reset", 1, true);
  resetLevel(true);
});
el.clearButton.addEventListener("click", () => {
  playSound("remove", 1, true);
  resetLevel(false);
});
el.soundButton.addEventListener("click", () => {
  sound.enabled = !sound.enabled;
  saveSoundPreference();
  updateSoundButton();
  if (sound.enabled) playSound("toggle", 1, true);
});
window.addEventListener("keydown", (event) => {
  if (event.key !== "Delete" && event.key !== "Backspace") return;
  const tag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : "";
  if (tag === "input" || tag === "textarea" || tag === "select" || event.target?.isContentEditable) return;
  event.preventDefault();
  removeSelectedPart();
});
el.prevLevel.addEventListener("click", () => {
  playSound("ui", 1, true);
  const firstPlayable = firstPlayableLevelIndex();
  levelIndex = levelIndex > 0 && levelIndex !== firstPlayable ? levelIndex - 1 : levels.length - 1;
  resetLevel();
});
el.nextLevel.addEventListener("click", () => {
  playSound("ui", 1, true);
  levelIndex = levelIndex < levels.length - 1 ? levelIndex + 1 : firstPlayableLevelIndex();
  resetLevel();
});

window.cellMachineDebug = {
  state: () => state,
  level: () => levels[levelIndex],
  levels: () => levels,
  setLevel: (index) => {
    levelIndex = Math.max(0, Math.min(levels.length - 1, index));
    resetLevel();
  },
  addPart,
  resetLevel,
  update,
  sequenceProgress,
  doubleSpikeProgress
};

const requestedLevel = Number(new URLSearchParams(window.location.search).get("level"));
if (Number.isFinite(requestedLevel)) {
  levelIndex = Math.max(0, Math.min(levels.length - 1, requestedLevel - 1));
}
updateSoundButton();
resetLevel();
requestAnimationFrame(() => {
  applyLevelVisibility(levels[levelIndex]);
  updateMeters();
});
requestAnimationFrame(loop);
