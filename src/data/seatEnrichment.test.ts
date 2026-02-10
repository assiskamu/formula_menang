import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { aggregateCandidateRows } from "./seatEnrichment";
import type { CandidateRow } from "./types";

const parseCsv = (csv: string) => {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim());
  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
};

describe("seat details and candidate enrichment", () => {
  it("keeps seat details dun_code unique", () => {
    const csvText = readFileSync(resolve(process.cwd(), "data/seat_details_enriched_v3.csv"), "utf8");
    const records = parseCsv(csvText);
    const counts = new Map<string, number>();
    records.forEach((record) => counts.set(record.dun_code, (counts.get(record.dun_code) ?? 0) + 1));
    const duplicates = [...counts.entries()].filter(([, count]) => count > 1).map(([dun]) => dun);
    expect(duplicates).toEqual([]);
  });

  it("handles missing candidate rows without throwing", () => {
    const result = aggregateCandidateRows([]);
    expect(result.groupedCandidates.size).toBe(0);
    expect(result.aggregates.size).toBe(0);
  });

  it("computes BN margins for absent and tie edge cases", () => {
    const rows: CandidateRow[] = [
      { dun_code: "N.X", dun_name: "Test", candidate_name: "A", party: "PH", votes: 1000, vote_share_pct: 50 },
      { dun_code: "N.X", dun_name: "Test", candidate_name: "B", party: "GRS", votes: 1000, vote_share_pct: 50 },
      { dun_code: "N.Y", dun_name: "Test2", candidate_name: "A", party: "BN", votes: 1200, vote_share_pct: 50 },
      { dun_code: "N.Y", dun_name: "Test2", candidate_name: "B", party: "PH", votes: 1200, vote_share_pct: 50 },
    ];
    const { aggregates } = aggregateCandidateRows(rows);

    expect(aggregates.get("N.X")?.bn_votes).toBeNull();
    expect(aggregates.get("N.X")?.bn_rank).toBeNull();
    expect(aggregates.get("N.X")?.bn_margin_to_win).toBeNull();

    expect(aggregates.get("N.Y")?.bn_rank).toBe(1);
    expect(aggregates.get("N.Y")?.bn_margin_defend).toBe(0);
  });
});
