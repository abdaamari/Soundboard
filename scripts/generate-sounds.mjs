/**
 * Generator suara bawaan untuk Meme Soundboard Tim 🔊
 *
 * Mensintesis file WAV (mono, 16-bit, 44.1kHz) secara programatik supaya
 * tidak ada masalah hak cipta. Jalankan dengan:
 *
 *   node scripts/generate-sounds.mjs
 *
 * Output: public/sounds/*.wav
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 44100;
const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "sounds",
);

// ---------------------------------------------------------------------------
// Utilitas buffer & WAV
// ---------------------------------------------------------------------------

function createBuffer(seconds) {
  return new Float64Array(Math.ceil(seconds * SAMPLE_RATE));
}

function writeWav(path, samples) {
  const peak = samples.reduce((max, v) => Math.max(max, Math.abs(v)), 0) || 1;
  const scale = 0.92 / peak; // normalisasi supaya tidak pecah (clipping)

  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] * scale));
    data.writeInt16LE(Math.round(s * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // format: PCM
  header.writeUInt16LE(1, 22); // channels: mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);

  writeFileSync(path, Buffer.concat([header, data]));
}

// ---------------------------------------------------------------------------
// Osilator
// ---------------------------------------------------------------------------

function oscSample(type, phase) {
  const p = phase % (Math.PI * 2);
  switch (type) {
    case "square":
      return Math.sin(p) >= 0 ? 1 : -1;
    case "saw":
      return (p / Math.PI) - 1;
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(p));
    case "sine":
    default:
      return Math.sin(p);
  }
}

/**
 * Tambahkan satu nada dengan envelope attack/release dan frekuensi
 * yang bisa berubah (sweep) dari `freq` ke `endFreq`.
 */
function addTone(
  buf,
  { start, dur, freq, endFreq = freq, type = "sine", gain = 0.4, attack = 0.01, release = 0.08, harmonics = 0, vibrato = 0, vibratoRate = 5 },
) {
  const s0 = Math.floor(start * SAMPLE_RATE);
  const n = Math.floor(dur * SAMPLE_RATE);
  const attackSamples = Math.max(1, Math.floor(attack * SAMPLE_RATE));
  const releaseSamples = Math.max(1, Math.floor(release * SAMPLE_RATE));
  let phase = 0;

  for (let i = 0; i < n; i++) {
    const idx = s0 + i;
    if (idx >= buf.length) break;

    const t = i / SAMPLE_RATE;
    const progress = i / n;
    let f = freq + (endFreq - freq) * progress;
    if (vibrato > 0) f += vibrato * Math.sin(2 * Math.PI * vibratoRate * t);

    phase += (2 * Math.PI * f) / SAMPLE_RATE;

    let sample = oscSample(type, phase);
    for (let h = 2; h <= 1 + harmonics; h++) {
      sample += (1 / h) * oscSample(type, phase * h);
    }

    let env = 1;
    if (i < attackSamples) env = i / attackSamples;
    else if (i > n - releaseSamples) env = Math.max(0, (n - i) / releaseSamples);

    buf[idx] += sample * env * gain;
  }
}

/**
 * Tambahkan derau (noise) dengan filter satu-tahap lowpass/highpass
 * dan amplitudo yang bisa dimodulasi (untuk efek "scrub"/derak).
 */
function addNoise(
  buf,
  { start, dur, gain = 0.4, lpf = 18000, hpf = 0, attack = 0.005, release = 0.1, modRate = 0, modDepth = 0 },
) {
  const s0 = Math.floor(start * SAMPLE_RATE);
  const n = Math.floor(dur * SAMPLE_RATE);
  const attackSamples = Math.max(1, Math.floor(attack * SAMPLE_RATE));
  const releaseSamples = Math.max(1, Math.floor(release * SAMPLE_RATE));
  const lpAlpha = 1 - Math.exp((-2 * Math.PI * lpf) / SAMPLE_RATE);
  const hpAlpha = 1 - Math.exp((-2 * Math.PI * hpf) / SAMPLE_RATE);

  let lpState = 0;
  let hpState = 0;
  let prevInput = 0;

  for (let i = 0; i < n; i++) {
    const idx = s0 + i;
    if (idx >= buf.length) break;

    const white = Math.random() * 2 - 1;

    // Lowpass satu tahap
    lpState += lpAlpha * (white - lpState);
    let sample = lpState;

    // Highpass satu tahap (y = alpha * (y_prev + x - x_prev))
    if (hpf > 0) {
      hpState = hpAlpha * (hpState + sample - prevInput);
      prevInput = sample;
      sample = hpState;
    }

    let env = 1;
    if (i < attackSamples) env = i / attackSamples;
    else if (i > n - releaseSamples) env = Math.max(0, (n - i) / releaseSamples);
    if (modRate > 0) {
      env *= 1 - modDepth * (0.5 + 0.5 * Math.sin(2 * Math.PI * modRate * (i / SAMPLE_RATE)));
    }

    buf[idx] += sample * env * gain;
  }
}

/** Klik pendek sebagai serangan (attack) — mis. untuk efek boom. */
function addClick(buf, { start, gain = 0.5, dur = 0.02 }) {
  addNoise(buf, { start, dur, gain, lpf: 6000, hpf: 500, attack: 0.001, release: 0.015 });
}

// ---------------------------------------------------------------------------
// Daftar suara
// ---------------------------------------------------------------------------

const SOUNDS = [
  {
    file: "airhorn.wav",
    duration: 1.5,
    render(buf) {
      // Klakson blare: saw terdetune + sedikit pitch-bend di awal.
      addTone(buf, { start: 0, dur: 1.4, freq: 440, endFreq: 466, type: "saw", gain: 0.3, attack: 0.02, release: 0.2, harmonics: 6 });
      addTone(buf, { start: 0, dur: 1.4, freq: 447, endFreq: 474, type: "saw", gain: 0.26, attack: 0.02, release: 0.2, harmonics: 6 });
      addTone(buf, { start: 0, dur: 1.4, freq: 932, type: "square", gain: 0.1, attack: 0.02, release: 0.2 });
    },
  },
  {
    file: "vine-boom.wav",
    duration: 1.6,
    render(buf) {
      addClick(buf, { start: 0, gain: 0.45 });
      addTone(buf, { start: 0, dur: 1.2, freq: 130, endFreq: 33, type: "sine", gain: 0.75, attack: 0.004, release: 0.6 });
      addTone(buf, { start: 0, dur: 0.5, freq: 260, endFreq: 66, type: "triangle", gain: 0.3, attack: 0.004, release: 0.35 });
    },
  },
  {
    file: "drum-roll.wav",
    duration: 2.4,
    render(buf) {
      // Pukulan yang makin cepat (accelerando) lalu ditutup crash.
      let t = 0;
      let interval = 0.16;
      while (t < 1.7) {
        addNoise(buf, { start: t, dur: 0.07, gain: 0.4, lpf: 5200, hpf: 300, attack: 0.002, release: 0.05 });
        addTone(buf, { start: t, dur: 0.07, freq: 190, endFreq: 150, type: "sine", gain: 0.25, attack: 0.002, release: 0.05 });
        t += interval;
        interval = Math.max(0.045, interval * 0.86);
      }
      addNoise(buf, { start: 1.75, dur: 0.65, gain: 0.4, lpf: 16000, hpf: 2500, attack: 0.003, release: 0.6 });
    },
  },
  {
    file: "sad-violin.wav",
    duration: 3.2,
    render(buf) {
      const notes = [392, 349.23, 329.63, 293.66, 261.63]; // G4 F4 E4 D4 C4
      notes.forEach((freq, i) => {
        addTone(buf, {
          start: i * 0.55,
          dur: 0.75,
          freq,
          type: "sine",
          gain: 0.4,
          attack: 0.06,
          release: 0.3,
          harmonics: 3,
          vibrato: 4,
          vibratoRate: 6,
        });
      });
      // Nada terakhir ditahan panjang + turun pelan.
      addTone(buf, { start: 2.75, dur: 0.45, freq: 261.63, endFreq: 246.94, type: "sine", gain: 0.35, attack: 0.05, release: 0.3, harmonics: 3, vibrato: 5, vibratoRate: 6 });
    },
  },
  {
    file: "record-scratch.wav",
    duration: 0.8,
    render(buf) {
      // Derak vinyl: derau di-band-pass dengan modulasi amplitudo cepat.
      addNoise(buf, { start: 0, dur: 0.7, gain: 0.5, lpf: 3600, hpf: 900, attack: 0.01, release: 0.1, modRate: 26, modDepth: 0.75 });
      addNoise(buf, { start: 0, dur: 0.7, gain: 0.2, lpf: 9000, hpf: 4000, attack: 0.01, release: 0.1, modRate: 13, modDepth: 0.6 });
    },
  },
  {
    file: "tada.wav",
    duration: 1.8,
    render(buf) {
      const arpeggio = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      arpeggio.forEach((freq, i) => {
        addTone(buf, { start: i * 0.13, dur: 0.16, freq, type: "square", gain: 0.28, attack: 0.01, release: 0.06 });
      });
      // Akor final menggema.
      [523.25, 659.25, 783.99].forEach((freq) => {
        addTone(buf, { start: 0.55, dur: 1.1, freq, type: "square", gain: 0.16, attack: 0.02, release: 0.7 });
      });
      addNoise(buf, { start: 0.55, dur: 0.9, gain: 0.14, lpf: 12000, hpf: 4000, attack: 0.01, release: 0.85 });
    },
  },
  {
    file: "ding.wav",
    duration: 1.4,
    render(buf) {
      addTone(buf, { start: 0, dur: 1.3, freq: 880, type: "sine", gain: 0.4, attack: 0.005, release: 1.1 });
      addTone(buf, { start: 0, dur: 1.3, freq: 1318.51, type: "sine", gain: 0.22, attack: 0.005, release: 0.9 });
      addTone(buf, { start: 0, dur: 1.0, freq: 1760, type: "sine", gain: 0.1, attack: 0.005, release: 0.7 });
    },
  },
  {
    file: "bruh.wav",
    duration: 1.2,
    render(buf) {
      // Nada rendah dua syllable ala "bruh".
      addTone(buf, { start: 0, dur: 0.4, freq: 146.83, endFreq: 138.59, type: "saw", gain: 0.35, attack: 0.03, release: 0.15, harmonics: 4 });
      addTone(buf, { start: 0.45, dur: 0.65, freq: 130.81, endFreq: 116.54, type: "saw", gain: 0.35, attack: 0.04, release: 0.45, harmonics: 4 });
    },
  },
  {
    file: "sad-trombone.wav",
    duration: 2.6,
    render(buf) {
      // "wah wah wah waaah" — tiada nada ditahan lalu jatuh di akhir.
      const notes = [261.63, 246.94, 233.08, 220];
      notes.slice(0, 3).forEach((freq, i) => {
        addTone(buf, { start: i * 0.45, dur: 0.4, freq, type: "saw", gain: 0.3, attack: 0.05, release: 0.2, harmonics: 5, vibrato: 3, vibratoRate: 5.5 });
      });
      addTone(buf, { start: 1.35, dur: 1.1, freq: 220, endFreq: 174.61, type: "saw", gain: 0.32, attack: 0.06, release: 0.7, harmonics: 5, vibrato: 4, vibratoRate: 5.5 });
    },
  },
  {
    file: "boing.wav",
    duration: 1.0,
    render(buf) {
      // Pegas: frekuensi memantul makin kecil (spring decay).
      const s0 = 0;
      const n = Math.floor(0.95 * SAMPLE_RATE);
      let phase = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SAMPLE_RATE;
        const f = 240 + 820 * Math.exp(-5.5 * t) * (0.5 + 0.5 * Math.cos(2 * Math.PI * 7 * t));
        phase += (2 * Math.PI * f) / SAMPLE_RATE;
        const env = Math.min(1, i / 200) * Math.max(0, 1 - t / 0.95);
        buf[s0 + i] += oscSample("sine", phase) * env * 0.55;
      }
    },
  },
];

// ---------------------------------------------------------------------------
// Jalankan
// ---------------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });

for (const sound of SOUNDS) {
  const buf = createBuffer(sound.duration);
  sound.render(buf);
  const path = join(OUT_DIR, sound.file);
  writeWav(path, buf);
  const kb = (buf.length * 2 + 44) / 1024;
  console.log(`✓ ${sound.file} (${kb.toFixed(0)} KB)`);
}

console.log(`\nSelesai! ${SOUNDS.length} suara ditulis ke public/sounds/`);
