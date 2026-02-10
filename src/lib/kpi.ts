import type { Assumptions, ProgressRow, Seat, SeatMetrics, ThresholdConfig } from "../data/types";

const defaultProgress: ProgressRow = {
  week_start: "",
  seat_id: "",
  base_votes: 0,
  persuasion_votes: 0,
  gotv_votes: 0,
  persuadables: 0,
  conversion_rate: 0,
};

export const defaultThresholds: ThresholdConfig = {
  attack: {
    dekat: { margin_votes: 500, margin_pct: 0.02 },
    sederhana: { margin_votes: 1500, margin_pct: 0.05 },
  },
  defend: {
    risiko_tinggi: { majority_votes: 300, majority_pct: 0.01 },
    risiko_sederhana: { majority_votes: 800, majority_pct: 0.025 },
  },
};

export const getAttackLevel = (
  marginVotes: number,
  marginPct: number,
  thresholds: ThresholdConfig
): "dekat" | "sederhana" | "jauh" => {
  if (
    marginVotes <= thresholds.attack.dekat.margin_votes ||
    marginPct <= thresholds.attack.dekat.margin_pct
  ) {
    return "dekat";
  }
  if (
    marginVotes <= thresholds.attack.sederhana.margin_votes ||
    marginPct <= thresholds.attack.sederhana.margin_pct
  ) {
    return "sederhana";
  }
  return "jauh";
};

export const getDefendRiskLevel = (
  majorityVotes: number,
  majorityPct: number,
  thresholds: ThresholdConfig
): "risiko_tinggi" | "risiko_sederhana" | "risiko_rendah" => {
  if (
    majorityVotes <= thresholds.defend.risiko_tinggi.majority_votes ||
    majorityPct <= thresholds.defend.risiko_tinggi.majority_pct
  ) {
    return "risiko_tinggi";
  }
  if (
    majorityVotes <= thresholds.defend.risiko_sederhana.majority_votes ||
    majorityPct <= thresholds.defend.risiko_sederhana.majority_pct
  ) {
    return "risiko_sederhana";
  }
  return "risiko_rendah";
};

export const computeSeatMetrics = (
  seat: Seat,
  progress: ProgressRow | undefined,
  assumptions: Assumptions,
  turnoutScenario: string,
  thresholds: ThresholdConfig = defaultThresholds
): SeatMetrics => {
  const turnout = assumptions.turnout_scenario[turnoutScenario] ?? 0;
  const validVotes = seat.registered_voters * turnout * (1 - assumptions.spoiled_rate);

  const bnMarginToWin = seat.bn_rank === 1 ? 0 : Math.max(0, seat.winner_votes - seat.bn_votes + 1);
  const bnMarginToWinPct = seat.bn_rank === 1 || validVotes === 0 ? 0 : bnMarginToWin / validVotes;
  const bnBufferToLose = seat.bn_rank === 1 ? Math.max(0, seat.bn_votes - seat.runner_up_votes - 1) : 0;
  const majorityVotes = seat.bn_rank === 1 ? Math.max(0, seat.winner_votes - seat.runner_up_votes) : 0;
  const majorityPct = validVotes === 0 ? 0 : majorityVotes / validVotes;

  const statusCategory = seat.bn_rank === 1 ? "defend" : "attack";
  const riskLevel = seat.bn_rank === 1 ? getDefendRiskLevel(majorityVotes, majorityPct, thresholds) : null;
  const targetLevel = seat.bn_rank === 1 ? null : getAttackLevel(bnMarginToWin, bnMarginToWinPct, thresholds);
  const bnStatusTag =
    seat.bn_rank === 1
      ? `BN Menang (Defend) · ${riskLevel?.replace("_", " ") ?? "risiko_rendah"}`
      : `Sasaran ${targetLevel === "dekat" ? "Dekat" : targetLevel === "sederhana" ? "Sederhana" : "Jauh"}`;

  const bufferVotes = assumptions.buffer_votes ?? Math.round(validVotes * (assumptions.buffer_rate ?? 0));
  const umm = seat.last_opponent_top_votes + 1;
  const wvt = umm + bufferVotes;
  const activeProgress = progress ?? defaultProgress;
  const totalVote = activeProgress.base_votes + activeProgress.persuasion_votes + activeProgress.gotv_votes;
  const gapToWvt = wvt - totalVote;
  const swingMin = Math.floor(seat.last_majority / 2) + 1;
  const swingPct = validVotes === 0 ? 0 : seat.last_majority / 2 / validVotes;
  const neededGotvToCloseGap = Math.max(0, gapToWvt - (activeProgress.base_votes + activeProgress.persuasion_votes));

  const flags: string[] = [];
  if (turnout < 0 || turnout > 1) flags.push("Turnout di luar julat 0 hingga 1");
  if (assumptions.spoiled_rate < 0 || assumptions.spoiled_rate > 0.1) flags.push("Undi rosak di luar julat 0 hingga 0.10");
  if (totalVote > validVotes) flags.push("Jumlah undi dijangka melebihi Undi Sah (Anggaran)");
  if (wvt > validVotes) flags.push("Sasaran Selamat (WVT) melebihi Undi Sah (Anggaran)");
  if (seat.registered_voters_estimated) flags.push("Data pemilih DUN adalah anggaran");

  const cadanganTindakan =
    flags.length > 0
      ? "Semak data: turnout/undi rosak/sasaran tak realistik"
      : gapToWvt > 0 && targetLevel === "dekat"
        ? "Fokus Persuasion + GOTV"
        : riskLevel === "risiko_tinggi"
          ? "Kukuhkan Base + GOTV, elak bocor undi"
          : statusCategory === "defend"
            ? "Kekalkan momentum akar umbi + pemantauan saluran"
            : "Perkemas jentera sasaran sederhana/jauh secara berfasa";

  const mainOpponentParty = seat.bn_rank === 1 ? seat.runner_up_party : seat.winner_party;

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
    bnMarginToWinPct,
    bnBufferToLose,
    majorityPct,
    bnStatusTag,
    statusCategory,
    riskLevel,
    targetLevel,
    mainOpponentParty,
    cadanganTindakan,
  };
};

export const getLatestProgress = (rows: ProgressRow[]) => {
  const bySeat = new Map<string, ProgressRow>();
  rows.forEach((row) => {
    const existing = bySeat.get(row.seat_id);
    if (!existing || row.week_start > existing.week_start) bySeat.set(row.seat_id, row);
  });
  return bySeat;
};

export const getSeatActionNotes = (metric: SeatMetrics) => {
  const notes: string[] = [];
  if (metric.gapToWvt > Math.max(1000, metric.wvt * 0.1)) notes.push("Jurang besar: tambah usaha persuasi dan GOTV segera.");
  if (metric.totalVote > metric.validVotes || metric.wvt > metric.validVotes) notes.push("Sasaran tak realistik: semak semula sasaran undi dan andaian turnout.");
  if (metric.swingPct <= 0.02) notes.push("Kerusi dekat / marginal: gerak cepat untuk pertahan pengundi atas pagar.");
  if (notes.length === 0) notes.push("Prestasi stabil: teruskan pemantauan mingguan dan kemas kini data.");
  return notes;
};
