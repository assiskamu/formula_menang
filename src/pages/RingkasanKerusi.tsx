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

const RingkasanKerusi = () => {
  const { metrics, filteredMetrics, setGrain, grain, dataWarnings, dataSummary } = useDashboard();
  const dunMetrics = useMemo(() => metrics.filter((m) => m.seat.grain === "dun"), [metrics]);
  const bnSeatsWon = useMemo(() => dunMetrics.filter((m) => m.seat.winner_party === "BN"), [dunMetrics]);
  const defendSeats = bnSeatsWon;
  const attackSeats = useMemo(() => dunMetrics.filter((m) => m.seat.bn_rank !== 1), [dunMetrics]);
  const targetSeats = Math.max(0, 73 - defendSeats.length);
  const topNear = useMemo(() => attackSeats.filter((m) => m.targetLevel === "dekat").sort((a, b) => a.bnMarginToWin - b.bnMarginToWin).slice(0, 10), [attackSeats]);
  const topRisk = useMemo(() => [...defendSeats].sort((a, b) => a.bnBufferToLose - b.bnBufferToLose).slice(0, 10), [defendSeats]);

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
        <KpiCard label="BN Seats Won" value={formatNumber(bnSeatsWon.length)} tooltip={{ maksud: "Bilangan DUN yang BN menang secara ketat.", formula: "kira(winner_party = 'BN')", contoh: "Jika 6 DUN BN menang, nilai = 6" }} />
        <KpiCard label="Defend Seats" value={formatNumber(defendSeats.length)} tooltip={{ maksud: "Kerusi yang perlu dipertahankan BN.", formula: "Sama seperti BN Seats Won", contoh: "25 kerusi menang = 25 defend" }} />
        <KpiCard label="Target Seats" value={formatNumber(targetSeats)} tooltip={{ maksud: "Kerusi BN belum menang dan perlu diserang.", formula: "73 - Defend Seats", contoh: "73 - 6 = 67" }} />
      </div>

      <div className="card">
        <p className="muted">Sumber data: {dataSummary.sourceFile}</p>
        <p className="muted">Total DUN: {formatNumber(dataSummary.totalDun)} · BN Wins: {formatNumber(dataSummary.bnWins)} · Non-BN Wins: {formatNumber(dataSummary.nonBnWins)}</p>
        {dataWarnings.map((warning) => (
          <p key={warning} style={{ color: "#f59e0b", fontWeight: 600 }}>{warning}</p>
        ))}
      </div>

      <div className="grid two-col">
        <div className="card">
          <h3>Top 10 Sasaran Dekat</h3>
          <ol className="priority-list">
            {topNear.map((m) => (
              <li key={m.seat.seat_id}>
                <strong>{m.seat.seat_name}</strong>
                <span>Perlu +{formatNumber(m.bnMarginToWin)} undi ({formatPercent(m.bnMarginToWinPct)})</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h3>Top 10 Paling Berisiko</h3>
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
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>DUN</th>
                <th>Status BN <InfoTooltip label="Status BN" maksud="Tag defend/sasaran berdasarkan threshold." formula="rule defend atau attack" contoh="Margin 400 => Sasaran Dekat" /></th>
                <th>Lawan Utama</th>
                <th>BN_MarginToWin <InfoTooltip label="BN_MarginToWin" maksud="Undi tambahan minimum BN jika belum menang." formula="(winner_votes - bn_votes) + 1" contoh="5,000 - 4,650 +1 = 351" /></th>
                <th>BN_BufferToLose <InfoTooltip label="BN_BufferToLose" maksud="Berapa undi masih boleh bocor sebelum BN kalah." formula="(bn_votes - runner_up_votes) - 1" contoh="5,200 - 5,000 -1 = 199" /></th>
                <th>Majority% <InfoTooltip label="Majority%" maksud="Kekuatan majoriti BN berbanding undi sah." formula="majority_votes / ValidVotes" contoh="600/30,000 = 2%" /></th>
                <th>Cadangan Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((metric) => (
                <tr key={metric.seat.seat_id}>
                  <td>{metric.seat.seat_name}</td>
                  <td className="flag-cell"><Badge label={metric.bnStatusTag} tone={toneFromMetric(metric.riskLevel, metric.targetLevel)} /></td>
                  <td>{metric.mainOpponentParty}</td>
                  <td>{formatNumber(metric.bnMarginToWin)}</td>
                  <td>{formatNumber(metric.bnBufferToLose)}</td>
                  <td>{formatPercent(metric.majorityPct)}</td>
                  <td className="flag-cell"><Badge label={metric.cadanganTindakan} tone="info" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default RingkasanKerusi;
