/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useRef, useState } from "react";
import { generateExperimentSignal } from "../signal/signalGenerator";
import { calculateCWT } from "../transforms/cwt";
import { calculateSTFT } from "../transforms/stft";

export const SimulationContext = createContext();

// Single fixed experiment signal configuration (shared by STFT and CWT)
export const EXPERIMENT_SIGNAL = {
  fs: 1000,
  duration: 2,
  burstStart: 0.8,
  burstEnd: 1.0,
  label: "50 Hz continuous + 120 Hz burst",
};

export const SimulationProvider = ({ children }) => {
  // Step 1: Signal
  const [cleanSignal, setCleanSignal] = useState([]);
  const [generateECG, setGenerateECG] = useState(false); // Keeps existing naming convention for ease
  const [loadingState, setLoadingState] = useState("idle");
  // fs / duration of the currently loaded signal (from EXPERIMENT_SIGNAL at load time)
  const [loadedSignalConfig, setLoadedSignalConfig] = useState(null);

  // Step 2: Transforms
  const [cwtResult, setCwtResult] = useState(null);
  const [cwtGenerated, setCwtGenerated] = useState(false);

  const [stftWindowLength, setStftWindowLength] = useState(256);
  const [stftResult, setStftResult] = useState(null);
  const [stftGenerated, setStftGenerated] = useState(false);

  // Comparison
  const [showComparison, setShowComparison] = useState(false);

  // Instructions & UI
  const [showInstruction, setShowInstruction] = useState(false);
  const buttonRef = useRef(null);
  const instructionPanelRef = useRef(null);

  // Clear results downstream
  const clearResults = useCallback(() => {
    setCwtResult(null);
    setCwtGenerated(false);
    setStftResult(null);
    setStftGenerated(false);
    setShowComparison(false);
  }, []);

  const loadCleanSignal = useCallback(() => {
    setLoadingState("primary");
    const { fs, duration } = EXPERIMENT_SIGNAL;
    const signal = generateExperimentSignal(fs, duration);

    setCleanSignal(signal);
    setLoadedSignalConfig({ fs, duration });
    setGenerateECG(true);
    clearResults();
    setLoadingState("idle");
  }, [clearResults]);

  const handleGenerateCWT = useCallback(() => {
    if (!cleanSignal?.length) return;
    // Always use the sampling rate of the loaded common experiment signal.
    const fs = loadedSignalConfig?.fs ?? EXPERIMENT_SIGNAL.fs;
    try {
      const result = calculateCWT(cleanSignal, fs, 20, 250);
      setCwtResult(result);
      setCwtGenerated(true);
    } catch (err) {
      console.error("CWT generation failed:", err);
    }
  }, [cleanSignal, loadedSignalConfig]);

  const handleGenerateSTFT = useCallback(() => {
    if (!cleanSignal?.length) return;
    // Same signal array and fs as CWT (shared cleanSignal / loadedSignalConfig).
    const fs = loadedSignalConfig?.fs ?? EXPERIMENT_SIGNAL.fs;
    try {
      const result = calculateSTFT(cleanSignal, stftWindowLength, fs);
      setStftResult(result);
      setStftGenerated(true);
    } catch (err) {
      console.error("STFT generation failed:", err);
    }
  }, [cleanSignal, loadedSignalConfig, stftWindowLength]);

  const handleCompare = useCallback(() => {
    setShowComparison(true);
  }, []);

  // Restore the same clean initial state a student sees on first open
  const resetExperiment = useCallback(() => {
    setCleanSignal([]);
    setLoadedSignalConfig(null);
    setGenerateECG(false);
    setLoadingState("idle");
    setStftWindowLength(256);
    clearResults();
    setShowInstruction(false);
  }, [clearResults]);

  return (
    <SimulationContext.Provider
      value={{
        loadCleanSignal,
        cleanSignal,
        loadedSignalConfig,
        generateECG, setGenerateECG,

        cwtResult, cwtGenerated, handleGenerateCWT,
        stftWindowLength, setStftWindowLength,
        stftResult, stftGenerated, handleGenerateSTFT,

        showComparison, handleCompare,
        clearResults,
        resetExperiment,

        loadingState,
        showInstruction, setShowInstruction,
        buttonRef, instructionPanelRef,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};
