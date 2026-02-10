import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSabahSeats } from "./loader";
import type { DunRow, ParlimenRow, WinnersRow } from "./types";

const parseCsv = (csv: string) => {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim());
  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
};

describe("buildSabahSeats", () => {
  it("keeps DUN seat table at 73 rows after left join", () => {
    const winners = parseCsv(readFileSync(resolve(process.cwd(), "data/prn_sabah_2025_winners.csv"), "utf8")).map(
      (row) =>
        ({
          dun_code: row.dun_code,
          dun_name: row.dun_name,
          winner_name: row.winner_name,
          winner_party: row.winner_party,
          winner_votes: Number(row.winner_votes),
        }) satisfies WinnersRow
    );

    const dunRows = parseCsv(readFileSync(resolve(process.cwd(), "data/dun_sabah.csv"), "utf8")).map(
      (row) =>
        ({
          parlimen_code: row.parlimen_code,
          parlimen_name: row.parlimen_name,
          dun_code: row.dun_code,
          dun_name: row.dun_name,
        }) satisfies DunRow
    );

    const parlimenRows = parseCsv(readFileSync(resolve(process.cwd(), "data/parlimen_sabah.csv"), "utf8")).map(
      (row) =>
        ({ parlimen_code: row.parlimen_code, parlimen_name: row.parlimen_name, jumlah_pemilih: Number(row.jumlah_pemilih) }) satisfies ParlimenRow
    );

    const built = buildSabahSeats(parlimenRows, dunRows, winners, [], []);
    expect(built.seats.filter((seat) => seat.grain === "dun")).toHaveLength(73);
  });
});
