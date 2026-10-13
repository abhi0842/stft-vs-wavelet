import { useContext } from "react";
import { SimulationContext, EXPERIMENT_SIGNAL } from "../../context/SimulationContext";
import styles from "./rightPanel.module.css";

export const RightPanel = () => {
  const {
    loadCleanSignal, loadingState, generateECG,

    handleGenerateCWT, cwtGenerated,
    stftWindowLength, setStftWindowLength,
    handleGenerateSTFT, stftGenerated,

    handleCompare,
    resetExperiment
  } = useContext(SimulationContext);

  return (
    <div className={styles.rightPanelContainer}>
      <div className={styles.right}>

        {/* Step 1: Fixed input signal */}
        <div id="datasetSection" className={styles.box}>
          <h3>Step 1: Load Input Signal</h3>
          <label>Dataset</label>
          <select id="datasetSelector" value="experiment" onChange={() => {}}>
            <option value="experiment">{EXPERIMENT_SIGNAL.label}</option>
          </select>
          <div className={styles.buttonContainer}>
            <button
              type="button"
              id="loadDatasetBtn"
              disabled={loadingState === "primary"}
              onClick={loadCleanSignal}
            >
              {loadingState === "primary" ? "⏳ Loading..." : "Load Signal"}
            </button>
          </div>
        </div>

        {/* Step 2: Time-Frequency Analysis */}
        <div id="filterSection" className={styles.box} style={{ textAlign: "left" }}>
          <h3 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Step 2: Time-Frequency Analysis</h3>

          <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid #ddd", paddingBottom: "1.25rem" }}>
            <h4 style={{ margin: "0 0 0.75rem 0", color: "#2c3e50" }}>Wavelet Analysis</h4>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: "bold", display: "block", marginBottom: "0.4rem" }}>Wavelet</label>
              <select
                id="waveletSelector"
                value="morlet"
                onChange={() => {}}
                disabled={!generateECG}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              >
                <option value="morlet">Complex Morlet</option>
              </select>
            </div>
            <div style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "#555", lineHeight: "1.6" }}>
              <div><strong>Frequency Range:</strong> 20–250 Hz</div>
            </div>
            <div className={styles.buttonContainer} style={{ marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={handleGenerateCWT}
                disabled={!generateECG}
              >
                Generate Wavelet
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ margin: "0 0 0.75rem 0", color: "#2c3e50" }}>STFT Analysis</h4>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: "bold", display: "block", marginBottom: "0.4rem" }}>Window</label>
              <select
                id="stftWindowTypeSelector"
                value="hann"
                onChange={() => {}}
                disabled={!generateECG}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              >
                <option value="hann">Hann</option>
              </select>
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: "bold", display: "block", marginBottom: "0.4rem" }}>Window Length:</label>
              <select
                value={stftWindowLength}
                onChange={(e) => setStftWindowLength(Number(e.target.value))}
                disabled={!generateECG}
                style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              >
                <option value="128">Short — 128 samples</option>
                <option value="256">Medium — 256 samples</option>
                <option value="512">Long — 512 samples</option>
              </select>
              <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: "1.5", margin: "0 0 1rem 0" }}>
                Try Short → Medium → Long; click <strong>Generate STFT</strong> each time.
                Shorter windows locate the burst better in time; longer windows resolve frequency better — you cannot maximize both.
              </p>
            </div>
            <div className={styles.buttonContainer}>
              <button
                type="button"
                onClick={handleGenerateSTFT}
                disabled={!cwtGenerated} // Must generate wavelet first per requirements
              >
                Generate STFT
              </button>
            </div>
          </div>

          <div className={styles.buttonContainer}>
            <button
              type="button"
              onClick={handleCompare}
              disabled={!(cwtGenerated && stftGenerated)}
              style={{ width: "100%", backgroundColor: (cwtGenerated && stftGenerated) ? "#16a085" : "#ccc" }}
            >
              Compare Wavelet &amp; STFT
            </button>
          </div>

        </div>

        <div className={styles.box}>
          <div className={styles.buttonContainer}>
            <button
              type="button"
              id="resetExperimentBtn"
              onClick={resetExperiment}
              style={{ width: "100%" }}
            >
              Reset Experiment
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
