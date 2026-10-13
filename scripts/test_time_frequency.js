/**
 * Focused scientific tests for the shared experiment signal, STFT, and CWT.
 * Run: node scripts/test_time_frequency.js
 */
import { generateExperimentSignal } from '../src/signal/signalGenerator.js';
import { calculateSTFT, STFT_ALLOWED_WINDOW_LENGTHS, hannWindow } from '../src/transforms/stft.js';
import { calculateCWT } from '../src/transforms/cwt.js';

const FS = 1000;
const DURATION = 2;
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log('  PASS:', msg);
  } else {
    failed += 1;
    console.error('  FAIL:', msg);
  }
}

function nearestIdx(arr, val) {
  let bi = 0;
  let bd = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i] - val);
    if (d < bd) {
      bd = d;
      bi = i;
    }
  }
  return bi;
}

function peakFreqAtTime(z, y, tIdx, fMin = -Infinity, fMax = Infinity) {
  let best = -Infinity;
  let bestF = null;
  for (let fi = 0; fi < y.length; fi++) {
    if (y[fi] < fMin || y[fi] > fMax) continue;
    const v = z[fi][tIdx];
    if (v > best) {
      best = v;
      bestF = y[fi];
    }
  }
  return { f: bestF, mag: best };
}

function allFinite(z) {
  for (const row of z) {
    for (const v of row) {
      if (!Number.isFinite(v)) return false;
    }
  }
  return true;
}

function sine(freq, fs, duration, amp = 1) {
  const N = fs * duration;
  const s = new Array(N);
  for (let i = 0; i < N; i++) {
    s[i] = amp * Math.sin((2 * Math.PI * freq * i) / fs);
  }
  return s;
}

function burst(freq, fs, duration, t0, t1, amp = 1) {
  const N = fs * duration;
  const s = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    const t = i / fs;
    if (t >= t0 && t <= t1) {
      s[i] = amp * Math.sin(2 * Math.PI * freq * t);
    }
  }
  return s;
}

console.log('\n=== 1. Common experiment signal ===');
{
  const signal = generateExperimentSignal(FS, DURATION);
  assert(signal.length === FS * DURATION, `sample count N=${signal.length} equals fs*duration=2000`);
  assert(Math.abs(signal[0]) < 1e-12, 's[0] ≈ 0');

  const i05 = Math.round(0.5 * FS);
  const expected05 = Math.sin(2 * Math.PI * 50 * 0.5);
  assert(Math.abs(signal[i05] - expected05) < 1e-12, 'at 0.5 s only 50 Hz component');

  const i09 = Math.round(0.9 * FS);
  const expected09 =
    Math.sin(2 * Math.PI * 50 * 0.9) + 0.8 * Math.sin(2 * Math.PI * 120 * 0.9);
  assert(Math.abs(signal[i09] - expected09) < 1e-12, 'at 0.9 s: 50 Hz + 0.8·120 Hz burst');

  const i0799 = Math.round(0.799 * FS);
  const i0800 = Math.round(0.8 * FS);
  const i1000 = Math.round(1.0 * FS);
  const i1001 = 1001;
  assert(
    Math.abs(signal[i0799] - Math.sin(2 * Math.PI * 50 * (i0799 / FS))) < 1e-12,
    'just before 0.8 s: no burst'
  );
  assert(
    Math.abs(
      signal[i0800] -
        (Math.sin(2 * Math.PI * 50 * 0.8) + 0.8 * Math.sin(2 * Math.PI * 120 * 0.8))
    ) < 1e-12,
    'burst starts at 0.8 s'
  );
  assert(
    Math.abs(
      signal[i1000] -
        (Math.sin(2 * Math.PI * 50 * 1.0) + 0.8 * Math.sin(2 * Math.PI * 120 * 1.0))
    ) < 1e-12,
    'burst included at 1.0 s'
  );
  assert(
    Math.abs(signal[i1001] - Math.sin(2 * Math.PI * 50 * (i1001 / FS))) < 1e-12,
    'just after 1.0 s: burst off'
  );
}

console.log('\n=== 2. Continuous 50 Hz sinusoid ===');
{
  const signal = sine(50, FS, DURATION);
  const stft = calculateSTFT(signal, 256, FS);
  const cwt = calculateCWT(signal, FS, 20, 250);

  assert(allFinite(stft.z), 'STFT coefficients finite');
  assert(allFinite(cwt.z), 'CWT coefficients finite');
  assert(stft.y.length === 256 / 2 + 1, 'STFT one-sided bins include Nyquist (129)');
  assert(Math.abs(stft.y[stft.y.length - 1] - FS / 2) < 1e-9, 'STFT last bin is Nyquist 500 Hz');
  assert(Math.abs(stft.y[1] - FS / 256) < 1e-12, 'STFT Δf = fs/N');

  const tMid = nearestIdx(stft.x, 1.0);
  const stftPeak = peakFreqAtTime(stft.z, stft.y, tMid, 20, 200);
  assert(Math.abs(stftPeak.f - 50) <= FS / 256 + 1e-6, `STFT peak near 50 Hz (got ${stftPeak.f})`);
  assert(Math.abs(stftPeak.mag - 1) < 0.15, `STFT amplitude ≈ 1 for unit sine (got ${stftPeak.mag.toFixed(3)})`);

  const tCwt = nearestIdx(cwt.x, 1.0);
  const cwtPeak = peakFreqAtTime(cwt.z, cwt.y, tCwt);
  assert(Math.abs(cwtPeak.f - 50) < 8, `CWT peak near 50 Hz (got ${cwtPeak.f.toFixed(2)})`);
}

console.log('\n=== 3. 120 Hz burst 0.8–1.0 s ===');
{
  const signal = burst(120, FS, DURATION, 0.8, 1.0, 1);
  const stft = calculateSTFT(signal, 128, FS); // short window for time localization
  const cwt = calculateCWT(signal, FS, 20, 250);

  assert(allFinite(stft.z), 'STFT burst coefficients finite');
  assert(allFinite(cwt.z), 'CWT burst coefficients finite');

  // STFT: energy along ~120 Hz should peak inside the burst window (with window-length tolerance).
  const f120 = nearestIdx(stft.y, 120);
  let maxMag = -Infinity;
  let tMax = null;
  for (let ti = 0; ti < stft.x.length; ti++) {
    if (stft.z[f120][ti] > maxMag) {
      maxMag = stft.z[f120][ti];
      tMax = stft.x[ti];
    }
  }
  const halfWin = (128 / 2) / FS; // 0.064 s
  assert(
    tMax >= 0.8 - halfWin && tMax <= 1.0 + halfWin,
    `STFT ~120 Hz energy timed near burst (t=${tMax.toFixed(3)} s)`
  );

  const fCwt120 = nearestIdx(cwt.y, 120);
  let cwtMax = -Infinity;
  let cwtT = null;
  for (let ti = 0; ti < cwt.x.length; ti++) {
    if (cwt.z[fCwt120][ti] > cwtMax) {
      cwtMax = cwt.z[fCwt120][ti];
      cwtT = cwt.x[ti];
    }
  }
  assert(cwtT >= 0.75 && cwtT <= 1.05, `CWT ~120 Hz energy timed near burst (t=${cwtT.toFixed(3)} s)`);

  const midBurst = nearestIdx(cwt.x, 0.9);
  const quiet = nearestIdx(cwt.x, 0.4);
  assert(
    cwt.z[fCwt120][midBurst] > 10 * cwt.z[fCwt120][quiet],
    'CWT 120 Hz coefficient much larger in burst than in quiet region'
  );
}

console.log('\n=== 4. Combined default signal + STFT windows 128/256/512 ===');
{
  const signal = generateExperimentSignal(FS, DURATION);
  const cwt = calculateCWT(signal, FS, 20, 250);

  // Same input used for CWT and every STFT window.
  assert(cwt.x.length === signal.length, 'CWT time axis length equals signal length');
  assert(Math.abs(cwt.x[1] - 1 / FS) < 1e-15, 'CWT time step = 1/fs');
  assert(Math.abs(cwt.y[0] - 20) < 1e-9 && Math.abs(cwt.y[cwt.y.length - 1] - 250) < 1e-9, 'CWT freq range 20–250 Hz');

  const tSteady = nearestIdx(cwt.x, 0.4);
  const cwt50 = peakFreqAtTime(cwt.z, cwt.y, tSteady);
  assert(Math.abs(cwt50.f - 50) < 8, `CWT steady peak near 50 Hz (got ${cwt50.f.toFixed(2)})`);

  const f120 = nearestIdx(cwt.y, 120);
  const t09 = nearestIdx(cwt.x, 0.9);
  const t04 = nearestIdx(cwt.x, 0.4);
  assert(
    cwt.z[f120][t09] > 10 * cwt.z[f120][t04],
    'CWT shows 120 Hz burst energy around 0.9 s on combined signal'
  );

  assert(
    JSON.stringify(STFT_ALLOWED_WINDOW_LENGTHS) === JSON.stringify([128, 256, 512]),
    'allowed STFT windows remain 128, 256, 512'
  );

  for (const win of STFT_ALLOWED_WINDOW_LENGTHS) {
    const stft = calculateSTFT(signal, win, FS);
    const hop = Math.floor(win / 2);
    const expectedFrames = Math.floor((signal.length - win) / hop) + 1;
    assert(stft.x.length === expectedFrames, `STFT win ${win}: frame count ${stft.x.length}`);
    assert(stft.y.length === win / 2 + 1, `STFT win ${win}: one-sided bins ${stft.y.length}`);
    assert(stft.z.length === stft.y.length && stft.z[0].length === stft.x.length, `STFT win ${win}: z dims match axes`);
    assert(allFinite(stft.z), `STFT win ${win}: finite values`);
    assert(Math.abs(stft.x[0] - win / 2 / FS) < 1e-12, `STFT win ${win}: first time = window center`);

    // Steady-state peak near 50 Hz (tolerance = one bin).
    const tA = nearestIdx(stft.x, 0.3);
    const peak = peakFreqAtTime(stft.z, stft.y, tA, 20, 90);
    const df = FS / win;
    assert(Math.abs(peak.f - 50) <= df + 1e-6, `STFT win ${win}: peak ~50 Hz (got ${peak.f}, df=${df})`);
    assert(Math.abs(peak.mag - 1) < 0.2, `STFT win ${win}: amp ≈ 1 (got ${peak.mag.toFixed(3)})`);

    // During burst, secondary energy near 120 Hz.
    const tB0 = nearestIdx(stft.x, 0.85);
    const tB1 = nearestIdx(stft.x, 0.95);
    let best120 = -Infinity;
    let fBest = null;
    for (let ti = Math.min(tB0, tB1); ti <= Math.max(tB0, tB1); ti++) {
      const p = peakFreqAtTime(stft.z, stft.y, ti, 90, 160);
      if (p.mag > best120) {
        best120 = p.mag;
        fBest = p.f;
      }
    }
    assert(Math.abs(fBest - 120) <= 2 * df + 1e-6, `STFT win ${win}: burst peak ~120 Hz (got ${fBest})`);
  }

  // Hann window sanity
  const w = hannWindow(256);
  assert(Math.abs(w[0]) < 1e-15 && Math.abs(w[255]) < 1e-15, 'Hann endpoints ≈ 0');
  assert(Math.abs(w[127] - 1) < 1e-12 || Math.abs(w[128] - 1) < 0.01, 'Hann peak ≈ 1 near center');
}

console.log('\n=== 5. Shared-input identity (CWT and STFT see same array) ===');
{
  const signal = generateExperimentSignal(FS, DURATION);
  // Mutate a copy marker: both transforms must read identical values at key indices.
  const checksum = signal.reduce((a, v) => a + v, 0);
  const stft = calculateSTFT(signal, 256, FS);
  const cwt = calculateCWT(signal, FS, 20, 250);
  const checksumAfter = signal.reduce((a, v) => a + v, 0);
  assert(checksum === checksumAfter, 'transforms do not mutate the shared signal');
  assert(stft.fs === FS && cwt.fs === FS, 'both transforms record fs=1000');
  assert(stft.quantityLabel.includes('Hann') && cwt.quantityLabel.includes('CWT'), 'quantity labels present');
}

console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
