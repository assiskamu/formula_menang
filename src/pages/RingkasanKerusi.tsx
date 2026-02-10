import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../components/Badge";
import InfoTooltip from "../components/InfoTooltip";
import KpiCard from "../components/KpiCard";
import { useDashboard } from "../data/dashboard";
import type { SeatMetrics } from "../data/types";
import { actionTagGuides, getActionTagsFromText, type ActionTag } from "../data/actionTags";
import { formatNumber, formatPercent } from "../utils/format";

const scenarioLabel: Record<string, string> = { low: "Rendah", base: "Sederhana", high: "Tinggi" };
const focusStorageKey = "formula-menang-focus-seats-v1";

type QuickChip = "defendRapuh" | "sasaranDekat" | "turnoutRendah" | "calonAda" | "bnMenang" | "bnKalah" | "dataLengkap";

const chipLabels: Record<QuickChip, string> = {
  defendRapuh: "Defend Rapuh",
  sasaranDekat: "Sasaran Dekat",
  turnoutRendah: "Turnout Rendah",
  calonAda: "Data Calon Ada",
  bnMenang: "BN Menang",
  bnKalah: "BN Kalah",
  dataLengkap: "Data Lengkap",
};

const toneFromMetric = (risk: string | null, target: string | null) => {
  if (risk === "risiko_tinggi") return "danger" as const;
  if (risk === "risiko_sederhana") return "warn" as const;
  if (risk === "risiko_rendah") return "ok" as const;
  if (target === "dekat") return "ok" as const;
  if (target === "sederhana") return "warn" as const;
  return "neutral" as const;
};

const actionTone = (action: string) => {
  const normalized = action.toLowerCase();
  if (normalized.includes("gotv")) return "action-gotv";
  if (normalized.includes("persuasion")) return "action-persuasion";
  if (normalized.includes("base")) return "action-base";
  return "action-neutral";
};

const partyColor = (party: string) => ({ BN: "#1d4ed8", PH: "#f97316", GRS: "#0f766e" }[party.toUpperCase()] ?? "#6b7280");

const formatTurnout = (value?: number | null) => {
  if (typeof value !== "number") return "—";
  return formatPercent(value / 100);
};

const availabilityBadge = (details?: boolean, candidates?: boolean) => {
  if (details && candidates) return { label: "Lengkap", tone: "ok" as const };
  if (details || candidates) return { label: "Sebahagian", tone: "warn" as const };
  return { label: "Tiada", tone: "neutral" as const };
};

const confidenceMeta = (metric: SeatMetrics) => {
  const missing: string[] = [];
  if (!metric.seat.registered_voters) missing.push("pengundi berdaftar");
  if (typeof metric.seat.total_votes_cast !== "number") missing.push("jumlah undi");
  if (typeof metric.seat.turnout_pct !== "number") missing.push("turnout");
  if (typeof metric.seat.majority_votes !== "number" && typeof metric.seat.last_majority !== "number") missing.push("majoriti");
  if (!metric.seat.winner_party) missing.push("pemenang");
  if (missing.length === 0) return { label: "Lengkap", tone: "ok" as const, desc: "Data lengkap untuk kerusi ini." };
  if (missing.length <= 2 && metric.seat.winner_party && typeof metric.seat.turnout_pct === "number") return { label: "Separuh", tone: "warn" as const, desc: `Belum lengkap: ${missing.join(", ")}.` };
  return { label: "Minimum", tone: "neutral" as const, desc: `Data minimum sahaja. Belum ada: ${missing.join(", ")}.` };
};

const ActionTagChips = ({ text }: { text: string }) => {
  const tags = getActionTagsFromText(text);
  return (
    <span className="action-tags-inline">
      {tags.map((tag) => <span key={tag} className={`action-chip ${actionTone(tag)}`}>{tag}</span>)}
    </span>
  );
};

const RingkasanKerusi = () => {
  const { metrics, filteredMetrics, setGrain, grain, dataWarnings, dataSummary, filters, setFilters, thresholds, candidatesByDun } = useDashboard();
  const [mode, setMode] = useState<"ringkas" | "analitik">("ringkas");
  const [tableSearch, setTableSearch] = useState("");
  const [tableSort, setTableSort] = useState<"default" | "risk" | "target" | "turnout">("default");
  const [activeChips, setActiveChips] = useState<QuickChip[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showFocusPanel, setShowFocusPanel] = useState(false);
  const [focusedSeats, setFocusedSeats] = useState<string[]>([]);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const dunMetrics = useMemo(() => metrics.filter((m) => m.seat.grain === "dun"), [metrics]);
  const bnSeatsWon = useMemo(() => dunMetrics.filter((m) => m.seat.winner_party === "BN"), [dunMetrics]);
  const defendSeats = bnSeatsWon;
  const attackSeats = useMemo(() => dunMetrics.filter((m) => m.seat.bn_rank !== 1), [dunMetrics]);
  const targetSeats = Math.max(0, dunMetrics.length - defendSeats.length);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(focusStorageKey);
      if (saved) setFocusedSeats(JSON.parse(saved) as string[]);
    } catch {
      setFocusedSeats([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(focusStorageKey, JSON.stringify(focusedSeats));
  }, [focusedSeats]);

  const selectedDunMetric = useMemo(() => {
    if (filters.dun) return dunMetrics.find((m) => m.seat.dun_code === filters.dun) ?? null;
    return filteredMetrics.find((m) => m.seat.grain === "dun") ?? dunMetrics[0] ?? null;
  }, [dunMetrics, filteredMetrics, filters.dun]);

  const selectedCandidates = useMemo(() => {
    if (!selectedDunMetric?.seat.dun_code) return [];
    return [...(candidatesByDun.get(selectedDunMetric.seat.dun_code) ?? [])].sort((a, b) => b.votes - a.votes);
  }, [selectedDunMetric, candidatesByDun]);

  const applyTableFocus = () => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const topNear = useMemo(() => attackSeats.filter((m) => m.targetLevel === "dekat").sort((a, b) => a.bnMarginToWin - b.bnMarginToWin).slice(0, 10), [attackSeats]);
  const topRisk = useMemo(() => [...defendSeats].sort((a, b) => a.bnBufferToLose - b.bnBufferToLose).slice(0, 10), [defendSeats]);
  const todayPriorities = useMemo(() => ({
    target: topNear[0] ?? null,
    risk: topRisk[0] ?? null,
    lowTurnout: [...filteredMetrics].filter((m) => typeof m.seat.turnout_pct === "number").sort((a, b) => (a.seat.turnout_pct ?? 0) - (b.seat.turnout_pct ?? 0))[0] ?? null,
  }), [filteredMetrics, topNear, topRisk]);

  const chipPredicate = (metric: SeatMetrics, chip: QuickChip) => {
    const majority = metric.seat.majority_votes ?? metric.seat.last_majority ?? 0;
    if (chip === "defendRapuh") return metric.seat.winner_party === "BN" && majority < thresholds.defend.risiko_sederhana.majority_votes;
    if (chip === "sasaranDekat") return metric.seat.winner_party !== "BN" && metric.bnMarginToWin <= thresholds.attack.dekat.margin_votes;
    if (chip === "turnoutRendah") return typeof metric.seat.turnout_pct === "number" && metric.seat.turnout_pct < 60;
    if (chip === "calonAda") return Boolean(metric.seat.candidates_available);
    if (chip === "bnMenang") return metric.seat.winner_party === "BN";
    if (chip === "bnKalah") return metric.seat.winner_party !== "BN";
    return confidenceMeta(metric).label === "Lengkap";
  };

  const baseList = useMemo(() => filteredMetrics.filter((m) => m.seat.grain === "dun"), [filteredMetrics]);
  const filteredSeatList = useMemo(() => baseList.filter((metric) => activeChips.every((chip) => chipPredicate(metric, chip))), [activeChips, baseList]);

  const tableRows = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    const searched = filteredSeatList.filter((m) => {
      if (!query) return true;
      return [m.seat.seat_name, m.seat.parlimen_name, m.seat.winner_party].join(" ").toLowerCase().includes(query);
    });

    const sorted = [...searched];
    if (tableSort === "risk") sorted.sort((a, b) => (a.seat.majority_votes ?? a.seat.last_majority ?? Number.MAX_SAFE_INTEGER) - (b.seat.majority_votes ?? b.seat.last_majority ?? Number.MAX_SAFE_INTEGER));
    if (tableSort === "target") sorted.sort((a, b) => a.bnMarginToWin - b.bnMarginToWin);
    if (tableSort === "turnout") sorted.sort((a, b) => (a.seat.turnout_pct ?? Number.MAX_SAFE_INTEGER) - (b.seat.turnout_pct ?? Number.MAX_SAFE_INTEGER));
    return sorted;
  }, [filteredSeatList, tableSearch, tableSort]);

  const toggleChip = (chip: QuickChip) => {
    setActiveChips((prev) => prev.includes(chip) ? prev.filter((x) => x !== chip) : [...prev, chip]);
    applyTableFocus();
  };

  const applyPriorityFilter = (chips: QuickChip[]) => {
    setActiveChips(chips);
    applyTableFocus();
  };

  const copyRingkasan = async (metric = selectedDunMetric) => {
    if (!metric) return;
    const summary = [`*${metric.seat.seat_name}*`, `Status BN: ${metric.bnStatusTag}`, `Margin BN: ${formatNumber(metric.seat.bn_rank === 1 ? metric.bnBufferToLose : metric.bnMarginToWin)} undi`, `Majority: ${formatNumber(metric.seat.majority_votes ?? metric.seat.last_majority ?? 0)}`, `Turnout: ${formatTurnout(metric.seat.turnout_pct)}`, `Tindakan: ${metric.cadanganTindakan}`].join("\n");
    await navigator.clipboard.writeText(summary);
  };

  const toggleFocus = (metric: SeatMetrics) => {
    const key = metric.seat.seat_id;
    setFocusedSeats((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
  };

  const focusMetrics = useMemo(() => dunMetrics.filter((m) => focusedSeats.includes(m.seat.seat_id)), [dunMetrics, focusedSeats]);
  const exportFocusCsv = () => {
    const header = "seat_id,dun_code,dun_name,winner_party,majority,turnout\n";
    const rows = focusMetrics.map((m) => [m.seat.seat_id, m.seat.dun_code ?? "", m.seat.dun_name ?? "", m.seat.winner_party, String(m.seat.majority_votes ?? m.seat.last_majority ?? 0), String(m.seat.turnout_pct ?? "")].join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kerusi-fokus.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const viewLabel = grain === "dun" ? "DUN" : "Parlimen";
  const modeLabel = mode === "ringkas" ? "Ringkas" : "Analitik";
  const turnoutLabel = scenarioLabel[filters.turnoutScenario] ?? filters.turnoutScenario;
  const totalDun = dataSummary?.totalDun ?? 0;
  const lengkapCount = dunMetrics.filter((m) => confidenceMeta(m).label === "Lengkap").length;
  const calonCount = dunMetrics.filter((m) => m.seat?.candidates_available).length;
  const lengkapPct = totalDun > 0 ? Math.round((lengkapCount / totalDun) * 100) : 0;

  return (
    <section className="stack">
      <div className="card">
        <div className="title-row"><h2>Ringkasan BN War Room</h2><button type="button" onClick={() => setShowFocusPanel((p) => !p)}>Kerusi Fokus ⭐ ({focusMetrics.length})</button></div>
        <p className="data-inline-banner">
          Data: {formatNumber(totalDun)} DUN • Lengkap: {formatNumber(lengkapCount)} ({lengkapPct}%) • Calon: {formatNumber(calonCount)} • BN: {formatNumber(dataSummary?.bnWins ?? 0)}
        </p>
        <div className="segmented" style={{ marginTop: 10 }}><button type="button" className={grain === "parlimen" ? "active" : ""} onClick={() => setGrain("parlimen")}>Parlimen</button><button type="button" className={grain === "dun" ? "active" : ""} onClick={() => setGrain("dun")}>DUN</button></div>
        <div className="segmented" style={{ marginTop: 8 }}><button type="button" className={mode === "ringkas" ? "active" : ""} onClick={() => setMode("ringkas")}>Mode Ringkas</button><button type="button" className={mode === "analitik" ? "active" : ""} onClick={() => setMode("analitik")}>Mode Analitik</button></div>
        <p className="context-label">Paparan: {viewLabel} • {modeLabel} • Turnout {turnoutLabel}</p>
      </div>

      {showFocusPanel && <div className="card"><h3>Kerusi Fokus (War Room)</h3><div className="data-actions"><button type="button" onClick={exportFocusCsv} disabled={focusMetrics.length === 0}>Export Fokus</button></div>{focusMetrics.length === 0 ? <p className="muted">Belum ada kerusi fokus. Gunakan butang "Tambah ke Fokus ⭐" pada jadual.</p> : <ul className="priority-list">{focusMetrics.map((m) => <li key={m.seat.seat_id}><strong>{m.seat.seat_name}</strong><span>{m.bnStatusTag}</span><div className="data-actions"><button type="button" onClick={() => { setFilters((prev) => ({ ...prev, dun: m.seat.dun_code ?? "" })); setShowDetailSheet(true); }}>Buka butiran</button><button type="button" onClick={() => void copyRingkasan(m)}>Copy WhatsApp</button><button type="button" onClick={() => toggleFocus(m)}>Buang Fokus</button></div></li>)}</ul>}</div>}

      <div className="grid three-col compact-priority-grid">
        <article className="card compact-priority-card"><h4>Prioriti Hari Ini: Sasaran</h4>{todayPriorities.target ? <><p>Sasaran: {todayPriorities.target.seat.seat_name} • margin {formatNumber(todayPriorities.target.bnMarginToWin)}</p><p className="muted">Klik untuk tapis.</p><button type="button" onClick={() => applyPriorityFilter(["sasaranDekat", "bnKalah"])}>Tapis ke Jadual</button></> : <p className="muted">Tiada sasaran dekat. Cuba: Switch Target View / Longgarkan threshold.</p>}</article>
        <article className="card compact-priority-card"><h4>Prioriti Hari Ini: Defend</h4>{todayPriorities.risk ? <><p>Defend: {todayPriorities.risk.seat.seat_name} • buffer {formatNumber(todayPriorities.risk.bnBufferToLose)}</p><p className="muted">Klik untuk tapis.</p><button type="button" onClick={() => applyPriorityFilter(["defendRapuh", "bnMenang"])}>Tapis ke Jadual</button></> : <p className="muted">Tiada kerusi defend. Cuba tukar paparan DUN.</p>}</article>
        <article className="card compact-priority-card"><h4>Prioriti Hari Ini: Turnout</h4>{todayPriorities.lowTurnout ? <><p>{todayPriorities.lowTurnout.seat.seat_name} • turnout {formatTurnout(todayPriorities.lowTurnout.seat.turnout_pct)}</p><p className="muted">Klik untuk tapis.</p><button type="button" onClick={() => applyPriorityFilter(["turnoutRendah"])}>Tapis ke Jadual</button></> : <p className="muted">Tiada data turnout. Cuba: semak Kemas Kini Data.</p>}</article>
      </div>

      {mode === "analitik" && <div className="card"><div className="title-row"><h3 style={{ margin: 0 }}>Apa maksud tag ini?</h3><button type="button" onClick={() => setShowGuide((s) => !s)}>{showGuide ? "Tutup" : "Buka penerangan"}</button></div><p className="muted">BASE: kekalkan penyokong • PERSUASION: tarik atas pagar • GOTV: pastikan keluar mengundi</p>{showGuide && <div className="tag-guide-grid">{(["BASE", "PERSUASION", "GOTV"] as ActionTag[]).map((tag) => <article key={tag} className="tag-guide-mini"><h4>{tag}</h4><p>{actionTagGuides[tag].maksud}</p></article>)}</div>}</div>}

      <div className="grid grid-kpi">
        <KpiCard label="BN Seats Won" value={formatNumber(bnSeatsWon.length)} helper="Bilangan DUN dimenangi BN" />
        <KpiCard label="Defend Seats" value={formatNumber(defendSeats.length)} helper="Kerusi BN yang perlu dipertahankan" />
        <KpiCard label="Target Seats" value={formatNumber(targetSeats)} helper="Kerusi bukan BN untuk dirampas" tooltip={{ maksud: "Target = kerusi bukan BN (untuk dirampas). Jika BN menang 6/73, maka target 67.", formula: "Total kerusi - BN Seats Won", contoh: `${dunMetrics.length} - ${bnSeatsWon.length} = ${targetSeats}` }} />
        <KpiCard label="Amaran Data" value={formatNumber(dataWarnings.length)} helper="Isu integriti data" />
      </div>

      <div className="card" ref={tableRef}>
        <div className="title-row"><h3 style={{ margin: 0 }}>Jadual Kerusi</h3><button type="button" onClick={() => setShowLegend(true)}>Legend ℹ️</button></div>
        <div className="quick-chips" role="group" aria-label="Penapis pantas war room">{(Object.keys(chipLabels) as QuickChip[]).map((chip) => <button key={chip} type="button" className={activeChips.includes(chip) ? "chip-active" : ""} onClick={() => toggleChip(chip)}>{chipLabels[chip]}</button>)}{!!activeChips.length && <button type="button" onClick={() => setActiveChips([])}>Clear all</button>}</div>
        <div className="table-controls"><input type="search" value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Cari DUN / Parlimen / Parti" /><select value={tableSort} onChange={(e) => setTableSort(e.target.value as typeof tableSort)}><option value="default">Susun: Lalai</option><option value="risk">Risiko (majoriti kecil)</option><option value="target">Target (margin kecil)</option><option value="turnout">Turnout terendah</option></select></div>

        <div className="table-wrapper desktop-table-view"><table><thead><tr><th className="sticky-col">DUN</th><th>Status</th><th>Data</th><th>Margin BN</th><th>Majority</th><th>Turnout</th><th>Tindakan</th><th>Aksi</th></tr></thead><tbody>{tableRows.map((metric) => { const confidence = confidenceMeta(metric); const availability = availabilityBadge(metric.seat.details_available, metric.seat.candidates_available); const isFocus = focusedSeats.includes(metric.seat.seat_id); return <tr key={metric.seat.seat_id} className="interactive-row"><td className="sticky-col"><strong>{metric.seat.seat_name}</strong><p className="muted">{metric.seat.parlimen_name}</p></td><td><Badge label={metric.bnStatusTag} tone={toneFromMetric(metric.riskLevel, metric.targetLevel)} /></td><td><div className="metric-stack"><Badge label={availability.label} tone={availability.tone} /><InfoTooltip label={`Data confidence ${metric.seat.seat_name}`} maksud={confidence.desc} formula="Lengkap: turnout+majoriti+pemenang+daftar+undi" contoh="Minimum: data pemenang sahaja" /><Badge label={confidence.label} tone={confidence.tone} /></div></td><td>{formatNumber(metric.seat.bn_rank === 1 ? metric.bnBufferToLose : metric.bnMarginToWin)}</td><td>{formatNumber(metric.seat.majority_votes ?? metric.seat.last_majority ?? 0)}</td><td>{typeof metric.seat.turnout_pct === "number" ? formatPercent(metric.seat.turnout_pct / 100) : <span className="muted">— <small>Tiada data turnout</small></span>}</td><td><span className={`action-chip ${actionTone(metric.cadanganTindakan)}`}>{metric.cadanganTindakan}</span><ActionTagChips text={metric.cadanganTindakan} /></td><td><div className="data-actions"><button type="button" onClick={() => { setFilters((prev) => ({ ...prev, dun: metric.seat.dun_code ?? "" })); setShowDetailSheet(true); }}>Butiran</button><button type="button" onClick={() => toggleFocus(metric)}>{isFocus ? "Buang Fokus" : "Tambah ke Fokus ⭐"}</button></div></td></tr>; })}</tbody></table></div>

        <div className="mobile-card-list">{tableRows.map((metric) => { const turnout = metric.seat.turnout_pct; const confidence = confidenceMeta(metric); return <article key={metric.seat.seat_id} className="card seat-card" onClick={() => { setFilters((prev) => ({ ...prev, dun: metric.seat.dun_code ?? "" })); setShowDetailSheet(true); }}><h3>{metric.seat.seat_name}</h3><Badge label={metric.seat.winner_party === "BN" ? "BN Menang" : "Sasaran"} tone={metric.seat.winner_party === "BN" ? "ok" : "warn"} /><div className="detail-stats"><p>Buffer/Margin: <strong>{formatNumber(metric.seat.bn_rank === 1 ? metric.bnBufferToLose : metric.bnMarginToWin)}</strong></p><p>Majority: <strong>{formatNumber(metric.seat.majority_votes ?? metric.seat.last_majority ?? 0)}</strong></p><p>Turnout: <strong>{typeof turnout === "number" ? formatPercent(turnout / 100) : "—"}</strong></p><p>Data: <strong>{confidence.label}</strong></p></div><span className={`action-chip ${actionTone(metric.cadanganTindakan)}`}>{metric.cadanganTindakan}</span></article>; })}</div>
      </div>

      {showLegend && <div className="bottom-sheet-overlay" role="dialog" aria-modal="true" aria-label="Legend" onClick={() => setShowLegend(false)}><div className="bottom-sheet" onClick={(e) => e.stopPropagation()}><div className="bottom-sheet-header"><h2>Legend Jadual</h2><button type="button" onClick={() => setShowLegend(false)}>Tutup</button></div><ul><li><strong>Buffer BN:</strong> beza BN dengan pencabar jika BN menang.</li><li><strong>Margin to Win/Defend:</strong> undi tambahan untuk menang / buffer untuk kekal.</li><li><strong>Majority:</strong> beza undi pemenang dengan calon kedua.</li><li><strong>Turnout:</strong> peratus keluar mengundi.</li></ul></div></div>}

      {selectedDunMetric && showDetailSheet && <div className="bottom-sheet-overlay" role="dialog" aria-modal="true" aria-label="Butiran DUN" onClick={() => setShowDetailSheet(false)}><div className="bottom-sheet" onClick={(event) => event.stopPropagation()}><div className="bottom-sheet-header"><h2>{selectedDunMetric.seat.seat_name}</h2><button type="button" onClick={() => setShowDetailSheet(false)} aria-label="Tutup butiran">Tutup</button></div><p>Status BN: <strong>{selectedDunMetric.bnStatusTag}</strong></p><p>Turnout: <strong>{formatTurnout(selectedDunMetric.seat.turnout_pct)}</strong> {typeof selectedDunMetric.seat.turnout_pct !== "number" ? <span className="muted">(Data belum lengkap)</span> : null}</p><p>Cadangan: <strong>{selectedDunMetric.cadanganTindakan}</strong></p>{selectedDunMetric.seat.candidates_available && <div className="table-wrapper"><table><thead><tr><th>Calon</th><th>Parti</th><th>Undi</th></tr></thead><tbody>{selectedCandidates.map((candidate) => <tr key={`${candidate.dun_code}-${candidate.candidate_name}-${candidate.party}`}><td>{candidate.candidate_name}</td><td><span className="party-pill" style={{ backgroundColor: partyColor(candidate.party) }}>{candidate.party || "Tidak diketahui"}</span></td><td>{formatNumber(candidate.votes)}</td></tr>)}</tbody></table></div>}<button type="button" className="sticky-copy" onClick={() => void copyRingkasan()}>Copy ringkasan WhatsApp</button></div></div>}
    </section>
  );
};

export default RingkasanKerusi;
