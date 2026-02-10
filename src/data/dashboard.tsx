import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Assumptions, Grain, Seat, SeatMetrics } from "./types";
import { buildSabahSeats, loadAssumptions, loadDunSabah, loadParlimenSabah, loadProgress, loadPrnBaseline } from "./loader";
import { computeSeatMetrics, getLatestProgress } from "../lib/kpi";

const defaultAssumptions: Assumptions = {
  turnout_scenario: { low: 0.55, base: 0.65, high: 0.75 },
  spoiled_rate: 0.02,
  buffer_rate: 0.02,
};

const defaultFilters = {
  parlimen: "",
  dun: "",
  turnoutScenario: "base",
};

const DashboardContext = createContext<{
  isLoading: boolean;
  error: string | null;
  assumptions: Assumptions;
  metrics: SeatMetrics[];
  filteredMetrics: SeatMetrics[];
  parlimenMetrics: SeatMetrics[];
  filters: typeof defaultFilters;
  setFilters: React.Dispatch<React.SetStateAction<typeof defaultFilters>>;
  grain: Grain;
  setGrain: React.Dispatch<React.SetStateAction<Grain>>;
  parlimenOptions: { code: string; name: string }[];
  dunOptions: { code: string; name: string }[];
}>({
  isLoading: true,
  error: null,
  assumptions: defaultAssumptions,
  metrics: [],
  filteredMetrics: [],
  parlimenMetrics: [],
  filters: defaultFilters,
  setFilters: () => undefined,
  grain: "parlimen",
  setGrain: () => undefined,
  parlimenOptions: [],
  dunOptions: [],
});

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const [metrics, setMetrics] = useState<SeatMetrics[]>([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [grain, setGrain] = useState<Grain>("parlimen");

  useEffect(() => {
    const load = async () => {
      try {
        const [parlimenRows, dunRows, progressRows, loadedAssumptions, baselineRows] = await Promise.all([
          loadParlimenSabah(),
          loadDunSabah(),
          loadProgress(),
          loadAssumptions(),
          loadPrnBaseline(),
        ]);
        const loadedSeats = buildSabahSeats(parlimenRows, dunRows, baselineRows);
        const latestProgress = getLatestProgress(progressRows);

        const dunMetrics = loadedSeats
          .filter((seat) => seat.grain === "dun")
          .map((seat) =>
            computeSeatMetrics(
              seat,
              latestProgress.get(seat.seat_id),
              loadedAssumptions,
              defaultFilters.turnoutScenario
            )
          );

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
            const metric = computeSeatMetrics(seat, mergedProgress, loadedAssumptions, defaultFilters.turnoutScenario);
            metric.flags = Array.from(new Set([...metric.flags, ...duns.flatMap((item) => item.flags)]));
            return metric;
          });

        setSeats(loadedSeats);
        setAssumptions(loadedAssumptions);
        setMetrics([...parlimenMetrics, ...dunMetrics]);
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
    setMetrics((prev) =>
      prev.map((metric) =>
        computeSeatMetrics(
          metric.seat,
          metric.progress,
          assumptions,
          filters.turnoutScenario
        )
      )
    );
  }, [assumptions, filters.turnoutScenario, seats.length]);

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

  const dunOptions = useMemo(() => {
    return seats
      .filter((seat) => seat.grain === "dun")
      .filter((seat) => !filters.parlimen || seat.parlimen_code === filters.parlimen)
      .map((seat) => ({ code: seat.dun_code ?? "", name: seat.dun_name ?? "" }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [filters.parlimen, seats]);

  const filteredMetrics = useMemo(() => {
    return metrics.filter((metric) => {
      if (metric.seat.grain !== grain) return false;
      if (filters.parlimen && metric.seat.parlimen_code !== filters.parlimen) return false;
      if (filters.dun && metric.seat.dun_code !== filters.dun) return false;
      return true;
    });
  }, [filters.dun, filters.parlimen, grain, metrics]);

  const parlimenMetrics = useMemo(
    () => metrics.filter((metric) => metric.seat.grain === "parlimen"),
    [metrics]
  );

  return (
    <DashboardContext.Provider
      value={{
        isLoading,
        error,
        assumptions,
        metrics,
        filteredMetrics,
        parlimenMetrics,
        filters,
        setFilters,
        grain,
        setGrain,
        parlimenOptions,
        dunOptions,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
