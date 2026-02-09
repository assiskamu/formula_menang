import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Assumptions, Seat, SeatMetrics } from "./types";
import { loadAssumptions, loadProgress, loadSeats } from "./loader";
import { computeSeatMetrics, getLatestProgress } from "./kpi";

const defaultAssumptions: Assumptions = {
  turnout_scenario: { low: 0.55, base: 0.65, high: 0.75 },
  spoiled_rate: 0.02,
  buffer_rate: 0.02,
};

const defaultFilters = {
  state: "",
  seat: "",
  turnoutScenario: "base",
};

const DashboardContext = createContext<{
  isLoading: boolean;
  error: string | null;
  assumptions: Assumptions;
  metrics: SeatMetrics[];
  filteredMetrics: SeatMetrics[];
  filters: typeof defaultFilters;
  setFilters: React.Dispatch<React.SetStateAction<typeof defaultFilters>>;
  seatOptions: Seat[];
  stateOptions: string[];
}>({
  isLoading: true,
  error: null,
  assumptions: defaultAssumptions,
  metrics: [],
  filteredMetrics: [],
  filters: defaultFilters,
  setFilters: () => undefined,
  seatOptions: [],
  stateOptions: [],
});

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const [metrics, setMetrics] = useState<SeatMetrics[]>([]);
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    const load = async () => {
      try {
        const [loadedSeats, progressRows, loadedAssumptions] = await Promise.all([
          loadSeats(),
          loadProgress(),
          loadAssumptions(),
        ]);
        const latestProgress = getLatestProgress(progressRows);
        const computed = loadedSeats.map((seat) =>
          computeSeatMetrics(
            seat,
            latestProgress.get(seat.seat_id),
            loadedAssumptions,
            filters.turnoutScenario
          )
        );
        setSeats(loadedSeats);
        setAssumptions(loadedAssumptions);
        setMetrics(computed);
        setError(null);
      } catch (err) {
        setError("Gagal memuatkan data. Sila semak fail data.");
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

  const stateOptions = useMemo(
    () => Array.from(new Set(seats.map((seat) => seat.state))).sort(),
    [seats]
  );

  const seatOptions = useMemo(
    () => seats.slice().sort((a, b) => a.seat_name.localeCompare(b.seat_name)),
    [seats]
  );

  const filteredMetrics = useMemo(() => {
    return metrics.filter((metric) => {
      if (filters.state && metric.seat.state !== filters.state) {
        return false;
      }
      if (filters.seat && metric.seat.seat_id !== filters.seat) {
        return false;
      }
      return true;
    });
  }, [filters.seat, filters.state, metrics]);

  return (
    <DashboardContext.Provider
      value={{
        isLoading,
        error,
        assumptions,
        metrics,
        filteredMetrics,
        filters,
        setFilters,
        seatOptions,
        stateOptions,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
