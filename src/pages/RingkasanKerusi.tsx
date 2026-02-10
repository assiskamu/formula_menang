import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import KpiCard from "../components/KpiCard";
import { useDashboard } from "../data/dashboard";
import { formatNumber } from "../utils/format";

type TabKey = "defend" | "attack" | "operations";

const RingkasanKerusi = () => {
  const { metrics } = useDashboard();
  const [tab, setTab] = useState<TabKey>("defend");

  const dunMetrics = useMemo(() => metrics.filter((m) => m.seat.grain === "dun"), [metrics]);
  const defendSeats = useMemo(() => dunMetrics.filter((m) => m.seat.bn_rank === 1), [dunMetrics]);
  const attackSeats = useMemo(() => dunMetrics.filter((m) => m.seat.bn_rank > 1), [dunMetrics]);

  const topNear = useMemo(
    () => attackSeats.filter((m) => m.bnStatusTag === "Sasaran Dekat").sort((a, b) => a.bnMarginToWin - b.bnMarginToWin).slice(0, 10),
    [attackSeats]
  );
  const topRisk = useMemo(() => [...defendSeats].sort((a, b) => a.bnBufferToLose - b.bnBufferToLose).slice(0, 10), [defendSeats]);

  const currentRows = tab === "defend" ? defendSeats : tab === "attack" ? attackSeats : dunMetrics;

  return (
    <section className="stack">
      <div className="card">
        <h2>BN War Room Sabah (Parlimen & DUN)</h2>
        <p className="muted">Fokus pertahan kerusi BN, serang sasaran terdekat, dan susun operasi Base/Persuasion/GOTV.</p>
      </div>

      <div className="grid grid-kpi">
        <KpiCard label="BN Seats Won" value={formatNumber(defendSeats.length)} />
        <KpiCard label="Defend Seats" value={formatNumber(defendSeats.length)} />
        <KpiCard label="Target Seats" value={formatNumber(attackSeats.length)} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div className="card">
          <h3>Top 10 Sasaran Dekat</h3>
          <ol className="priority-list">
            {topNear.map((m) => (
              <li key={m.seat.seat_id}>
                <strong>{m.seat.seat_name}</strong>
                <span>Perlu +{formatNumber(m.bnMarginToWin)} undi untuk menang BN</span>
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
                <span>Buffer BN tinggal {formatNumber(m.bnBufferToLose)} undi</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card">
        <div className="flag-cell" style={{ marginBottom: 10 }}>
          <button type="button" onClick={() => setTab("defend")}>Defend</button>
          <button type="button" onClick={() => setTab("attack")}>Attack</button>
          <button type="button" onClick={() => setTab("operations")}>Operations</button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>DUN</th>
                <th>Parlimen</th>
                <th>Status BN</th>
                <th>Main Opponent</th>
                <th title="(winner_votes - bn_votes) + 1 jika BN belum menang">BN_MarginToWin</th>
                <th title="(bn_votes - runner_up_votes) - 1 jika BN menang">BN_BufferToLose</th>
                <th>Cadangan Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((metric) => (
                <tr key={metric.seat.seat_id}>
                  <td>{metric.seat.seat_name}</td>
                  <td>{metric.seat.parlimen_name}</td>
                  <td className="flag-cell"><Badge label={metric.bnStatusTag} tone={metric.seat.bn_rank === 1 ? "ok" : "warn"} /></td>
                  <td>{metric.mainOpponentParty}</td>
                  <td>{formatNumber(metric.bnMarginToWin)}</td>
                  <td>{formatNumber(metric.bnBufferToLose)}</td>
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
