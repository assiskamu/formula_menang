import type { CandidateAggregate, CandidateRow } from "./types";

const safeParty = (party: string | undefined) => (party?.trim() ? party.trim() : "Tidak diketahui");

export const aggregateCandidateRows = (rows: CandidateRow[]) => {
  const grouped = new Map<string, CandidateRow[]>();
  rows.forEach((row) => {
    const current = grouped.get(row.dun_code) ?? [];
    current.push(row);
    grouped.set(row.dun_code, current);
  });

  const aggregates = new Map<string, CandidateAggregate>();
  grouped.forEach((group, dunCode) => {
    const sorted = [...group].sort((a, b) => b.votes - a.votes);
    const top = sorted[0];
    const runnerUp = sorted[1];
    const bnEntry = sorted.find((candidate) => safeParty(candidate.party).toUpperCase() === "BN");
    const bnRank = bnEntry ? sorted.findIndex((candidate) => candidate === bnEntry) + 1 : null;
    const bnVotes = bnEntry ? bnEntry.votes : null;

    const bnMarginToWin = bnEntry && bnRank !== 1 && top ? Math.max(0, top.votes - bnEntry.votes + 1) : null;
    const bnMarginDefend = bnEntry && bnRank === 1 && runnerUp ? Math.max(0, bnEntry.votes - runnerUp.votes) : bnEntry && bnRank === 1 ? bnEntry.votes : null;

    aggregates.set(dunCode, {
      dun_code: dunCode,
      num_candidates: sorted.length,
      runner_up_party: runnerUp ? safeParty(runnerUp.party) : "Tidak diketahui",
      runner_up_votes: runnerUp?.votes ?? 0,
      bn_votes: bnVotes,
      bn_rank: bnRank,
      bn_margin_to_win: bnMarginToWin,
      bn_margin_defend: bnMarginDefend,
    });
  });

  return {
    groupedCandidates: grouped,
    aggregates,
  };
};
