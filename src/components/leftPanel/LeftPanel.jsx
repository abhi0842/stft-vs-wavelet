import { useContext, useState } from "react";
import { SimulationContext, EXPERIMENT_SIGNAL } from "../../context/SimulationContext";
import { getReadGraphTips } from "../../utils/readGraphTips";
import styles from "./leftPanel.module.css";
import Plot from "react-plotly.js";

const TimeDomainPlot = ({ signal, title, fs = 1000, burstStart, burstEnd }) => {
  const times = signal.map((_, i) => i / fs);
  const hasBurst = Number.isFinite(burstStart) && Number.isFinite(burstEnd);

  // One waveform s[n]: color changes by time region (not two overlapping signals)
  const beforeX = [];
  const beforeY = [];
  const burstX = [];
  const burstY = [];
  const afterX = [];
  const afterY = [];

  let yMin = Infinity;
  let yMax = -Infinity;
  for (let i = 0; i < signal.length; i++) {
    const t = times[i];
    const y = signal[i];
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
    if (!hasBurst || t < burstStart) {
      beforeX.push(t);
      beforeY.push(y);
    } else if (t <= burstEnd) {
      burstX.push(t);
      burstY.push(y);
    } else {
      afterX.push(t);
      afterY.push(y);
    }
  }

  const yPad = Math.max(0.15, (yMax - yMin) * 0.08);
  const yRange = [yMin - yPad, yMax + yPad];

  const data = [
    {
      x: beforeX,
      y: beforeY,
      type: "scatter",
      mode: "lines",
      name: "50 Hz only",
      line: { color: "#1f77b4", width: 1.6 },
      hovertemplate: "t=%{x:.3f} s<br>s[n]=%{y:.3f}<extra>50 Hz only</extra>",
    },
  ];

  if (hasBurst && burstX.length) {
    data.push({
      x: burstX,
      y: burstY,
      type: "scatter",
      mode: "lines",
      name: `50 Hz + 120 Hz (${burstStart}–${burstEnd} s)`,
      line: { color: "#e67e22", width: 2 },
      hovertemplate: "t=%{x:.3f} s<br>s[n]=%{y:.3f}<extra>Burst region</extra>",
    });
  }

  if (afterX.length) {
    data.push({
      x: afterX,
      y: afterY,
      type: "scatter",
      mode: "lines",
      name: "50 Hz only",
      line: { color: "#1f77b4", width: 1.6 },
      showlegend: false,
      hovertemplate: "t=%{x:.3f} s<br>s[n]=%{y:.3f}<extra>50 Hz only</extra>",
    });
  }

  const shapes = [];
  const annotations = [];
  if (hasBurst) {
    shapes.push(
      {
        type: "rect",
        xref: "x",
        yref: "paper",
        x0: burstStart,
        x1: burstEnd,
        y0: 0,
        y1: 1,
        fillcolor: "rgba(230, 126, 34, 0.15)",
        line: { width: 0 },
        layer: "below",
      },
      {
        type: "line",
        xref: "x",
        yref: "paper",
        x0: burstStart,
        x1: burstStart,
        y0: 0,
        y1: 1,
        line: { color: "#c0392b", width: 1.5, dash: "dot" },
      },
      {
        type: "line",
        xref: "x",
        yref: "paper",
        x0: burstEnd,
        x1: burstEnd,
        y0: 0,
        y1: 1,
        line: { color: "#c0392b", width: 1.5, dash: "dot" },
      }
    );
    annotations.push(
      {
        x: (burstStart + burstEnd) / 2,
        y: yRange[1] - yPad * 0.35,
        xref: "x",
        yref: "y",
        text: "<b>Burst time</b>",
        showarrow: false,
        font: { size: 12, color: "#c0392b", family: "Arial, Helvetica, sans-serif" },
        bgcolor: "rgba(255,255,255,0.85)",
        borderpad: 3,
      },
      {
        x: burstStart,
        y: yRange[0] + yPad * 0.2,
        xref: "x",
        yref: "y",
        text: `${burstStart} s`,
        showarrow: false,
        font: { size: 10, color: "#c0392b" },
        xanchor: "left",
      },
      {
        x: burstEnd,
        y: yRange[0] + yPad * 0.2,
        xref: "x",
        yref: "y",
        text: `${burstEnd} s`,
        showarrow: false,
        font: { size: 10, color: "#c0392b" },
        xanchor: "right",
      }
    );
  }

  return (
    <div style={{ background: "white", padding: "1rem", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: "1rem" }}>
      <Plot
        data={data}
        layout={{
          title: {
            text: `<b>${title}</b>`,
            font: { size: 14, color: "#222", family: "Arial, Helvetica, sans-serif" },
            x: 0.5,
            xanchor: "center",
          },
          font: { family: "Arial, Helvetica, sans-serif", color: "#222" },
          dragmode: "zoom",
          xaxis: {
            title: {
              text: "<b>Time (s)</b>",
              font: { size: 12, color: "#222", family: "Arial, Helvetica, sans-serif" },
              standoff: 10,
            },
            tickfont: { size: 11, color: "#444" },
            showgrid: true,
            gridcolor: "rgba(0,0,0,0.05)",
            zeroline: false,
            showline: true,
            linecolor: "rgba(0,0,0,0.15)",
            automargin: true,
            range: [0, times[times.length - 1] || 2],
          },
          yaxis: {
            title: {
              text: "<b>Amplitude</b>",
              font: { size: 12, color: "#222", family: "Arial, Helvetica, sans-serif" },
              standoff: 10,
            },
            tickfont: { size: 11, color: "#444" },
            showgrid: true,
            gridcolor: "rgba(0,0,0,0.05)",
            zeroline: true,
            zerolinecolor: "rgba(0,0,0,0.15)",
            showline: true,
            linecolor: "rgba(0,0,0,0.15)",
            automargin: true,
            range: yRange,
          },
          showlegend: true,
          legend: {
            orientation: "h",
            yanchor: "bottom",
            y: 1.02,
            xanchor: "center",
            x: 0.5,
            font: { size: 12, color: "#222", family: "Arial, Helvetica, sans-serif" },
            bgcolor: "rgba(255,255,255,0.9)",
          },
          plot_bgcolor: "#ffffff",
          paper_bgcolor: "#ffffff",
          shapes,
          annotations,
          margin: { l: 70, r: 30, t: 85, b: 55 },
          height: 340,
          autosize: true,
        }}
        useResizeHandler={true}
        style={{ width: "100%", height: "100%" }}
        config={{
          displayModeBar: true,
          displaylogo: false,
          scrollZoom: true,
          modeBarButtonsToRemove: ["lasso2d", "select2d"],
        }}
      />
      {hasBurst && (
        <p style={{ fontSize: "0.85rem", color: "#555", margin: "0.4rem 0 0 0", lineHeight: 1.45 }}>
          <b>Key idea:</b> one signal <i>s[n]</i> — blue is 50 Hz; orange ({burstStart}–{burstEnd} s) adds a short 120 Hz burst.
          Zoom the shaded band to see the transient.
        </p>
      )}
    </div>
  );
};

const HeatmapPlot = ({ result, title, colorbarTitle, kind }) => {
  const [showTips, setShowTips] = useState(false);
  if (!result || !result.z || !result.x || !result.y) return null;

  // Prefer the transform's own quantity label so the color bar matches what was computed.
  const barTitle = result.quantityLabel || colorbarTitle;
  const tips = kind ? getReadGraphTips(kind, result) : null;

  return (
    <div style={{ background: "white", padding: "1rem", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "1rem", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem" }}>
        <div style={{ fontSize: "1rem", fontWeight: 600, color: "#333" }}>{title}</div>
        {tips && (
          <button
            type="button"
            aria-expanded={showTips}
            aria-label="Read Graph tips"
            onClick={() => setShowTips((v) => !v)}
            style={{
              flexShrink: 0,
              fontSize: "0.8rem",
              padding: "0.2rem 0.55rem",
              borderRadius: "4px",
              border: "1px solid #cfd8dc",
              background: showTips ? "#eceff1" : "#fff",
              color: "#455a64",
              cursor: "pointer",
              lineHeight: 1.3,
            }}
          >
            ⓘ Read Graph
          </button>
        )}
      </div>

      {showTips && tips && (
        <div
          role="dialog"
          aria-label={tips.title}
          style={{
            marginBottom: "0.65rem",
            padding: "0.7rem 0.85rem",
            background: "#f7f9fa",
            border: "1px solid #dde3ea",
            borderRadius: "6px",
            fontSize: "0.82rem",
            color: "#37474f",
            lineHeight: 1.45,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
            <strong style={{ color: "#2c3e50", fontSize: "0.85rem" }}>{tips.title}</strong>
            <button
              type="button"
              onClick={() => setShowTips(false)}
              aria-label="Close tips"
              style={{
                border: "none",
                background: "transparent",
                color: "#78909c",
                cursor: "pointer",
                fontSize: "0.9rem",
                padding: "0 0.2rem",
              }}
            >
              ✕
            </button>
          </div>
          <ol style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {tips.tips.map((tip) => (
              <li key={tip.label} style={{ marginBottom: "0.4rem" }}>
                <strong>{tip.label}:</strong> {tip.text}
              </li>
            ))}
          </ol>
          {tips.learnMore && (
            <p style={{ margin: "0.45rem 0 0 0", fontSize: "0.78rem" }}>
              <a href={tips.learnMore.url} target="_blank" rel="noopener noreferrer">
                {tips.learnMore.label}
              </a>
            </p>
          )}
        </div>
      )}

      <Plot
        data={[
          {
            z: result.z,
            x: result.x,
            y: result.y,
            type: "heatmap",
            colorscale: "Jet",
            colorbar: { title: { text: barTitle, side: "top" } }
          },
        ]}
        layout={{
          // Title shown in the header row above (with Read Graph); keep Plotly title empty to avoid duplication.
          title: { text: "", font: { size: 16, color: "#333" } },
          xaxis: { title: { text: "Time (s)", font: { size: 14 } }, automargin: true },
          yaxis: { title: { text: "Frequency (Hz)", font: { size: 14 } }, automargin: true },
          margin: { l: 70, r: 30, t: 20, b: 60 },
          height: 300,
          autosize: true
        }}
        useResizeHandler={true}
        style={{ width: "100%", height: "100%" }}
        config={{ displayModeBar: false }}
      />
    </div>
  );
};

export const LeftPanel = () => {
  const {
    cleanSignal, generateECG, loadedSignalConfig,
    cwtResult, cwtGenerated,
    stftResult, stftGenerated,
    showComparison
  } = useContext(SimulationContext);

  return (
    <div className={styles.leftPanelContainer}>
      <div className={styles.left} style={{ padding: "1rem" }}>

        {!generateECG && (
          <div style={{ textAlign: "center", color: "#7f8c8d", marginTop: "2rem" }}>
            <h2>Welcome to Time-Frequency Analysis</h2>
            <p>Load a signal to begin the experiment.</p>
          </div>
        )}

        {/* Regular View */}
        {generateECG && (
          <>
            {loadedSignalConfig && (
              <div style={{ fontSize: "0.95rem", color: "#555", marginBottom: "0.5rem" }}>
                Sampling rate: {loadedSignalConfig.fs} Hz | Duration: {loadedSignalConfig.duration} s
              </div>
            )}
            <TimeDomainPlot
              signal={cleanSignal}
              title="Input Signal s[n]"
              fs={loadedSignalConfig?.fs ?? EXPERIMENT_SIGNAL.fs}
              burstStart={EXPERIMENT_SIGNAL.burstStart}
              burstEnd={EXPERIMENT_SIGNAL.burstEnd}
            />

            {cwtGenerated && (
              <HeatmapPlot
                result={cwtResult}
                title="CWT Scalogram"
                colorbarTitle="|W(t,f)| (CWT magnitude)"
                kind="cwt"
              />
            )}

            {stftGenerated && (
              <HeatmapPlot
                result={stftResult}
                title="STFT Spectrogram"
                colorbarTitle="|X(t,f)| (one-sided, Hann-normalized)"
                kind="stft"
              />
            )}
          </>
        )}

        {/* Comparison View */}
        {showComparison && cwtGenerated && stftGenerated && (
          <div style={{ marginBottom: "2rem", marginTop: "2rem" }}>
            <h2 style={{ color: "#2c3e50", borderBottom: "2px solid #eee", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
              Wavelet vs STFT Comparison
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <HeatmapPlot
                result={cwtResult}
                title="CWT Scalogram"
                colorbarTitle="|W(t,f)| (CWT magnitude)"
                kind="cwt"
              />
              <HeatmapPlot
                result={stftResult}
                title="STFT Spectrogram"
                colorbarTitle="|X(t,f)| (one-sided, Hann-normalized)"
                kind="stft"
              />
            </div>
            <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #ddd", marginTop: "1rem" }}>
              <h4>Student Observation Table</h4>
              <p style={{ fontSize: "0.95rem", color: "#555", lineHeight: "1.5", marginBottom: "0.75rem" }}>
                Use the loaded input signal (50 Hz continuous + 120 Hz burst) and try Short, Medium, and Long STFT windows.
                Ask yourself: what improves and what becomes less clear as the STFT window is made longer?
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left", color: "#333" }}>
                <thead>
                  <tr style={{ background: "#eee" }}>
                    <th style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#2c3e50" }}>Observation</th>
                    <th style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#2c3e50" }}>STFT</th>
                    <th style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#2c3e50" }}>CWT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Short burst visibility</td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>120 Hz burst (≈0.8–1.0 s) is clearer with a short window; a long window smears it in time</td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Usually shows the short 120 Hz burst clearly without changing a window length</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Frequency detail</td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Longer windows make 50 Hz and 120 Hz look sharper / better separated</td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Shows both frequency bands clearly across the fixed analysis range</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Time localization</td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Better when the window is short; worse when the window is long</td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Keeps the burst localized in time while still showing its frequency</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Effect of STFT window length</td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Longer window → clearer frequency detail, but the short burst becomes less clear in time</td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", color: "#333" }}>Not applicable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
