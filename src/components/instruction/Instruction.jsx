import React from "react";
import styles from "./instruction.module.css";

export const Instruction = () => {
  return (
    <div className={styles.box}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Time-Frequency Analysis — Wavelet & STFT</h1>

          <section style={{ margin: "1rem 0 1.25rem", padding: "1rem", background: "#eef7f4", borderLeft: "4px solid #16805a", borderRadius: "6px" }}>
            <h2 style={{ fontSize: "1.1rem", color: "#175b45", marginBottom: "0.5rem" }}>
              Instructions
            </h2>
            <ol style={{ margin: "0 0 0 1.25rem", lineHeight: 1.65 }}>
              <li>
                <b>Load the signal.</b> In Step 1, click <b>Load Signal</b>.
                You get a fixed input <i>s[n]</i>: a steady 50 Hz tone plus a short 120 Hz burst (0.8–1.0 s).
                The same signal is used for both Wavelet and STFT.
              </li>
              <li>
                <b>Generate the Wavelet scalogram.</b> In Step 2, keep <b>Complex Morlet</b> (20–250 Hz) and click <b>Generate Wavelet</b>.
                Use this CWT as your reference — it adapts resolution with scale and shows both the tone and the burst clearly.
              </li>
              <li>
                <b>Generate STFT spectrograms.</b> Keep the <b>Hann</b> window. Select <b>Short → Medium → Long</b> and click <b>Generate STFT</b> after each.
                Watch how time localization and frequency detail trade off as the window length changes.
              </li>
              <li>
                <b>Find the best-fit STFT window.</b> Compare each spectrogram to the CWT.
                Ask: which window balances burst timing and frequency separation closest to the wavelet?
                Typically <b>Medium (256)</b> is the best fit — Short favors time, Long favors frequency, Medium compromises both.
              </li>
              <li>
                <b>Compare side-by-side.</b> Click <b>Compare Wavelet & STFT</b> and use the observation table to record
                short-burst visibility, frequency detail, and time localization for STFT vs CWT.
              </li>
              <li>
                <b>Reset if needed.</b> Click <b>Reset Experiment</b> to clear results and start again from Step 1.
              </li>
            </ol>
          </section>

        </div>
      </div>
    </div>
  );
};
