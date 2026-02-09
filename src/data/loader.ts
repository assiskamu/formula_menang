import type { Assumptions, ProgressRow, Seat } from "./types";

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

export const loadSeats = async () => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/seats.csv`);
  const text = await response.text();
  const records = parseCsv(text);
  return records.map(
    (record) =>
      ({
        seat_id: record.seat_id,
        seat_name: record.seat_name,
        state: record.state,
        registered_voters: toNumber(record.registered_voters),
        last_opponent_top_votes: toNumber(record.last_opponent_top_votes),
        last_majority: toNumber(record.last_majority),
        corners: toNumber(record.corners),
      }) satisfies Seat
  );
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
