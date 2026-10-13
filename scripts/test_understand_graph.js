/**
 * Verify Understand This Graph explanations follow actual transform data.
 * Run: node scripts/test_understand_graph.js
 */
import { generateExperimentSignal } from '../src/signal/signalGenerator.js';
import { calculateSTFT } from '../src/transforms/stft.js';
import { calculateCWT } from '../src/transforms/cwt.js';
import { buildGraphUnderstanding } from '../src/utils/understandGraph.js';

const FS = 1000;
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

function sine(f, fs, dur) {
  const N = fs * dur;
  return Array.from({ length: N }, (_, i) => Math.sin((2 * Math.PI * f * i) / fs));
}

function burst(f, fs, dur, t0, t1) {
  const N = fs * dur;
  return Array.from({ length: N }, (_, i) => {
    const t = i / fs;
    return t >= t0 && t <= t1 ? Math.sin(2 * Math.PI * f * t) : 0;
  });
}

console.log('\n=== Combined default signal ===');
{
  const signal = generateExperimentSignal(FS, 2);
  const stft = calculateSTFT(signal, 256, FS);
  const cwt = calculateCWT(signal, FS, 20, 250);
  const sExpl = buildGraphUnderstanding('stft', stft, { fs: FS });
  const cExpl = buildGraphUnderstanding('cwt', cwt, { fs: FS });

  assert(sExpl.available && cExpl.available, 'both explanations available');
  assert(/Time in seconds/i.test(sExpl.axes.horizontal), 'STFT horizontal = time');
  assert(/Frequency in Hz/i.test(sExpl.axes.vertical), 'STFT vertical = Hz');
  assert(/Frequency in Hz/i.test(cExpl.axes.vertical) && /not raw scale/i.test(cExpl.axes.vertical), 'CWT vertical is calibrated Hz');
  assert(/Hann-normalized|amplitude/i.test(sExpl.colours.quantity), 'STFT colour quantity from implementation');
  assert(/CWT magnitude|\|W\|/i.test(cExpl.colours.quantity), 'CWT colour quantity from implementation');
  assert(/not dB/i.test(sExpl.colours.quantity + ' not dB') || sExpl.colours.notDb, 'not claiming dB');
  assert(
    sExpl.whatISee.some((t) => /50|49|51|46/.test(t)) && sExpl.whatISee.some((t) => /120|121|117|115|114/.test(t)),
    'STFT sees ~50 Hz and ~120 Hz from data'
  );
  assert(
    cExpl.whatISee.some((t) => /50|49/.test(t)) && cExpl.whatISee.some((t) => /11[4-9]|12[0-2]/.test(t)),
    'CWT sees ~50 Hz and ~120 Hz from data'
  );
  assert(sExpl.references.some((r) => /mathworks.com.*spectrogram/i.test(r.url)), 'STFT refs include MathWorks spectrogram');
  assert(cExpl.references.some((r) => /pywavelets/i.test(r.url)), 'CWT refs include PyWavelets');
  assert(cExpl.references.some((r) => /doi.org.*10\.1175/i.test(r.url)), 'CWT refs include Torrence & Compo');
  assert(/256/.test(sExpl.why.join(' ')), 'STFT explanation mentions window length 256');
}

console.log('\n=== Continuous 50 Hz only (no invented burst) ===');
{
  const signal = sine(50, FS, 2);
  const expl = buildGraphUnderstanding('stft', calculateSTFT(signal, 256, FS), { fs: FS });
  assert(expl.whatISee.some((t) => /50|49|51/.test(t)), 'sees ~50 Hz');
  assert(
    !expl.whatISee.some((t) => /localized bright patch.*12[0-2]/i.test(t)),
    'does not invent 120 Hz burst on pure tone'
  );
}

console.log('\n=== Transient 120 Hz only ===');
{
  const signal = burst(120, FS, 2, 0.8, 1.0);
  const expl = buildGraphUnderstanding('cwt', calculateCWT(signal, FS, 20, 250), { fs: FS });
  assert(expl.whatISee.some((t) => /11[4-9]|12[0-2]/.test(t)), 'sees ~120 Hz');
  assert(
    !expl.whatISee.some((t) => /sustained band near 50/i.test(t)),
    'does not invent continuous 50 Hz on burst-only'
  );
}

console.log('\n=== Missing data ===');
{
  const expl = buildGraphUnderstanding('stft', null, {});
  assert(!expl.available && expl.limitation, 'graceful limitation when data missing');
}

console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
