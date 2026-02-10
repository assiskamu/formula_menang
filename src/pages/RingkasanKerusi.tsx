import { useMemo } from "react";
import Badge from "../components/Badge";
import InfoTooltip from "../components/InfoTooltip";
import KpiCard from "../components/KpiCard";
import { useDashboard } from "../data/dashboard";
import { formatNumber, formatPercent } from "../utils/format";

const toneFromMetric = (risk: string | null, target: string | null) => {
  if (risk === "risiko_tinggi") return "danger" as const;
  if (risk === "risiko_sederhana") return "warn" as const;
  if (risk === "risiko_rendah") return "ok" as const;
  if (target === "dekat") return "ok" as const;
  if (target === "sederhana") return "warn" as const;
  return "neutral" as const;
};

const partyColor = (party: string) => {
  const palette: Record<string, string> = {
    BN: "#1d4ed8",
    PH: "#f97316",
    GRS: "#0f766e",
    WARISAN: "#9333ea",
    KDM: "#be123c",
    BEBAS: "#374151",
  };
  return palette[party.toUpperCase()] ?? "#6b7280";
};

const availabilityBadge = (details?: boolean, candidates?: boolean) => {
  if (details && candidates) return { label: "Lengkap", tone: "ok" as const };
  if (details || candidates) return { label: "Sebahagian", tone: "warn" as const };
  return { label: "Tiada", tone: "neutral" as const };
};

const SectionHeader = ({ icon, title, tone = "blue" }: { icon: string; title: string; tone?: "blue" | "purple" | "amber" | "indigo" | "teal" }) => (
  <div className={`section-header section-${tone}`}>
    <span aria-hidden="true" className="section-icon">{icon}</span>
    <h3>{title}</h3>
  </div>
);

const actionTone = (action: string) => {
  const normalized = action.toLowerCase();
  if (normalized.includes("gotv")) return "action-gotv";
  if (normalized.includes("persuasion")) return "action-persuasion";
  if (normalized.includes("base")) return "action-base";
  return "action-neutral";
};

const RingkasanKerusi = () => {
  const { metrics, filteredMetrics, setGrain, grain, dataWarnings, dataSummary, filters, setFilters, candidatesByDun } = useDashboard();
  const dunMetrics = useMemo(() => metrics.filter((m) => m.seat.grain === "dun"), [metrics]);
  const bnSeatsWon = useMemo(() => dunMetrics.filter((m) => m.seat.winner_party === "BN"), [dunMetrics]);
  const defendSeats = bnSeatsWon;
  const attackSeats = useMemo(() => dunMetrics.filter((m) => m.seat.bn_rank !== 1), [dunMetrics]);
  const targetSeats = Math.max(0, 73 - defendSeats.length);
  const topNear = useMemo(() => attackSeats.filter((m) => m.targetLevel === "dekat").sort((a, b) => a.bnMarginToWin - b.bnMarginToWin).slice(0, 10), [attackSeats]);
  const topRisk = useMemo(() => [...defendSeats].sort((a, b) => a.bnBufferToLose - b.bnBufferToLose).slice(0, 10), [defendSeats]);
  const defendRisk500 = useMemo(() => defendSeats.filter((m) => (m.seat.majority_votes ?? m.seat.last_majority ?? 0) < 500).length, [defendSeats]);
  const defendRisk1000 = useMemo(() => defendSeats.filter((m) => (m.seat.majority_votes ?? m.seat.last_majority ?? 0) < 1000).length, [defendSeats]);

  const selectedDunMetric = useMemo(() => {
    if (filters.dun) return dunMetrics.find((m) => m.seat.dun_code === filters.dun) ?? null;
    return filteredMetrics.find((m) => m.seat.grain === "dun") ?? dunMetrics[0] ?? null;
  }, [dunMetrics, filteredMetrics, filters.dun]);

  const selectedCandidates = useMemo(() => {
    if (!selectedDunMetric?.seat.dun_code) return [];
    return [...(candidatesByDun.get(selectedDunMetric.seat.dun_code) ?? [])].sort((a, b) => b.votes - a.votes);
  }, [candidatesByDun, selectedDunMetric]);

  const marginMax = useMemo(() => Math.max(1, ...filteredMetrics.map((metric) => metric.seat.bn_rank === 1 ? (metric.seat.bn_margin_defend ?? metric.bnBufferToLose) : (metric.seat.bn_margin_to_win ?? metric.bnMarginToWin))), [filteredMetrics]);
  const majorityMax = useMemo(() => Math.max(1, ...filteredMetrics.map((metric) => metric.seat.majority_votes ?? metric.seat.last_majority ?? 0)), [filteredMetrics]);

  return (
    <section className="stack">
      <div className="card">
        <h2>Ringkasan BN War Room</h2>
        <p className="muted">Pantau kerusi defend & sasaran dengan tag risiko/prioriti yang boleh dilaras di panel Tetapan.</p>
        <div className="segmented" style={{ marginTop: 12 }}>
          <button type="button" className={grain === "parlimen" ? "active" : ""} onClick={() => setGrain("parlimen")}>Parlimen</button>
          <button type="button" className={grain === "dun" ? "active" : ""} onClick={() => setGrain("dun")}>DUN</button>
        </div>
      </div>

      <div className="grid grid-kpi">
        <KpiCard label="BN Seats Won" value={formatNumber(bnSeatsWon.length)} helper="Bilangan DUN dimenangi BN" tooltip={{ maksud: "Bilangan DUN yang BN menang.", formula: "kira(winner_party = 'BN')", contoh: "Jika 6 DUN BN menang, nilai = 6" }} />
        <KpiCard label="Defend Seats" value={formatNumber(defendSeats.length)} helper="Kerusi BN yang perlu dipertahankan" tooltip={{ maksud: "Kerusi yang perlu dipertahankan BN.", formula: "Sama seperti BN Seats Won", contoh: "25 kerusi menang = 25 defend" }} />
        <KpiCard label="Target Seats" value={formatNumber(targetSeats)} helper="Kerusi yang perlu dirampas BN" tooltip={{ maksud: "Kerusi BN belum menang dan perlu diserang.", formula: "73 - Defend Seats", contoh: "73 - 6 = 67" }} />
        <KpiCard label="Defend Risk" value={`${formatNumber(defendRisk500)} / ${formatNumber(defendRisk1000)}`} helper="Majoriti <500 / <1000" tooltip={{ maksud: "Bilangan kerusi BN berisiko mengikut julat majoriti.", formula: "kira(majority<500) dan kira(majority<1000)", contoh: "3 kerusi <500, 9 kerusi <1000 => 3 / 9" }} />
      </div>

      <div className="card">
        <SectionHeader icon="🧭" title="Ringkasan" tone="blue" />
        <p className="muted">Sumber data: {dataSummary.sourceFile}</p>
        <p className="muted">Total DUN: {formatNumber(dataSummary.totalDun)} · BN Wins: {formatNumber(dataSummary.bnWins)} · Non-BN Wins: {formatNumber(dataSummary.nonBnWins)}</p>
        {dataWarnings.map((warning) => (
          <p key={warning} style={{ color: "#b45309", fontWeight: 600 }}>{warning}</p>
        ))}
      </div>

      <div className="grid two-col">
        <div className="card">
          <SectionHeader icon="🎯" title="Top Sasaran" tone="purple" />
          {topNear.length > 0 ? (
            <ol className="priority-list">
              {topNear.map((m) => (
                <li key={m.seat.seat_id}>
                  <strong>{m.seat.seat_name}</strong>
                  <span>Perlu +{formatNumber(m.bnMarginToWin)} undi ({formatPercent(m.bnMarginToWinPct)})</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty-state">
              <p>Tiada sasaran dekat untuk paparan semasa. Ini biasanya berlaku kerana semua kerusi dalam skop filter adalah defend atau sasaran sederhana/jauh.</p>
              <button type="button" onClick={() => setFilters((prev) => ({ ...prev, parlimen: "", dun: "" }))}>Reset Filter</button>
            </div>
          )}
        </div>
        <div className="card">
          <SectionHeader icon="🛡️" title="Top Risiko" tone="amber" />
          <ol className="priority-list">
            {topRisk.map((m) => (
              <li key={m.seat.seat_id}>
                <strong>{m.seat.seat_name}</strong>
                <span>Buffer BN {formatNumber(m.bnBufferToLose)} undi</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card">
        <SectionHeader icon="📊" title="Jadual Kerusi" tone="indigo" />
        <div className="table-legend" role="note" aria-label="Legend indikator jadual">
          <span><strong>Buffer BN</strong>: beza BN dengan pencabar jika BN menang.</span>
          <span><strong>Margin to Win</strong>: tambahan undi diperlukan jika BN kalah.</span>
          <span><strong>Majority</strong>: beza undi pemenang dengan tempat kedua.</span>
          <span><strong>Turnout</strong>: keluar mengundi berbanding pengundi berdaftar.</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>DUN</th>
                <th>Ketersediaan</th>
                <th>Status BN <InfoTooltip label="Status BN" maksud="Tag defend/sasaran berdasarkan threshold." formula="rule defend atau attack" contoh="Margin 400 => Sasaran Dekat" /></th>
                <th>Lawan Utama <InfoTooltip label="Runner-up" maksud="Pihak di tempat kedua berdasarkan undi calon." formula="Susun ikut votes desc, ambil ke-2" contoh="5,100 BN, 4,900 PH => runner-up PH" /></th>
                <th>BN margin to win/defend <InfoTooltip label="BN margin" maksud="Jika BN kalah: undi tambahan untuk menang. Jika BN menang: beza dengan runner-up." formula="To win=(top-bn+1), Defend=(bn-runnerup)" contoh="Kalah 4,800 vs 5,000 => 201" /></th>
                <th>Majority <InfoTooltip label="Majority" maksud="Beza undi pemenang dan calon kedua." formula="winner_votes - runner_up_votes" contoh="5,100-4,900=200" /></th>
                <th>Cadangan Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((metric) => {
                const availability = availabilityBadge(metric.seat.details_available, metric.seat.candidates_available);
                const marginValue = metric.seat.bn_rank === 1 ? (metric.seat.bn_margin_defend ?? metric.bnBufferToLose) : (metric.seat.bn_margin_to_win ?? metric.bnMarginToWin);
                const majorityValue = metric.seat.majority_votes ?? metric.seat.last_majority ?? 0;
                const turnoutValue = (metric.seat.turnout_pct ?? 0) / 100;
                return (
                  <tr key={metric.seat.seat_id}>
                    <td>{metric.seat.seat_name}</td>
                    <td className="flag-cell"><Badge label={availability.label} tone={availability.tone} /></td>
                    <td className="flag-cell"><Badge label={metric.bnStatusTag} tone={toneFromMetric(metric.riskLevel, metric.targetLevel)} /></td>
                    <td>{metric.mainOpponentParty}</td>
                    <td>
                      <div className="metric-cell">
                        <span>{formatNumber(marginValue)}</span>
                        <div className={`mini-meter ${metric.seat.bn_rank === 1 ? "meter-defend" : "meter-attack"}`}><span style={{ width: `${Math.min(100, (marginValue / marginMax) * 100)}%` }} /></div>
                      </div>
                    </td>
                    <td>
                      <div className="metric-cell">
                        <span>{formatNumber(majorityValue)}</span>
                        <div className="mini-meter meter-majority"><span style={{ width: `${Math.min(100, (majorityValue / majorityMax) * 100)}%` }} /></div>
                        <small className="muted">Turnout {formatPercent(turnoutValue)}</small>
                      </div>
                    </td>
                    <td className="flag-cell"><span className={`action-chip ${actionTone(metric.cadanganTindakan)}`}>{metric.cadanganTindakan}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDunMetric && (
        <div className="card">
          <SectionHeader icon="🗺️" title={`Butiran DUN: ${selectedDunMetric.seat.seat_name}`} tone="teal" />
          <p>
            Pemenang master: <strong>{selectedDunMetric.seat.winner_name ?? "-"}</strong> ({selectedDunMetric.seat.winner_party}) — {formatNumber(selectedDunMetric.seat.winner_votes)} undi.
          </p>

          {selectedDunMetric.seat.details_available ? (
            <div className="detail-stats">
              <p>Registered Voters <InfoTooltip label="Registered Voters" maksud="Bilangan pengundi berdaftar dalam DUN." formula="Data rasmi berdaftar" contoh="15,896" />: <strong>{formatNumber(selectedDunMetric.seat.registered_voters)}</strong></p>
              <p>Total Votes Cast: <strong>{formatNumber(selectedDunMetric.seat.total_votes_cast ?? 0)}</strong></p>
              <p>Turnout% <InfoTooltip label="Turnout%" maksud="Peratus keluar mengundi dari pengundi berdaftar." formula="total_votes_cast / registered_voters" contoh="11,891/15,896=74.8%" />: <strong>{formatPercent((selectedDunMetric.seat.turnout_pct ?? 0) / 100)}</strong></p>
              <p>Majority <InfoTooltip label="Majority" maksud="Beza undi pemenang dengan calon kedua." formula="winner - runner_up" contoh="1,070" />: <strong>{formatNumber(selectedDunMetric.seat.majority_votes ?? 0)}</strong></p>
            </div>
          ) : (
            <p className="muted">Data turnout/berdaftar/majoriti belum tersedia untuk DUN ini.</p>
          )}

          {selectedDunMetric.seat.candidates_available ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Calon</th>
                    <th>Parti</th>
                    <th>Undi</th>
                    <th>% Undi</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCandidates.map((candidate) => (
                    <tr key={`${candidate.dun_code}-${candidate.candidate_name}-${candidate.party}`} className={candidate.party === "BN" ? "bn-highlight" : ""}>
                      <td>{candidate.candidate_name}</td>
                      <td><span className="party-pill" style={{ backgroundColor: partyColor(candidate.party) }}>{candidate.party || "Tidak diketahui"}</span></td>
                      <td>{formatNumber(candidate.votes)}</td>
                      <td>{formatPercent(candidate.vote_share_pct / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Candidate breakdown not available.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default RingkasanKerusi;
