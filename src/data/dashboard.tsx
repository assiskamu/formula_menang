import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Assumptions, Grain, Seat, SeatMetrics, ThresholdConfig } from "./types";
import { buildSabahSeats, loadAssumptions, loadDunSabah, loadParlimenSabah, loadProgress, loadPrnBaseline, loadThresholds } from "./loader";
import { computeSeatMetrics, defaultThresholds, getLatestProgress } from "../lib/kpi";
import { validateWinnersRows } from "./baseline";

const defaultAssumptions: Assumptions = {
  turnout_scenario: { low: 0.55, base: 0.65, high: 0.75 },
  spoiled_rate: 0.02,
  buffer_rate: 0.02,
};

const defaultFilters = { parlimen: "", dun: "", turnoutScenario: "base" };
const THRESHOLDS_KEY = "formula-menang-thresholds-v1";

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
  dataWarnings: string[];
  dataSummary: { sourceFile: string; totalDun: number; bnWins: number; nonBnWins: number };
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
  dataWarnings: [],
  dataSummary: { sourceFile: "prn_sabah_2025_winners.csv", totalDun: 0, bnWins: 0, nonBnWins: 0 },
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
  const [filters, setFilters] = useState(defaultFilters);
  const [grain, setGrain] = useState<Grain>("parlimen");

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
    const load = async () => {
      try {
        const [parlimenRows, dunRows, progressRows, loadedAssumptions, baselineRows, loadedThresholds] = await Promise.all([
          loadParlimenSabah(),
          loadDunSabah(),
          loadProgress(),
          loadAssumptions(),
          loadPrnBaseline(),
          loadThresholds(),
        ]);
        const loadedSeats = buildSabahSeats(parlimenRows, dunRows, baselineRows);
        const validation = validateWinnersRows(
          baselineRows.map((row) => ({
            dun_code: row.dun_code,
            dun_name: row.dun_name,
            winner_name: "",
            winner_party: row.winner_party,
            winner_votes: row.winner_votes,
          })),
          "prn_sabah_2025_winners.csv"
        );
        const latestProgress = getLatestProgress(progressRows);
        const saved = localStorage.getItem(THRESHOLDS_KEY);
        const activeThresholds = saved ? (JSON.parse(saved) as ThresholdConfig) : loadedThresholds;

        const dunMetrics = loadedSeats
          .filter((seat) => seat.grain === "dun")
          .map((seat) => computeSeatMetrics(seat, latestProgress.get(seat.seat_id), loadedAssumptions, defaultFilters.turnoutScenario, activeThresholds));

        const groupedParlimen = new Map<string, SeatMetrics[]>();
        dunMetrics.forEach((metric) => {
          const current = groupedParlimen.get(metric.seat.parlimen_code) ?? [];
          current.push(metric);
          groupedParlimen.set(metric.seat.parlimen_code, current);
        });

        const parlimenMetrics = loadedSeats
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
            const metric = computeSeatMetrics(seat, mergedProgress, loadedAssumptions, defaultFilters.turnoutScenario, activeThresholds);
            metric.flags = Array.from(new Set([...metric.flags, ...duns.flatMap((item) => item.flags)]));
            return metric;
          });

        setSeats(loadedSeats);
        setAssumptions(loadedAssumptions);
        setThresholds(activeThresholds);
        setMetrics([...parlimenMetrics, ...dunMetrics]);
        setDataWarnings(validation.warnings);
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
  }, []);

  useEffect(() => {
    if (seats.length === 0) return;
    setMetrics((prev) => prev.map((metric) => computeSeatMetrics(metric.seat, metric.progress, assumptions, filters.turnoutScenario, thresholds)));
  }, [assumptions, filters.turnoutScenario, seats.length, thresholds]);

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
        dataWarnings,
        dataSummary,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
