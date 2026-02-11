import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Assumptions, CandidateRow, Grain, LocalCandidateOverride, LocalOverrides, LocalSeatOverride, ProgressRow, Seat, SeatMetrics, ThresholdConfig } from "./types";
import {
  buildSabahSeats,
  loadAssumptions,
  loadCandidatesLong,
  loadDunSabah,
  loadParlimenSabah,
  loadProgress,
  loadSeatDetails,
  loadThresholds,
  loadWinnersMaster,
} from "./loader";
import { computeSeatMetrics, defaultThresholds, getLatestProgress } from "../lib/kpi";
import { validateWinnersRows } from "./baseline";
import { clearOverrides, loadOverrides, mergeOverrides, saveOverrides } from "../storage/localOverrides";

const defaultAssumptions: Assumptions = {
  turnout_scenario: { low: 0.55, base: 0.65, high: 0.75 },
  spoiled_rate: 0.02,
  buffer_rate: 0.02,
};

const defaultFilters = { parlimen: "", dun: "", turnoutScenario: "base" };
const THRESHOLDS_KEY = "formula-menang-thresholds-v1";
const DASHBOARD_MODE_KEY = "formula-menang-dashboard-mode-v1";

type DashboardMode = "beginner" | "advanced";

const DashboardContext = createContext<{
  isLoading: boolean;
  error: string | null;
  assumptions: Assumptions;
  thresholds: ThresholdConfig;
  setThresholds: React.Dispatch<React.SetStateAction<ThresholdConfig>>;
  resetThresholds: () => void;
  metrics: SeatMetrics[];
  filteredMetrics: SeatMetrics[];
  parlimenMetrics: SeatMetrics[];
  filters: typeof defaultFilters;
  setFilters: React.Dispatch<React.SetStateAction<typeof defaultFilters>>;
  grain: Grain;
  setGrain: React.Dispatch<React.SetStateAction<Grain>>;
  parlimenOptions: { code: string; name: string }[];
  dunOptions: { code: string; name: string }[];
  allDunOptions: { code: string; name: string }[];
  dataWarnings: string[];
  dataSummary: { sourceFile: string; totalDun: number; bnWins: number; nonBnWins: number };
  detailCoverage: number;
  candidateCoverage: number;
  candidatesByDun: Map<string, CandidateRow[]>;
  localOverrides: LocalOverrides;
  saveSeatOverride: (dunCode: string, payload: LocalSeatOverride) => void;
  saveCandidateOverride: (dunCode: string, payload: LocalCandidateOverride[]) => void;
  resetLocalOverrides: () => void;
  importLocalOverrides: (incoming: Partial<LocalOverrides>, mode: "merge" | "replace") => void;
  dashboardMode: DashboardMode;
  setDashboardMode: React.Dispatch<React.SetStateAction<DashboardMode>>;
}>({
  isLoading: true,
  error: null,
  assumptions: defaultAssumptions,
  thresholds: defaultThresholds,
  setThresholds: () => undefined,
  resetThresholds: () => undefined,
  metrics: [],
  filteredMetrics: [],
  parlimenMetrics: [],
  filters: defaultFilters,
  setFilters: () => undefined,
  grain: "parlimen",
  setGrain: () => undefined,
  parlimenOptions: [],
  dunOptions: [],
  allDunOptions: [],
  dataWarnings: [],
  dataSummary: { sourceFile: "prn_sabah_2025_winners.csv", totalDun: 0, bnWins: 0, nonBnWins: 0 },
  detailCoverage: 0,
  candidateCoverage: 0,
  candidatesByDun: new Map(),
  localOverrides: { version: 1, updatedAtISO: new Date().toISOString(), seatDetails: {}, candidates: {} },
  saveSeatOverride: () => undefined,
  saveCandidateOverride: () => undefined,
  resetLocalOverrides: () => undefined,
  importLocalOverrides: () => undefined,
  dashboardMode: "beginner",
  setDashboardMode: () => undefined,
});

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(defaultThresholds);
  const [metrics, setMetrics] = useState<SeatMetrics[]>([]);
  const [dataWarnings, setDataWarnings] = useState<string[]>([]);
  const [dataSummary, setDataSummary] = useState({ sourceFile: "prn_sabah_2025_winners.csv", totalDun: 0, bnWins: 0, nonBnWins: 0 });
  const [detailCoverage, setDetailCoverage] = useState(0);
  const [candidateCoverage, setCandidateCoverage] = useState(0);
  const [candidatesByDun, setCandidatesByDun] = useState<Map<string, CandidateRow[]>>(new Map());
  const [localOverrides, setLocalOverrides] = useState<LocalOverrides>(() => loadOverrides());
  const [latestProgress, setLatestProgress] = useState<Map<string, ProgressRow>>(new Map());
  const [filters, setFilters] = useState(defaultFilters);
  const [grain, setGrain] = useState<Grain>("parlimen");
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>(() => {
    if (typeof window === "undefined") return "beginner";
    const saved = window.localStorage.getItem(DASHBOARD_MODE_KEY);
    if (saved === "advanced" || saved === "beginner") return saved;
    return "beginner";
  });

  useEffect(() => {
    const saved = localStorage.getItem(THRESHOLDS_KEY);
    if (saved) {
      try {
        setThresholds(JSON.parse(saved) as ThresholdConfig);
      } catch {
        setThresholds(defaultThresholds);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(thresholds));
  }, [thresholds]);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_MODE_KEY, dashboardMode);
  }, [dashboardMode]);

  const recomputeMetrics = (
    baseSeats: Seat[],
    nextAssumptions: Assumptions,
    nextThresholds: ThresholdConfig,
    turnoutScenario: keyof Assumptions["turnout_scenario"],
    progressLookup: Map<string, ProgressRow>
  ) => {
    const dunMetrics = baseSeats
      .filter((seat) => seat.grain === "dun")
      .map((seat) => computeSeatMetrics(seat, progressLookup.get(seat.seat_id), nextAssumptions, turnoutScenario, nextThresholds));

    const groupedParlimen = new Map<string, SeatMetrics[]>();
    dunMetrics.forEach((metric) => {
      const current = groupedParlimen.get(metric.seat.parlimen_code) ?? [];
      current.push(metric);
      groupedParlimen.set(metric.seat.parlimen_code, current);
    });

    const parlimenMetrics = baseSeats
      .filter((seat) => seat.grain === "parlimen")
      .map((seat) => {
        const duns = groupedParlimen.get(seat.parlimen_code) ?? [];
        const mergedProgress = {
          week_start: duns[0]?.progress.week_start ?? "",
          seat_id: seat.seat_id,
          base_votes: duns.reduce((acc, item) => acc + item.progress.base_votes, 0),
          persuasion_votes: duns.reduce((acc, item) => acc + item.progress.persuasion_votes, 0),
          gotv_votes: duns.reduce((acc, item) => acc + item.progress.gotv_votes, 0),
          persuadables: duns.reduce((acc, item) => acc + item.progress.persuadables, 0),
          conversion_rate: 0,
        };
        const metric = computeSeatMetrics(seat, mergedProgress, nextAssumptions, turnoutScenario, nextThresholds);
        metric.flags = Array.from(new Set([...metric.flags, ...duns.flatMap((item) => item.flags)]));
        return metric;
      });

    setMetrics([...parlimenMetrics, ...dunMetrics]);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [parlimenRows, dunRows, progressRows, loadedAssumptions, winnersRows, loadedThresholds, seatDetails, candidateRows] = await Promise.all([
          loadParlimenSabah(),
          loadDunSabah(),
          loadProgress(),
          loadAssumptions(),
          loadWinnersMaster(),
          loadThresholds(),
          loadSeatDetails(),
          loadCandidatesLong(),
        ]);
        const built = buildSabahSeats(parlimenRows, dunRows, winnersRows, seatDetails, candidateRows, localOverrides);
        const validation = validateWinnersRows(winnersRows, "prn_sabah_2025_winners.csv");
        const nextLatestProgress = getLatestProgress(progressRows);
        const saved = localStorage.getItem(THRESHOLDS_KEY);
        const activeThresholds = saved ? (JSON.parse(saved) as ThresholdConfig) : loadedThresholds;

        const warnings = [...validation.warnings];
        if (built.duplicateDetails.length > 0) {
          warnings.push(`Kod DUN berganda dalam seat_details_enriched_v3.csv: ${built.duplicateDetails.join(", ")}.`);
        }

        setSeats(built.seats);
        setLatestProgress(nextLatestProgress);
        setAssumptions(loadedAssumptions);
        setThresholds(activeThresholds);
        recomputeMetrics(built.seats, loadedAssumptions, activeThresholds, defaultFilters.turnoutScenario, nextLatestProgress);
        setDataWarnings(warnings);
        setDetailCoverage(built.detailCoverage);
        setCandidateCoverage(built.candidateCoverage);
        setCandidatesByDun(built.candidateByDun);
        setDataSummary({
          sourceFile: validation.sourceFile,
          totalDun: validation.totalDun,
          bnWins: validation.bnWins,
          nonBnWins: validation.nonBnWins,
        });
        setError(null);
      } catch {
        setError("Gagal memuatkan data Sabah. Sila semak fail data.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [localOverrides]);

  useEffect(() => {
    if (seats.length === 0) return;
    recomputeMetrics(seats, assumptions, thresholds, filters.turnoutScenario, latestProgress);
  }, [assumptions, filters.turnoutScenario, latestProgress, seats, thresholds]);

  useEffect(() => {
    setGrain(filters.dun ? "dun" : "parlimen");
  }, [filters.dun]);

  const parlimenOptions = useMemo(
    () =>
      seats
        .filter((seat) => seat.grain === "parlimen")
        .map((seat) => ({ code: seat.parlimen_code, name: seat.parlimen_name }))
        .sort((a, b) => a.code.localeCompare(b.code)),
    [seats]
  );

  const dunOptions = useMemo(
    () =>
      seats
        .filter((seat) => seat.grain === "dun")
        .filter((seat) => !filters.parlimen || seat.parlimen_code === filters.parlimen)
        .map((seat) => ({ code: seat.dun_code ?? "", name: seat.dun_name ?? "" }))
        .sort((a, b) => a.code.localeCompare(b.code)),
    [filters.parlimen, seats]
  );

  const allDunOptions = useMemo(
    () =>
      seats
        .filter((seat) => seat.grain === "dun")
        .map((seat) => ({ code: seat.dun_code ?? "", name: seat.dun_name ?? "" }))
        .sort((a, b) => a.code.localeCompare(b.code)),
    [seats]
  );

  const filteredMetrics = useMemo(
    () =>
      metrics.filter((metric) => {
        if (metric.seat.grain !== grain) return false;
        if (filters.parlimen && metric.seat.parlimen_code !== filters.parlimen) return false;
        if (filters.dun && metric.seat.dun_code !== filters.dun) return false;
        return true;
      }),
    [filters.dun, filters.parlimen, grain, metrics]
  );

  const parlimenMetrics = useMemo(() => metrics.filter((metric) => metric.seat.grain === "parlimen"), [metrics]);

  const resetThresholds = () => setThresholds(defaultThresholds);
  const saveSeatOverride = (dunCode: string, payload: LocalSeatOverride) => {
    const next = saveOverrides({
      ...localOverrides,
      seatDetails: {
        ...localOverrides.seatDetails,
        [dunCode]: { ...localOverrides.seatDetails[dunCode], ...payload },
      },
    });
    setLocalOverrides(next);
  };

  const saveCandidateOverride = (dunCode: string, payload: LocalCandidateOverride[]) => {
    const next = saveOverrides({
      ...localOverrides,
      candidates: {
        ...localOverrides.candidates,
        [dunCode]: payload,
      },
    });
    setLocalOverrides(next);
  };

  const resetLocalOverrides = () => {
    clearOverrides();
    setLocalOverrides(loadOverrides());
  };

  const importLocalOverrides = (incoming: Partial<LocalOverrides>, mode: "merge" | "replace") => {
    const next = mergeOverrides(localOverrides, incoming, mode);
    setLocalOverrides(next);
  };

  return (
    <DashboardContext.Provider
      value={{
        isLoading,
        error,
        assumptions,
        thresholds,
        setThresholds,
        resetThresholds,
        metrics,
        filteredMetrics,
        parlimenMetrics,
        filters,
        setFilters,
        grain,
        setGrain,
        parlimenOptions,
        dunOptions,
        allDunOptions,
        dataWarnings,
        dataSummary,
        detailCoverage,
        candidateCoverage,
        candidatesByDun,
        localOverrides,
        saveSeatOverride,
        saveCandidateOverride,
        resetLocalOverrides,
        importLocalOverrides,
        dashboardMode,
        setDashboardMode,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
