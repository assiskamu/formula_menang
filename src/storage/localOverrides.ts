import type { LocalOverrides } from "../data/types";

const STORAGE_KEY = "formula-menang-local-overrides-v1";

const defaultOverrides = (): LocalOverrides => ({
  version: 1,
  updatedAtISO: new Date().toISOString(),
  seatDetails: {},
  candidates: {},
});

const sanitizeNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const sanitize = (raw: unknown): LocalOverrides => {
  if (!raw || typeof raw !== "object") return defaultOverrides();
  const data = raw as Partial<LocalOverrides>;

  const seatDetails = Object.fromEntries(
    Object.entries(data.seatDetails ?? {}).map(([dunCode, seat]) => {
      const detail = seat ?? {};
      return [
        dunCode,
        {
          registered_voters: sanitizeNumber(detail.registered_voters),
          total_votes_cast: sanitizeNumber(detail.total_votes_cast),
          turnout_pct: sanitizeNumber(detail.turnout_pct),
          majority_votes: sanitizeNumber(detail.majority_votes),
        },
      ];
    })
  );

  const candidates = Object.fromEntries(
    Object.entries(data.candidates ?? {}).map(([dunCode, rows]) => {
      const sanitizedRows = (Array.isArray(rows) ? rows : [])
        .map((candidate) => ({
          candidate_name: `${candidate.candidate_name ?? ""}`.trim(),
          party: `${candidate.party ?? ""}`.trim(),
          votes: Number.isFinite(Number(candidate.votes)) ? Math.trunc(Number(candidate.votes)) : 0,
          vote_share_pct: sanitizeNumber(candidate.vote_share_pct),
        }))
        .filter((candidate) => candidate.candidate_name || candidate.party || candidate.votes > 0);
      return [dunCode, sanitizedRows];
    })
  );

  return {
    version: 1,
    updatedAtISO: typeof data.updatedAtISO === "string" ? data.updatedAtISO : new Date().toISOString(),
    seatDetails,
    candidates,
  };
};

export const loadOverrides = (): LocalOverrides => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultOverrides();
    return sanitize(JSON.parse(raw));
  } catch {
    return defaultOverrides();
  }
};

export const saveOverrides = (overrides: LocalOverrides) => {
  const payload = sanitize({ ...overrides, updatedAtISO: new Date().toISOString(), version: 1 });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
};

export const clearOverrides = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const mergeOverrides = (current: LocalOverrides, incoming: Partial<LocalOverrides>, mode: "merge" | "replace") => {
  const sanitizedIncoming = sanitize({ ...incoming, version: 1 });
  if (mode === "replace") return saveOverrides(sanitizedIncoming);

  return saveOverrides({
    version: 1,
    updatedAtISO: new Date().toISOString(),
    seatDetails: {
      ...current.seatDetails,
      ...sanitizedIncoming.seatDetails,
    },
    candidates: {
      ...current.candidates,
      ...sanitizedIncoming.candidates,
    },
  });
};

export const exportOverrides = (overrides: LocalOverrides) => JSON.stringify(overrides, null, 2);

export { STORAGE_KEY };
