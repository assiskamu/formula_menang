import type { Assumptions, ProgressRow, Seat, SeatMetrics } from "./types";

const defaultProgress: ProgressRow = {
  week_start: "",
  seat_id: "",
  base_votes: 0,
  persuasion_votes: 0,
  gotv_votes: 0,
  persuadables: 0,
  conversion_rate: 0,
};

export const computeSeatMetrics = (
  seat: Seat,
  progress: ProgressRow | undefined,
  assumptions: Assumptions,
  turnoutScenario: string
): SeatMetrics => {
  const turnout = assumptions.turnout_scenario[turnoutScenario] ?? 0;
  const validVotes =
    seat.registered_voters * turnout * (1 - assumptions.spoiled_rate);
  const bufferVotes =
    assumptions.buffer_votes ??
    Math.round(validVotes * (assumptions.buffer_rate ?? 0));
  const umm = seat.last_opponent_top_votes + 1;
  const wvt = umm + bufferVotes;
  const activeProgress = progress ?? defaultProgress;
  const totalVote =
    activeProgress.base_votes +
    activeProgress.persuasion_votes +
    activeProgress.gotv_votes;
  const gapToWvt = wvt - totalVote;
  const swingMin = Math.floor(seat.last_majority / 2) + 1;
  const swingPct = validVotes === 0 ? 0 : seat.last_majority / 2 / validVotes;
  const neededGotvToCloseGap = Math.max(
    0,
    gapToWvt - (activeProgress.base_votes + activeProgress.persuasion_votes)
  );

  const flags: string[] = [];
  if (turnout < 0 || turnout > 1) {
    flags.push("Turnout luar julat");
  }
  if (assumptions.spoiled_rate < 0 || assumptions.spoiled_rate > 0.1) {
    flags.push("Spoiled rate luar julat");
  }
  if (totalVote > validVotes) {
    flags.push("TotalVote > ValidVotes");
  }
  if (wvt > validVotes) {
    flags.push("WVT > ValidVotes");
  }
  if (seat.registered_voters_estimated) {
    flags.push("Data pemilih DUN: ESTIMATE");
  }

  return {
    seat,
    progress: activeProgress,
    turnout,
    validVotes,
    umm,
    wvt,
    totalVote,
    gapToWvt,
    swingMin,
    swingPct,
    flags,
    neededGotvToCloseGap,
  };
};

export const getLatestProgress = (rows: ProgressRow[]) => {
  const bySeat = new Map<string, ProgressRow>();
  rows.forEach((row) => {
    const existing = bySeat.get(row.seat_id);
    if (!existing || row.week_start > existing.week_start) {
      bySeat.set(row.seat_id, row);
    }
  });
  return bySeat;
};
