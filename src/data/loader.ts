import type { Assumptions, DunRow, ParlimenRow, ProgressRow, Seat } from "./types";

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

export const buildSabahSeats = (parlimenRows: ParlimenRow[], dunRows: DunRow[]): Seat[] => {
  const dunsByParlimen = new Map<string, DunRow[]>();
  dunRows.forEach((row) => {
    const current = dunsByParlimen.get(row.parlimen_code) ?? [];
    current.push(row);
    dunsByParlimen.set(row.parlimen_code, current);
  });

  const dunSeats: Seat[] = [];
  const parlimenSeats: Seat[] = [];

  parlimenRows.forEach((parlimen) => {
    const duns = dunsByParlimen.get(parlimen.parlimen_code) ?? [];
    const estimatedDunVoters = duns.length > 0 ? parlimen.jumlah_pemilih / duns.length : 0;

    const parlimenSeat: Seat = {
      seat_id: parlimen.parlimen_code,
      seat_name: `${parlimen.parlimen_code} ${parlimen.parlimen_name}`,
      state: "Sabah",
      grain: "parlimen",
      parlimen_code: parlimen.parlimen_code,
      parlimen_name: parlimen.parlimen_name,
      registered_voters: parlimen.jumlah_pemilih,
      registered_voters_estimated: false,
      last_opponent_top_votes: estimateOpponentVotes(parlimen.jumlah_pemilih),
      last_majority: estimateMajority(parlimen.jumlah_pemilih),
      corners: 3,
    };
    parlimenSeats.push(parlimenSeat);

    duns.forEach((dun) => {
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
        last_opponent_top_votes: estimateOpponentVotes(estimatedDunVoters),
        last_majority: estimateMajority(estimatedDunVoters),
        corners: 3,
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
