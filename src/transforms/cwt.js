/**
 * Continuous Wavelet Transform (complex Morlet, fixed mother wavelet).
 *
 * Mother wavelet (center frequency Fc = 1 in normalized time):
 *   ψ(u) = π^{-1/4} · exp(j 2 π u) · exp(-u² / 2)
 *
 * Scale–frequency map (seconds ↔ Hz):
 *   a = Fc / f = 1 / f
 *
 * Discrete approximation of
 *   W(a, b) = ∫ x(t) · a^{-1/2} · ψ*((t − b) / a) dt
 * with sampling interval dt = 1/fs (Riemann sum). Near the signal edges the
 * wavelet support is truncated, so edge coefficients are less reliable.
 *
 * Returns z[i][n] = |W| at frequency freqs[i] and time n/fs.
 */
export const calculateCWT = (signal, fs = 1000, minFreq = 20, maxFreq = 250) => {
  if (!Array.isArray(signal) || signal.length === 0) {
    throw new Error("CWT requires a non-empty signal array.");
  }
  if (!Number.isFinite(fs) || fs <= 0) {
    throw new Error("CWT sampling rate must be a positive finite number.");
  }
  if (!Number.isFinite(minFreq) || !Number.isFinite(maxFreq) || minFreq <= 0 || maxFreq <= 0) {
    throw new Error("CWT frequency limits must be positive numbers.");
  }
  if (minFreq >= maxFreq) {
    throw new Error("CWT minimum frequency must be less than maximum frequency.");
  }
  if (maxFreq >= fs / 2) {
    throw new Error("CWT maximum frequency must be below the Nyquist frequency.");
  }

  const N = signal.length;
  const dt = 1 / fs;
  const numScales = 40; // Fixed logarithmic frequency grid
  const Fc = 1; // Mother-wavelet center frequency (matches exp(j 2 π u))

  const freqs = [];
  const scales = []; // physical scales a in seconds

  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  for (let i = 0; i < numScales; i++) {
    const f = Math.pow(10, logMin + ((logMax - logMin) * i) / (numScales - 1));
    freqs.push(f);
    scales.push(Fc / f);
  }

  const times = new Array(N);
  for (let i = 0; i < N; i++) {
    times[i] = i * dt;
  }

  // ψ(u) = π^{-1/4} exp(j 2 π u) exp(-u²/2); correlation uses ψ* (sign of sin flips).
  const normBase = Math.pow(Math.PI, -0.25);
  const z = [];

  for (let i = 0; i < numScales; i++) {
    const a = scales[i];
    const invSqrtA = 1 / Math.sqrt(a);
    // Gaussian e^{-u²/2} is ~3e-4 at |u|=4; truncate beyond ±4a (seconds) → samples.
    const supportSamples = Math.ceil((4 * a) / dt);
    const row = new Array(N);

    for (let t = 0; t < N; t++) {
      let real = 0;
      let imag = 0;

      const start = Math.max(0, t - supportSamples);
      const end = Math.min(N - 1, t + supportSamples);

      for (let tau = start; tau <= end; tau++) {
        const u = ((tau - t) * dt) / a;
        const env = normBase * Math.exp(-0.5 * u * u);
        const arg = 2 * Math.PI * u;
        // a^{-1/2} ψ*(u) · dt   (ψ* → cos − j sin)
        const common = env * invSqrtA * dt;
        const w_real = common * Math.cos(arg);
        const w_imag = -common * Math.sin(arg);

        real += signal[tau] * w_real;
        imag += signal[tau] * w_imag;
      }

      row[t] = Math.sqrt(real * real + imag * imag);
    }
    z.push(row);
  }

  return {
    z,
    x: times,
    y: freqs,
    fs,
    minFreq,
    maxFreq,
    wavelet: "complex-morlet",
    Fc,
    quantity: "magnitude",
    quantityLabel: "|W(t,f)| (CWT magnitude)",
  };
};
