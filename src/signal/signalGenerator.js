// Fixed common experiment signal (fs = 1000 Hz, duration = 2 s):
// - continuous 50 Hz component for the full duration
// - short 120 Hz burst from 0.8 s to 1.0 s (amplitude 0.8)
export const generateExperimentSignal = (fs = 1000, duration = 2) => {
  const N = fs * duration;
  const signal = new Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / fs;
    const burst = (t >= 0.8 && t <= 1.0) ? 1 : 0;
    signal[i] = Math.sin(2 * Math.PI * 50 * t) + 0.8 * burst * Math.sin(2 * Math.PI * 120 * t);
  }
  return signal;
};
