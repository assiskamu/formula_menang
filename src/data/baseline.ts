import type { DunRow, PrnBaselineRow, WinnersRow } from "./types";

export const EXPECTED_DUN_TOTAL = 73;

export type BaselineValidation = {
  totalDun: number;
  duplicateDunCodes: string[];
  warnings: string[];
  sourceFile: string;
  bnWins: number;
  nonBnWins: number;
};

export const toPrnBaselineRows = (winnersRows: WinnersRow[], dunRows: DunRow[]): PrnBaselineRow[] => {
  const dunMappingByCode = new Map(dunRows.map((row) => [row.dun_code, row]));

  return winnersRows.map((row) => {
    const mappedDun = dunMappingByCode.get(row.dun_code);
    const winnerIsBn = row.winner_party === "BN";

    const flags: string[] = [];
    if (!mappedDun) flags.push("parlimen_unknown");

    return {
      dun_code: row.dun_code,
      dun_name: row.dun_name,
      parlimen_code: mappedDun?.parlimen_code ?? "parlimen_unknown",
      corners: 0,
      winner_party: row.winner_party,
      winner_votes: row.winner_votes,
      runner_up_party: "Tidak diketahui",
      runner_up_votes: 0,
      bn_votes: winnerIsBn ? row.winner_votes : 0,
      bn_rank: winnerIsBn ? 1 : 2,
      majority: 0,
      data_flags: flags,
    };
  });
};

export const validateWinnersRows = (rows: WinnersRow[], sourceFile: string): BaselineValidation => {
  const byDunCode = new Map<string, number>();
  rows.forEach((row) => {
    byDunCode.set(row.dun_code, (byDunCode.get(row.dun_code) ?? 0) + 1);
  });

  const duplicateDunCodes = [...byDunCode.entries()]
    .filter(([, count]) => count > 1)
    .map(([dunCode]) => dunCode)
    .sort((a, b) => a.localeCompare(b));

  const totalDun = rows.length;
  const bnWins = rows.filter((row) => row.winner_party === "BN").length;
  const nonBnWins = totalDun - bnWins;

  const warnings: string[] = [];
  if (totalDun !== EXPECTED_DUN_TOTAL) {
    warnings.push(`Data tidak lengkap: jumlah DUN = ${totalDun} (sepatutnya ${EXPECTED_DUN_TOTAL}).`);
  }
  if (duplicateDunCodes.length > 0) {
    warnings.push(`Kod DUN berganda dikesan: ${duplicateDunCodes.join(", ")}.`);
  }

  return {
    totalDun,
    duplicateDunCodes,
    warnings,
    sourceFile,
    bnWins,
    nonBnWins,
  };
};
