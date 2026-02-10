export type ParlimenRow = {
  parlimen_code: string;
  parlimen_name: string;
  jumlah_pemilih: number;
};

export type DunRow = {
  parlimen_code: string;
  parlimen_name: string;
  dun_code: string;
  dun_name: string;
};

export type PrnBaselineRow = {
  dun_code: string;
  dun_name: string;
  parlimen_code: string;
  corners: number;
  winner_party: string;
  winner_votes: number;
  runner_up_party: string;
  runner_up_votes: number;
  bn_votes: number;
  bn_rank: number | null;
  majority: number;
  data_flags?: string[];
};

export type WinnersRow = {
  dun_code: string;
  dun_name: string;
  winner_name: string;
  winner_party: string;
  winner_votes: number;
};

export type SeatDetailsRow = {
  dun_code: string;
  dun_name: string;
  registered_voters: number;
  total_votes_cast: number;
  turnout_pct: number;
  majority_votes: number;
  source: string;
};

export type CandidateRow = {
  dun_code: string;
  dun_name: string;
  candidate_name: string;
  party: string;
  votes: number;
  vote_share_pct: number;
};

export type LocalSeatOverride = {
  registered_voters?: number;
  total_votes_cast?: number;
  turnout_pct?: number;
  majority_votes?: number;
};

export type LocalCandidateOverride = {
  candidate_name: string;
  party: string;
  votes: number;
  vote_share_pct?: number;
};

export type LocalOverrides = {
  version: 1;
  updatedAtISO: string;
  seatDetails: Record<string, LocalSeatOverride>;
  candidates: Record<string, LocalCandidateOverride[]>;
};

export type CandidateAggregate = {
  dun_code: string;
  num_candidates: number;
  runner_up_party: string;
  runner_up_votes: number;
  bn_votes: number | null;
  bn_rank: number | null;
  bn_margin_to_win: number | null;
  bn_margin_defend: number | null;
};

export type Grain = "parlimen" | "dun";

export type Seat = {
  seat_id: string;
  seat_name: string;
  state: string;
  grain: Grain;
  parlimen_code: string;
  parlimen_name: string;
  dun_code?: string;
  dun_name?: string;
  winner_name?: string;
  registered_voters: number;
  registered_voters_estimated: boolean;
  last_opponent_top_votes: number;
  last_majority: number;
  corners: number;
  winner_party: string;
  winner_votes: number;
  runner_up_party: string;
  runner_up_votes: number;
  bn_votes: number;
  bn_rank: number | null;
  details_available?: boolean;
  candidates_available?: boolean;
  total_votes_cast?: number;
  turnout_pct?: number;
  majority_votes?: number;
  num_candidates?: number;
  bn_margin_to_win?: number | null;
  bn_margin_defend?: number | null;
};

export type ProgressRow = {
  week_start: string;
  seat_id: string;
  base_votes: number;
  persuasion_votes: number;
  gotv_votes: number;
  persuadables: number;
  conversion_rate: number;
};

export type Assumptions = {
  turnout_scenario: Record<string, number>;
  spoiled_rate: number;
  buffer_votes?: number;
  buffer_rate?: number;
};

export type AttackThresholds = {
  dekat: { margin_votes: number; margin_pct: number };
  sederhana: { margin_votes: number; margin_pct: number };
};

export type DefendThresholds = {
  risiko_tinggi: { majority_votes: number; majority_pct: number };
  risiko_sederhana: { majority_votes: number; majority_pct: number };
};

export type ThresholdConfig = {
  attack: AttackThresholds;
  defend: DefendThresholds;
};

export type SeatMetrics = {
  seat: Seat;
  progress: ProgressRow;
  turnout: number;
  validVotes: number;
  umm: number;
  wvt: number;
  totalVote: number;
  gapToWvt: number;
  swingMin: number;
  swingPct: number;
  flags: string[];
  neededGotvToCloseGap: number;
  bnMarginToWin: number;
  bnMarginToWinPct: number;
  bnBufferToLose: number;
  majorityPct: number;
  bnStatusTag: string;
  statusCategory: "defend" | "attack";
  riskLevel: "risiko_tinggi" | "risiko_sederhana" | "risiko_rendah" | null;
  targetLevel: "dekat" | "sederhana" | "jauh" | null;
  mainOpponentParty: string;
  cadanganTindakan: string;
};
