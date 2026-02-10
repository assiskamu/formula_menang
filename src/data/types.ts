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
  registered_voters: number;
  registered_voters_estimated: boolean;
  last_opponent_top_votes: number;
  last_majority: number;
  corners: number;
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
};
