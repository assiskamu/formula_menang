import type {
  Assumptions,
  CandidateRow,
  DunRow,
  ParlimenRow,
  ProgressRow,
  Seat,
  SeatDetailsRow,
  ThresholdConfig,
  WinnersRow,
  LocalOverrides,
} from "./types";
import { aggregateCandidateRows } from "./seatEnrichment";

const parseCsv = (csvText: string) => {
  const [headerLine, ...lines] = csvText.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((value) => value.trim());
  return lines
    .map((line) => line.split(",").map((value) => value.trim()))
    .filter((row) => row.length === headers.length)
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
};

const toNumber = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const loadParlimenSabah = async () => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/parlimen_sabah.csv`);
  const text = await response.text();
  const records = parseCsv(text);
  return records.map(
    (record) =>
      ({
        parlimen_code: record.parlimen_code,
        parlimen_name: record.parlimen_name,
        jumlah_pemilih: toNumber(record.jumlah_pemilih),
      }) satisfies ParlimenRow
  );
};

export const loadDunSabah = async () => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/dun_sabah.csv`);
  const text = await response.text();
  const records = parseCsv(text);
  return records.map(
    (record) =>
      ({
        parlimen_code: record.parlimen_code,
        parlimen_name: record.parlimen_name,
        dun_code: record.dun_code,
        dun_name: record.dun_name,
      }) satisfies DunRow
  );
};

export const loadWinnersMaster = async () => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/prn_sabah_2025_winners.csv`);
  const text = await response.text();
  return parseCsv(text).map(
    (record) =>
      ({
        dun_code: record.dun_code,
        dun_name: record.dun_name,
        winner_name: record.winner_name,
        winner_party: record.winner_party,
        winner_votes: toNumber(record.winner_votes),
      }) satisfies WinnersRow
  );
};

export const loadSeatDetails = async () => {
  const primary = await fetch(`${import.meta.env.BASE_URL}data/seat_details_enriched_with_candidates.csv`);
  const fallback = !primary.ok ? await fetch(`${import.meta.env.BASE_URL}data/seat_details_enriched_v3.csv`) : null;
  const response = primary.ok ? primary : fallback;
  if (!response?.ok) return [];
  const text = await response.text();
  return parseCsv(text).map(
    (record) =>
      ({
        dun_code: record.dun_code,
        dun_name: record.dun_name,
        registered_voters: toNumber(record.registered_voters),
        total_votes_cast: toNumber(record.total_votes_cast),
        turnout_pct: toNumber(record.turnout_pct),
        majority_votes: toNumber(record.majority_votes),
        source: record.source,
      }) satisfies SeatDetailsRow
  );
};

export const loadCandidatesLong = async () => {
  const primary = await fetch(`${import.meta.env.BASE_URL}data/seat_details_enriched_with_candidates.csv`);
  const fallback = !primary.ok ? await fetch(`${import.meta.env.BASE_URL}data/seat_details_enriched_with_candidates_v2.csv`) : null;
  const response = primary.ok ? primary : fallback;
  if (!response?.ok) return [];
  const text = await response.text();
  return parseCsv(text)
    .filter((record) => record.candidate_name || record.party || record.votes)
    .map(
      (record) =>
        ({
          dun_code: record.dun_code,
          dun_name: record.dun_name,
          candidate_name: record.candidate_name,
          party: record.party,
          votes: toNumber(record.votes),
          vote_share_pct: toNumber(record.vote_share_pct),
        }) satisfies CandidateRow
    );
};

const estimateOpponentVotes = (registeredVoters: number) => Math.round(registeredVoters * 0.34);
const estimateMajority = (registeredVoters: number) => Math.max(300, Math.round(registeredVoters * 0.04));

export const buildSabahSeats = (
  parlimenRows: ParlimenRow[],
  dunRows: DunRow[],
  winnersRows: WinnersRow[],
  seatDetailRows: SeatDetailsRow[],
  candidateRows: CandidateRow[],
  overrides?: LocalOverrides
): { seats: Seat[]; candidateByDun: Map<string, CandidateRow[]>; detailCoverage: number; candidateCoverage: number; duplicateDetails: string[] } => {
  const dunsByParlimen = new Map<string, DunRow[]>();
  dunRows.forEach((row) => {
    const current = dunsByParlimen.get(row.parlimen_code) ?? [];
    current.push(row);
    dunsByParlimen.set(row.parlimen_code, current);
  });

  const detailsByDun = new Map<string, SeatDetailsRow>();
  const detailCounts = new Map<string, number>();
  seatDetailRows.forEach((row) => {
    detailCounts.set(row.dun_code, (detailCounts.get(row.dun_code) ?? 0) + 1);
    if (!detailsByDun.has(row.dun_code)) detailsByDun.set(row.dun_code, row);
  });
  const duplicateDetails = [...detailCounts.entries()].filter(([, count]) => count > 1).map(([code]) => code);
  const parlimenByCode = new Map(parlimenRows.map((row) => [row.parlimen_code, row]));
  const dunMetaByCode = new Map(dunRows.map((row) => [row.dun_code, row]));

  const mergedSeatDetails = new Map(detailsByDun);
  Object.entries(overrides?.seatDetails ?? {}).forEach(([dunCode, local]) => {
    const existing = mergedSeatDetails.get(dunCode);
    if (!existing) {
      mergedSeatDetails.set(dunCode, {
        dun_code: dunCode,
        dun_name: dunMetaByCode.get(dunCode)?.dun_name ?? "",
        registered_voters: toNumber(local.registered_voters),
        total_votes_cast: toNumber(local.total_votes_cast),
        turnout_pct: toNumber(local.turnout_pct),
        majority_votes: toNumber(local.majority_votes),
        source: "local",
      });
      return;
    }
    mergedSeatDetails.set(dunCode, {
      ...existing,
      registered_voters: local.registered_voters === undefined ? existing.registered_voters : toNumber(local.registered_voters),
      total_votes_cast: local.total_votes_cast === undefined ? existing.total_votes_cast : toNumber(local.total_votes_cast),
      turnout_pct: local.turnout_pct === undefined ? existing.turnout_pct : toNumber(local.turnout_pct),
      majority_votes: local.majority_votes === undefined ? existing.majority_votes : toNumber(local.majority_votes),
      source: "local",
    });
  });

  const mergedCandidatesByDun = new Map<string, CandidateRow[]>();
  const baseCandidates = aggregateCandidateRows(candidateRows).groupedCandidates;
  baseCandidates.forEach((rows, dunCode) => {
    mergedCandidatesByDun.set(dunCode, rows);
  });
  Object.entries(overrides?.candidates ?? {}).forEach(([dunCode, rows]) => {
    const dunName = dunMetaByCode.get(dunCode)?.dun_name ?? "";
    const normalized = rows.map((row) => ({
      dun_code: dunCode,
      dun_name: dunName,
      candidate_name: row.candidate_name,
      party: row.party,
      votes: toNumber(row.votes),
      vote_share_pct: toNumber(row.vote_share_pct),
    }));
    mergedCandidatesByDun.set(dunCode, normalized);
  });
  const { groupedCandidates, aggregates } = aggregateCandidateRows([...mergedCandidatesByDun.values()].flat());

  const dunSeats: Seat[] = winnersRows.map((winner) => {
    const mappedDun = dunMetaByCode.get(winner.dun_code);
    const parlimen = mappedDun ? parlimenByCode.get(mappedDun.parlimen_code) : undefined;
    const dunCount = mappedDun ? (dunsByParlimen.get(mappedDun.parlimen_code) ?? []).length : 0;
    const estimatedDunVoters = dunCount > 0 ? (parlimen?.jumlah_pemilih ?? 0) / dunCount : 0;

    const detail = mergedSeatDetails.get(winner.dun_code);
    const candidateAgg = aggregates.get(winner.dun_code);
    const bnVotes = candidateAgg?.bn_votes ?? (winner.winner_party === "BN" ? winner.winner_votes : 0);
    const bnRank = candidateAgg?.bn_rank ?? (winner.winner_party === "BN" ? 1 : null);

    return {
      seat_id: winner.dun_code,
      seat_name: `${winner.dun_code} ${winner.dun_name}`,
      state: "Sabah",
      grain: "dun",
      parlimen_code: mappedDun?.parlimen_code ?? "parlimen_unknown",
      parlimen_name: mappedDun?.parlimen_name ?? parlimen?.parlimen_name ?? "Parlimen Tidak Diketahui",
      dun_code: winner.dun_code,
      dun_name: winner.dun_name,
      winner_name: winner.winner_name,
      registered_voters: detail?.registered_voters ?? estimatedDunVoters,
      registered_voters_estimated: !detail,
      last_opponent_top_votes:
        candidateAgg?.runner_up_votes ?? (winner.winner_party === "BN" ? estimateOpponentVotes(detail?.registered_voters ?? estimatedDunVoters) : winner.winner_votes),
      last_majority: detail?.majority_votes ?? estimateMajority(detail?.registered_voters ?? estimatedDunVoters),
      corners: candidateAgg?.num_candidates ?? 0,
      winner_party: winner.winner_party,
      winner_votes: winner.winner_votes,
      runner_up_party: candidateAgg?.runner_up_party ?? "Tidak diketahui",
      runner_up_votes: candidateAgg?.runner_up_votes ?? 0,
      bn_votes: bnVotes ?? 0,
      bn_rank: bnRank,
      details_available: Boolean(detail),
      candidates_available: groupedCandidates.has(winner.dun_code),
      total_votes_cast: detail?.total_votes_cast,
      turnout_pct: detail?.turnout_pct,
      majority_votes: detail?.majority_votes,
      num_candidates: candidateAgg?.num_candidates ?? 0,
      bn_margin_to_win: candidateAgg?.bn_margin_to_win ?? null,
      bn_margin_defend: candidateAgg?.bn_margin_defend ?? null,
    };
  });

  const baselineByParlimen = new Map<string, Seat[]>();
  dunSeats.forEach((row) => {
    const current = baselineByParlimen.get(row.parlimen_code) ?? [];
    current.push(row);
    baselineByParlimen.set(row.parlimen_code, current);
  });

  const allParlimenCodes = new Set([...parlimenRows.map((row) => row.parlimen_code), ...dunSeats.map((row) => row.parlimen_code)]);

  const parlimenSeats: Seat[] = [...allParlimenCodes].map((parlimenCode) => {
    const parlimen = parlimenByCode.get(parlimenCode);
    const parlimenRowsForSeat = baselineByParlimen.get(parlimenCode) ?? [];
    const totalByParty = new Map<string, number>();
    parlimenRowsForSeat.forEach((item) => {
      totalByParty.set(item.winner_party, (totalByParty.get(item.winner_party) ?? 0) + item.winner_votes);
    });

    const winnerPartyEntry = [...totalByParty.entries()].sort((a, b) => b[1] - a[1])[0];
    const winnerParty = winnerPartyEntry?.[0] ?? "Tidak diketahui";
    const winnerVotes = winnerPartyEntry?.[1] ?? 0;
    const bnVotes = parlimenRowsForSeat.reduce((acc, row) => acc + row.bn_votes, 0);
    const opponentVotes = [...totalByParty.entries()].filter(([party]) => party !== "BN").sort((a, b) => b[1] - a[1])[0]?.[1] ?? 0;

    return {
      seat_id: parlimenCode,
      seat_name: `${parlimenCode} ${parlimen?.parlimen_name ?? "Parlimen Tidak Diketahui"}`,
      state: "Sabah",
      grain: "parlimen",
      parlimen_code: parlimenCode,
      parlimen_name: parlimen?.parlimen_name ?? "Parlimen Tidak Diketahui",
      registered_voters: parlimen?.jumlah_pemilih ?? 0,
      registered_voters_estimated: !parlimen,
      last_opponent_top_votes: opponentVotes || estimateOpponentVotes(parlimen?.jumlah_pemilih ?? 0),
      last_majority: Math.abs(bnVotes - opponentVotes) || estimateMajority(parlimen?.jumlah_pemilih ?? 0),
      corners: 3,
      winner_party: winnerParty,
      winner_votes: winnerVotes,
      runner_up_party: winnerParty === "BN" ? "Gabungan lawan" : "BN",
      runner_up_votes: winnerParty === "BN" ? opponentVotes : bnVotes,
      bn_votes: bnVotes,
      bn_rank: bnVotes >= winnerVotes ? 1 : 2,
    };
  });

  return {
    seats: [...parlimenSeats, ...dunSeats],
    candidateByDun: groupedCandidates,
    detailCoverage: dunSeats.filter((seat) => seat.details_available).length,
    candidateCoverage: dunSeats.filter((seat) => seat.candidates_available).length,
    duplicateDetails,
  };
};

export const loadProgress = async () => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/progress_weekly.csv`);
  const text = await response.text();
  const records = parseCsv(text);
  return records.map(
    (record) =>
      ({
        week_start: record.week_start,
        seat_id: record.seat_id,
        base_votes: toNumber(record.base_votes),
        persuasion_votes: toNumber(record.persuasion_votes),
        gotv_votes: toNumber(record.gotv_votes),
        persuadables: toNumber(record.persuadables),
        conversion_rate: toNumber(record.conversion_rate),
      }) satisfies ProgressRow
  );
};

export const loadAssumptions = async () => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/assumptions.json`);
  return (await response.json()) as Assumptions;
};

export const loadThresholds = async () => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/thresholds.json`);
  return (await response.json()) as ThresholdConfig;
};
