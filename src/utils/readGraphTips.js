/**
 * Short “Read Graph” tips from existing STFT/CWT result metadata.
 * Cautious when data is missing; does not invent patterns from image appearance.
 */

function zRange(z) {
  if (!Array.isArray(z) || !z.length) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const row of z) {
    for (const v of row) {
      if (!Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

function hasSustainedBand(result) {
  const z = result?.z;
  const times = result?.x;
  if (!z?.length || !times?.length) return null;
  const nT = times.length;
  if (nT < 4) return null;
  let bestCov = 0;
  let bestF = null;
  let globalMax = 0;
  for (const row of z) {
    for (const v of row) if (v > globalMax) globalMax = v;
  }
  if (!(globalMax > 0)) return null;
  const thr = 0.45 * globalMax;
  for (let fi = 0; fi < z.length; fi++) {
    let above = 0;
    for (let ti = 0; ti < nT; ti++) if (z[fi][ti] >= thr) above += 1;
    const cov = above / nT;
    if (cov > bestCov) {
      bestCov = cov;
      bestF = result.y[fi];
    }
  }
  if (bestCov >= 0.55 && Number.isFinite(bestF)) {
    return { frequencyHz: bestF, coverage: bestCov };
  }
  return null;
}

function hasLocalizedPatch(result) {
  const z = result?.z;
  const times = result?.x;
  if (!z?.length || !times?.length) return null;
  let peak = -Infinity;
  let peakFi = 0;
  let peakTi = 0;
  for (let fi = 0; fi < z.length; fi++) {
    for (let ti = 0; ti < z[fi].length; ti++) {
      if (z[fi][ti] > peak) {
        peak = z[fi][ti];
        peakFi = fi;
        peakTi = ti;
      }
    }
  }
  if (!(peak > 0)) return null;
  const row = z[peakFi];
  const thr = 0.45 * peak;
  let above = 0;
  for (const v of row) if (v >= thr) above += 1;
  const coverage = above / row.length;
  if (coverage <= 0.35) {
    return { frequencyHz: result.y[peakFi], tPeak: times[peakTi], coverage };
  }
  return null;
}

/**
 * @param {'stft'|'cwt'} kind
 * @param {object|null} result
 */
export function getReadGraphTips(kind, result) {
  const quantity =
    result?.quantityLabel ||
    (kind === "stft"
      ? "the colour-bar quantity (STFT magnitude if labelled on the plot)"
      : "the colour-bar quantity (CWT magnitude if labelled on the plot)");
  const range = zRange(result?.z);
  const rangeText = range
    ? `Values on this plot span about ${range.min.toFixed(3)} to ${range.max.toFixed(3)}.`
    : "Use the colour bar on this plot for the exact numeric range.";

  const band = hasSustainedBand(result);
  const patch = hasLocalizedPatch(result);

  let patternTip;
  if (band && patch && Math.abs(band.frequencyHz - patch.frequencyHz) > 5) {
    patternTip = `This graph shows a sustained band near ${band.frequencyHz.toFixed(1)} Hz and a more localized region near ${patch.frequencyHz.toFixed(1)} Hz around ${patch.tPeak.toFixed(2)} s.`;
  } else if (band) {
    patternTip = `A horizontal band near ${band.frequencyHz.toFixed(1)} Hz suggests a frequency that lasts through much of the record.`;
  } else if (patch) {
    patternTip = `A localized bright region near ${patch.frequencyHz.toFixed(1)} Hz around ${patch.tPeak.toFixed(2)} s suggests a brief event at that frequency.`;
  } else {
    patternTip =
      "Look for horizontal bands (longer-lasting frequencies) or short bright patches (brief events). No strong pattern met the automatic check on this data.";
  }

  if (kind === "stft") {
    const win = result?.windowLength;
    const fs = result?.fs;
    const winTip =
      Number.isFinite(win) && Number.isFinite(fs)
        ? `This spectrogram used a ${win}-sample window (≈ ${(win / fs).toFixed(3)} s). Shorter windows locate events better in time; longer windows resolve frequency more finely.`
        : "Shorter STFT windows generally improve time localization; longer windows generally improve frequency resolution.";

    return {
      title: "Reading this spectrogram",
      tips: [
        {
          label: "Read the axes",
          text: "X-axis is time in seconds; Y-axis is frequency in Hz (one-sided STFT bins), matching the axis titles on this plot.",
        },
        {
          label: "Read the colours",
          text: `Jet maps lower values toward cooler colours and higher values toward warmer ones. The colour bar shows ${quantity}. ${rangeText} Not dB.`,
        },
        { label: "Spot the pattern", text: patternTip },
        { label: "Compare window sizes", text: winTip },
      ],
      learnMore: {
        label: "Learn more (MathWorks spectrogram)",
        url: "https://www.mathworks.com/help/signal/ref/spectrogram.html",
      },
    };
  }

  // CWT — vertical axis is calibrated frequency (Hz) in this project, not raw scale indices.
  const fMin = result?.minFreq ?? result?.y?.[0];
  const fMax = result?.maxFreq ?? result?.y?.[result.y.length - 1];
  const scaleTip =
    Number.isFinite(fMin) && Number.isFinite(fMax)
      ? `Y-axis shows analysis frequency in Hz (${fMin.toFixed(0)}–${fMax.toFixed(0)} Hz), converted from Morlet scales in this app—not raw scale numbers. Different frequencies (scales) trade time vs frequency detail.`
      : "Y-axis follows the plot label (frequency in Hz here if labelled). Different wavelet scales capture different structures and resolutions; do not treat unlabeled scale indices as Hz.";

  return {
    title: "Reading this scalogram",
    tips: [
      {
        label: "Read the axes",
        text: "X-axis is time in seconds; Y-axis is frequency in Hz on this plot (log-spaced analysis frequencies from the CWT), as labelled.",
      },
      {
        label: "Read the colours",
        text: `Jet maps lower values toward cooler colours and higher values toward warmer ones. The colour bar shows ${quantity}. ${rangeText} Not comparable to STFT colours.`,
      },
      { label: "Spot the pattern", text: patternTip },
      { label: "Understand the scale", text: scaleTip },
    ],
    learnMore: {
      label: "Learn more (PyWavelets CWT)",
      url: "https://pywavelets.readthedocs.io/en/latest/ref/cwt.html",
    },
  };
}
