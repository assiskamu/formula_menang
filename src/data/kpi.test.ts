import { describe, expect, it } from "vitest";
import { computeSeatMetrics, defaultThresholds, getAttackLevel, getDefendRiskLevel } from "../lib/kpi";
import type { Assumptions, ProgressRow, Seat } from "./types";

const assumptions: Assumptions = {
  turnout_scenario: { base: 0.6 },
  spoiled_rate: 0.02,
  buffer_rate: 0.03,
};

const progress: ProgressRow = {
  week_start: "2024-06-03",
  seat_id: "N.01",
  base_votes: 3500,
  persuasion_votes: 800,
  gotv_votes: 400,
  persuadables: 2000,
  conversion_rate: 0.4,
};

const seatBase: Omit<Seat, "winner_party" | "winner_votes" | "runner_up_party" | "runner_up_votes" | "bn_votes" | "bn_rank"> = {
  seat_id: "N.01",
  seat_name: "N.01 Test Seat",
  state: "Sabah",
  grain: "dun",
  parlimen_code: "P.167",
  parlimen_name: "Kudat",
  dun_code: "N.01",
  dun_name: "Test Seat",
  registered_voters: 10000,
  registered_voters_estimated: true,
  last_opponent_top_votes: 4000,
  last_majority: 1000,
  corners: 5,
};

describe("threshold tagging", () => {
  it("tags attack levels by vote or pct", () => {
    expect(getAttackLevel(450, 0.03, defaultThresholds)).toBe("dekat");
    expect(getAttackLevel(900, 0.04, defaultThresholds)).toBe("sederhana");
    expect(getAttackLevel(3000, 0.07, defaultThresholds)).toBe("jauh");
  });

  it("tags defend risk by majority vote or pct", () => {
    expect(getDefendRiskLevel(280, 0.03, defaultThresholds)).toBe("risiko_tinggi");
    expect(getDefendRiskLevel(700, 0.02, defaultThresholds)).toBe("risiko_sederhana");
    expect(getDefendRiskLevel(2000, 0.08, defaultThresholds)).toBe("risiko_rendah");
  });
});

describe("BN formulas and GapToWVT", () => {
  it("calculates BN_MarginToWin and pct when BN not winner", () => {
    const seat: Seat = {
      ...seatBase,
      winner_party: "WARISAN",
      winner_votes: 5200,
      runner_up_party: "BN",
      runner_up_votes: 5000,
      bn_votes: 5000,
      bn_rank: 2,
    };
    const metric = computeSeatMetrics(seat, progress, assumptions, "base", defaultThresholds);
    const validVotes = 10000 * 0.6 * 0.98;
    expect(metric.bnMarginToWin).toBe(201);
    expect(metric.bnMarginToWinPct).toBeCloseTo(201 / validVotes, 6);
  });

  it("calculates BN_BufferToLose and majority pct when BN winner", () => {
    const seat: Seat = {
      ...seatBase,
      winner_party: "BN",
      winner_votes: 5300,
      runner_up_party: "PH",
      runner_up_votes: 5000,
      bn_votes: 5300,
      bn_rank: 1,
    };
    const metric = computeSeatMetrics(seat, progress, assumptions, "base", defaultThresholds);
    const validVotes = 10000 * 0.6 * 0.98;
    expect(metric.bnBufferToLose).toBe(299);
    expect(metric.majorityPct).toBeCloseTo(300 / validVotes, 6);
  });

  it("keeps GapToWVT positive when target not reached", () => {
    const seat: Seat = {
      ...seatBase,
      winner_party: "PH",
      winner_votes: 5200,
      runner_up_party: "BN",
      runner_up_votes: 5000,
      bn_votes: 5000,
      bn_rank: 2,
    };
    const lowProgress = { ...progress, base_votes: 2000, persuasion_votes: 200, gotv_votes: 100 };
    const metric = computeSeatMetrics(seat, lowProgress, assumptions, "base", defaultThresholds);
    expect(metric.gapToWvt).toBeGreaterThan(0);
  });
});
