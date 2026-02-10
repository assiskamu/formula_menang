import type { Assumptions, DunRow, ParlimenRow, ProgressRow, PrnBaselineRow, Seat } from "./types";

const parseCsv = (csvText: string) => {
  const [headerLine, ...lines] = csvText.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((value) => value.trim());
  return lines
    .map((line) => line.split(",").map((value) => value.trim()))
    .filter((row) => row.length === headers.length)
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index]]))
    );
};

const toNumber = (value: string | number | undefined) =>
  value === undefined ? 0 : Number(value);

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

const estimateOpponentVotes = (registeredVoters: number) =>
  Math.round(registeredVoters * 0.34);

const estimateMajority = (registeredVoters: number) =>
  Math.max(300, Math.round(registeredVoters * 0.04));

export const loadPrnBaseline = async () => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/prn_sabah_baseline.csv`);
  const text = await response.text();
  const records = parseCsv(text);
  return records.map(
    (record) =>
      ({
        dun_code: record.dun_code,
        dun_name: record.dun_name,
        parlimen_code: record.parlimen_code,
        corners: toNumber(record.corners),
        winner_party: record.winner_party,
        winner_votes: toNumber(record.winner_votes),
        runner_up_party: record.runner_up_party,
        runner_up_votes: toNumber(record.runner_up_votes),
        bn_votes: toNumber(record.bn_votes),
        bn_rank: toNumber(record.bn_rank),
        majority: toNumber(record.majority),
      }) satisfies PrnBaselineRow
  );
};

export const buildSabahSeats = (parlimenRows: ParlimenRow[], dunRows: DunRow[], baselineRows: PrnBaselineRow[]): Seat[] => {
  const dunsByParlimen = new Map<string, DunRow[]>();
  dunRows.forEach((row) => {
    const current = dunsByParlimen.get(row.parlimen_code) ?? [];
    current.push(row);
    dunsByParlimen.set(row.parlimen_code, current);
  });

  const dunSeats: Seat[] = [];
  const parlimenSeats: Seat[] = [];
  const baselineByDun = new Map(baselineRows.map((row) => [row.dun_code, row]));

  parlimenRows.forEach((parlimen) => {
    const duns = dunsByParlimen.get(parlimen.parlimen_code) ?? [];
    const estimatedDunVoters = duns.length > 0 ? parlimen.jumlah_pemilih / duns.length : 0;

    const parlimenBaseline = duns
      .map((dun) => baselineByDun.get(dun.dun_code))
      .filter((item): item is PrnBaselineRow => Boolean(item));
    const totalByParty = new Map<string, number>();
    parlimenBaseline.forEach((item) => {
      totalByParty.set(item.winner_party, (totalByParty.get(item.winner_party) ?? 0) + item.winner_votes);
    });
    const winnerParty = [...totalByParty.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Tidak diketahui";
    const winnerVotes = [...totalByParty.entries()].sort((a, b) => b[1] - a[1])[0]?.[1] ?? 0;
    const bnVotes = parlimenBaseline.reduce((acc, row) => acc + row.bn_votes, 0);
    const opponentVotes = [...totalByParty.entries()]
      .filter(([party]) => party !== "BN")
      .sort((a, b) => b[1] - a[1])[0]?.[1] ?? 0;
    const parlimenSeat: Seat = {
      seat_id: parlimen.parlimen_code,
      seat_name: `${parlimen.parlimen_code} ${parlimen.parlimen_name}`,
      state: "Sabah",
      grain: "parlimen",
      parlimen_code: parlimen.parlimen_code,
      parlimen_name: parlimen.parlimen_name,
      registered_voters: parlimen.jumlah_pemilih,
      registered_voters_estimated: false,
      last_opponent_top_votes: opponentVotes || estimateOpponentVotes(parlimen.jumlah_pemilih),
      last_majority: Math.abs(bnVotes - opponentVotes) || estimateMajority(parlimen.jumlah_pemilih),
      corners: 3,
      winner_party: winnerParty,
      winner_votes: winnerVotes,
      runner_up_party: winnerParty === "BN" ? "Gabungan lawan" : "BN",
      runner_up_votes: winnerParty === "BN" ? opponentVotes : bnVotes,
      bn_votes: bnVotes,
      bn_rank: bnVotes >= winnerVotes ? 1 : 2,
    };
    parlimenSeats.push(parlimenSeat);

    duns.forEach((dun) => {
      const baseline = baselineByDun.get(dun.dun_code);
      dunSeats.push({
        seat_id: dun.dun_code,
        seat_name: `${dun.dun_code} ${dun.dun_name}`,
        state: "Sabah",
        grain: "dun",
        parlimen_code: dun.parlimen_code,
        parlimen_name: dun.parlimen_name,
        dun_code: dun.dun_code,
        dun_name: dun.dun_name,
        registered_voters: estimatedDunVoters,
        registered_voters_estimated: true,
        last_opponent_top_votes: baseline?.winner_party === "BN" ? baseline.runner_up_votes : baseline?.winner_votes ?? estimateOpponentVotes(estimatedDunVoters),
        last_majority: baseline?.majority ?? estimateMajority(estimatedDunVoters),
        corners: baseline?.corners ?? 3,
        winner_party: baseline?.winner_party ?? "Tidak diketahui",
        winner_votes: baseline?.winner_votes ?? 0,
        runner_up_party: baseline?.runner_up_party ?? "Tidak diketahui",
        runner_up_votes: baseline?.runner_up_votes ?? 0,
        bn_votes: baseline?.bn_votes ?? 0,
        bn_rank: baseline?.bn_rank ?? 3,
      });
    });
  });

  return [...parlimenSeats, ...dunSeats];
};

export const loadProgress = async () => {
  const response = await fetch(
    `${import.meta.env.BASE_URL}data/progress_weekly.csv`
  );
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
