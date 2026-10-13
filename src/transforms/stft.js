import { fft } from './fft.js';

/** Experiment-supported STFT window lengths (must match the UI options). */
export const STFT_ALLOWED_WINDOW_LENGTHS = [128, 256, 512];

/**
 * Symmetric Hann window (periodic endpoints equal zero at i=0 and i=N-1).
 * w[i] = 0.5 * (1 - cos(2 π i / (N - 1)))
 */
export function hannWindow(windowLength) {
  const window = new Array(windowLength);
  for (let i = 0; i < windowLength; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowLength - 1)));
  }
  return window;
}

/**
 * Short-Time Fourier Transform spectrogram.
 *
 * Returns a one-sided amplitude spectrum for each frame:
 *   |X[k]|_amp = c[k] * |FFT(x · w)[k]| / sum(w)
 * where c[0] = c[N/2] = 1 (DC / Nyquist) and c[k] = 2 for 0 < k < N/2.
 *
 * Axes: x = frame-center times (s), y = frequency bins (Hz).
 * Plotted quantity z = amplitude |X(t,f)| (Hann coherent-gain normalized).
 */
export const calculateSTFT = (signal, windowLength, fs = 1000) => {
  if (!Array.isArray(signal) || signal.length === 0) {
    throw new Error("STFT requires a non-empty signal array.");
  }

  if (!Number.isInteger(windowLength)) {
    throw new Error("STFT window length must be an integer.");
  }

  if (windowLength <= 0) {
    throw new Error("STFT window length must be positive.");
  }

  if (!STFT_ALLOWED_WINDOW_LENGTHS.includes(windowLength)) {
    throw new Error(
      `STFT window length must be one of: ${STFT_ALLOWED_WINDOW_LENGTHS.join(", ")}.`
    );
  }

  if (windowLength > signal.length) {
    throw new Error("STFT window length cannot exceed the signal length.");
  }

  if (!Number.isFinite(fs) || fs <= 0) {
    throw new Error("STFT sampling rate must be a positive finite number.");
  }

  // Power-of-two lengths only (required by the recursive radix-2 FFT).
  if ((windowLength & (windowLength - 1)) !== 0) {
    throw new Error("STFT window length must be a power of two.");
  }

  const hopSize = Math.floor(windowLength / 2); // 50% overlap
  const numFrames = Math.floor((signal.length - windowLength) / hopSize) + 1;

  if (numFrames < 1) {
    throw new Error("STFT could not form any frames with the given signal and window length.");
  }

  const window = hannWindow(windowLength);
  let windowGain = 0;
  for (let i = 0; i < windowLength; i++) {
    windowGain += window[i];
  }
  if (!(windowGain > 0)) {
    throw new Error("STFT window gain must be positive.");
  }

  // One-sided bins: k = 0 .. N/2 inclusive (includes Nyquist for even N).
  const numBins = windowLength / 2 + 1;
  const freqs = new Array(numBins);
  for (let k = 0; k < numBins; k++) {
    freqs[k] = (k * fs) / windowLength;
  }

  const stftMatrix = [];
  const times = [];
  const nyquistIndex = windowLength / 2;

  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * hopSize;
    const x_real = new Array(windowLength);
    const x_imag = new Array(windowLength).fill(0);

    for (let i = 0; i < windowLength; i++) {
      x_real[i] = signal[start + i] * window[i];
    }

    fft(x_real, x_imag);

    const magnitude = new Array(numBins);
    for (let k = 0; k < numBins; k++) {
      const raw = Math.sqrt(x_real[k] * x_real[k] + x_imag[k] * x_imag[k]);
      // Coherent-gain normalization; one-sided doubling for interior bins.
      const onesided = (k === 0 || k === nyquistIndex) ? 1 : 2;
      magnitude[k] = (onesided * raw) / windowGain;
    }

    stftMatrix.push(magnitude);
    // Frame timestamp at the center of the analysis window.
    times.push((start + windowLength / 2) / fs);
  }

  // Transpose for Plotly heatmap: rows = frequency, cols = time.
  const z = [];
  for (let k = 0; k < numBins; k++) {
    const row = new Array(numFrames);
    for (let j = 0; j < numFrames; j++) {
      row[j] = stftMatrix[j][k];
    }
    z.push(row);
  }

  return {
    z,
    x: times,
    y: freqs,
    hopSize,
    windowLength,
    fs,
    quantity: "amplitude",
    quantityLabel: "|X(t,f)| (one-sided, Hann-normalized)",
  };
};
