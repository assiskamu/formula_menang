import type { Assumptions, ProgressRow, Seat, SeatMetrics } from "../data/types";

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
  const bnMarginToWin = seat.bn_rank === 1 ? 0 : Math.max(0, seat.winner_votes - seat.bn_votes + 1);
  const bnBufferToLose = seat.bn_rank === 1 ? Math.max(0, seat.bn_votes - seat.runner_up_votes - 1) : 0;
  const nearThreshold = 500;
  const mediumThreshold = 1500;
  const bnStatusTag =
    seat.bn_rank === 1
      ? "BN Menang (Defend)"
      : seat.bn_rank === 2 && bnMarginToWin <= nearThreshold
        ? "Sasaran Dekat"
        : seat.bn_rank === 2 && bnMarginToWin <= mediumThreshold
          ? "Sasaran Sederhana"
          : "Sasaran Jauh";
  const mainOpponentParty = seat.bn_rank === 1 ? seat.runner_up_party : seat.winner_party;
  const cadanganTindakan =
    seat.bn_rank === 1
      ? bnBufferToLose <= 300
        ? "Pertahanan ketat + GOTV awal"
        : "Kekalkan kubu dan perluas base"
      : bnMarginToWin <= nearThreshold
        ? "Serang kerusi pinggir melalui persuasi fokus"
        : bnMarginToWin <= mediumThreshold
          ? "Gabung operasi base + persuasi berfasa"
          : "Bina asas jentera dahulu (base building)";
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
    flags.push("Turnout di luar julat 0 hingga 1");
  }
  if (assumptions.spoiled_rate < 0 || assumptions.spoiled_rate > 0.1) {
    flags.push("Undi rosak di luar julat 0 hingga 0.10");
  }
  if (totalVote > validVotes) {
    flags.push("Jumlah undi dijangka melebihi Undi Sah (Anggaran)");
  }
  if (wvt > validVotes) {
    flags.push("Sasaran Selamat (WVT) melebihi Undi Sah (Anggaran)");
  }
  if (seat.registered_voters_estimated) {
    flags.push("Data pemilih DUN adalah anggaran");
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
    bnMarginToWin,
    bnBufferToLose,
    bnStatusTag,
    mainOpponentParty,
    cadanganTindakan,
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

export const getSeatActionNotes = (metric: SeatMetrics) => {
  const notes: string[] = [];
  if (metric.gapToWvt > Math.max(1000, metric.wvt * 0.1)) {
    notes.push("Jurang besar: tambah usaha persuasi dan GOTV segera.");
  }
  if (metric.totalVote > metric.validVotes || metric.wvt > metric.validVotes) {
    notes.push("Sasaran tak realistik: semak semula sasaran undi dan andaian turnout.");
  }
  if (metric.swingPct <= 0.02) {
    notes.push("Kerusi dekat / marginal: gerak cepat untuk pertahan pengundi atas pagar.");
  }
  if (notes.length === 0) {
    notes.push("Prestasi stabil: teruskan pemantauan mingguan dan kemas kini data.");
  }
  return notes;
};
