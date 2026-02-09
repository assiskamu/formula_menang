import { describe, expect, it } from "vitest";
import { computeSeatMetrics } from "./kpi";
import type { Assumptions, ProgressRow, Seat } from "./types";

const seat: Seat = {
  seat_id: "P001",
  seat_name: "Test Seat",
  state: "Test",
  registered_voters: 10000,
  last_opponent_top_votes: 4000,
  last_majority: 1000,
  corners: 5,
};

const progress: ProgressRow = {
  week_start: "2024-06-03",
  seat_id: "P001",
  base_votes: 3500,
  persuasion_votes: 800,
  gotv_votes: 400,
  persuadables: 2000,
  conversion_rate: 0.4,
};

const assumptions: Assumptions = {
  turnout_scenario: { low: 0.5, base: 0.6, high: 0.7 },
  spoiled_rate: 0.02,
  buffer_rate: 0.03,
};

describe("computeSeatMetrics", () => {
  it("calculates KPI values based on formulas", () => {
    const metrics = computeSeatMetrics(seat, progress, assumptions, "base");
    const expectedValidVotes = 10000 * 0.6 * (1 - 0.02);
    const expectedBufferVotes = Math.round(expectedValidVotes * 0.03);
    expect(metrics.validVotes).toBeCloseTo(expectedValidVotes, 2);
    expect(metrics.umm).toBe(4001);
    expect(metrics.wvt).toBe(4001 + expectedBufferVotes);
    expect(metrics.totalVote).toBe(4700);
    expect(metrics.gapToWvt).toBe(metrics.wvt - 4700);
    expect(metrics.swingMin).toBe(Math.floor(1000 / 2) + 1);
    expect(metrics.swingPct).toBeCloseTo(1000 / 2 / expectedValidVotes, 5);
  });

  it("flags data quality issues", () => {
    const badAssumptions = {
      ...assumptions,
      spoiled_rate: 0.2,
    };
    const metrics = computeSeatMetrics(seat, progress, badAssumptions, "high");
    expect(metrics.flags).toContain("Spoiled rate luar julat");
  });
});
