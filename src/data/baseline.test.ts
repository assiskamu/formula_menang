import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EXPECTED_DUN_TOTAL, validateWinnersRows } from "./baseline";
import type { WinnersRow } from "./types";

const parseWinnersCsv = (csv: string): WinnersRow[] => {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    return {
      dun_code: row.dun_code,
      dun_name: row.dun_name,
      winner_name: row.winner_name,
      winner_party: row.winner_party,
      winner_votes: Number(row.winner_votes),
    };
  });
};

describe("PRN Sabah 2025 winners data integrity", () => {
  it("has exactly 73 DUN rows and no duplicate dun_code", () => {
    const csvText = readFileSync(resolve(process.cwd(), "data/prn_sabah_2025_winners.csv"), "utf8");
    const rows = parseWinnersCsv(csvText);

    const validation = validateWinnersRows(rows, "prn_sabah_2025_winners.csv");

    expect(validation.totalDun).toBe(EXPECTED_DUN_TOTAL);
    expect(validation.duplicateDunCodes).toEqual([]);
  });

  it("produces strict BN totals and target seats", () => {
    const csvText = readFileSync(resolve(process.cwd(), "data/prn_sabah_2025_winners.csv"), "utf8");
    const rows = parseWinnersCsv(csvText);

    const bnWins = rows.filter((row) => row.winner_party === "BN").length;
    const targetSeats = EXPECTED_DUN_TOTAL - bnWins;

    expect(bnWins).toBe(6);
    expect(targetSeats).toBe(67);
  });
});
