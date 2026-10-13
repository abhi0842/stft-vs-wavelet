import { generateExperimentSignal } from '../src/signal/signalGenerator.js';
import { calculateSTFT } from '../src/transforms/stft.js';
import { calculateCWT } from '../src/transforms/cwt.js';
import { getReadGraphTips } from '../src/utils/readGraphTips.js';

const FS = 1000;
let passed = 0;
let failed = 0;
function assert(c, m) {
  if (c) {
    passed += 1;
    console.log('  PASS:', m);
  } else {
    failed += 1;
    console.error('  FAIL:', m);
  }
}

const signal = generateExperimentSignal(FS, 2);
const stft = calculateSTFT(signal, 256, FS);
const cwt = calculateCWT(signal, FS, 20, 250);
const sTips = getReadGraphTips('stft', stft);
const cTips = getReadGraphTips('cwt', cwt);

assert(sTips.tips.length === 4 && cTips.tips.length === 4, 'four tips each');
assert(/time/i.test(sTips.tips[0].text) && /Hz/i.test(sTips.tips[0].text), 'STFT axes tip');
assert(/256/.test(sTips.tips[3].text), 'STFT window tip uses current N');
assert(/Hann|magnitude|colour bar/i.test(sTips.tips[1].text), 'STFT colour tip');
assert(/Frequency in Hz/i.test(cTips.tips[0].text), 'CWT axes tip uses Hz label');
assert(/not raw scale|analysis frequency/i.test(cTips.tips[3].text), 'CWT scale tip cautious about Hz');
assert(/mathworks.com.*spectrogram/i.test(sTips.learnMore.url), 'STFT learn more');
assert(/pywavelets/i.test(cTips.learnMore.url), 'CWT learn more');

const empty = getReadGraphTips('stft', null);
const emptyText = empty.tips.map((t) => t.text).join(' ');
assert(empty.tips.length === 4 && /automatic check|colour bar|Shorter STFT/i.test(emptyText), 'missing data stays cautious');

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
