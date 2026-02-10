import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Badge from "../components/Badge";
import KpiCard from "../components/KpiCard";
import { useDashboard } from "../data/dashboard";
import { getSeatActionNotes } from "../lib/kpi";
import { formatNumber, formatPercent } from "../utils/format";

const RingkasanKerusi = () => {
  const { filteredMetrics, metrics, grain, filters } = useDashboard();
  const [preset, setPreset] = useState<"dekat" | "risiko" | "gotv">("dekat");

  const summary = useMemo(() => {
    const totals = filteredMetrics.reduce(
      (acc, metric) => {
        acc.validVotes += metric.validVotes;
        acc.umm += metric.umm;
        acc.wvt += metric.wvt;
        acc.totalVote += metric.totalVote;
        acc.gapToWvt += metric.gapToWvt;
        acc.totalMajority += metric.seat.last_majority;
        return acc;
      },
      { validVotes: 0, umm: 0, wvt: 0, totalVote: 0, gapToWvt: 0, totalMajority: 0 }
    );
    const swingMin = Math.floor(totals.totalMajority / 2) + 1;
    const swingPct = totals.validVotes === 0 ? 0 : totals.totalMajority / 2 / totals.validVotes;
    return { ...totals, swingMin, swingPct };
  }, [filteredMetrics]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredMetrics];
    rows.sort((a, b) => {
      if (preset === "dekat") {
        const aKey = a.gapToWvt > 0 ? a.gapToWvt : Number.MAX_SAFE_INTEGER;
        const bKey = b.gapToWvt > 0 ? b.gapToWvt : Number.MAX_SAFE_INTEGER;
        return aKey - bKey;
      }
      if (preset === "risiko") {
        return a.swingPct - b.swingPct;
      }
      return b.neededGotvToCloseGap - a.neededGotvToCloseGap;
    });
    return rows;
  }, [filteredMetrics, preset]);

  const chartData = useMemo(
    () => [...filteredMetrics].sort((a, b) => b.gapToWvt - a.gapToWvt).slice(0, 10).map((metric) => ({ seat: metric.seat.seat_name, gapToWvt: metric.gapToWvt })),
    [filteredMetrics]
  );

  const dunUnderParlimen = useMemo(
    () =>
      metrics.filter(
        (metric) =>
          metric.seat.grain === "dun" &&
          (!filters.parlimen || metric.seat.parlimen_code === filters.parlimen)
      ),
    [filters.parlimen, metrics]
  );

  const dataIssues = useMemo(() => {
    const map = new Map<string, number>();
    filteredMetrics.forEach((metric) => {
      metric.flags.forEach((flag) => map.set(flag, (map.get(flag) ?? 0) + 1));
    });
    return Array.from(map.entries());
  }, [filteredMetrics]);

  return (
    <section className="stack">
      {grain === "parlimen" && (
        <div className="card">
          <h2>Paparan lalai: Ringkasan Parlimen + senarai DUN</h2>
          <p className="muted">Pilih satu Parlimen untuk tengok senarai DUN di bawahnya.</p>
        </div>
      )}
      <div className="grid grid-kpi">
        <KpiCard label="Undi Sah (Anggaran)" value={formatNumber(summary.validVotes)} />
        <KpiCard label="UMM (Minimum Menang)" value={formatNumber(summary.umm)} />
        <KpiCard label="WVT (Sasaran Selamat)" value={formatNumber(summary.wvt)} />
        <KpiCard label="Jumlah Undi Dijangka" value={formatNumber(summary.totalVote)} />
        <KpiCard label="Jurang ke Sasaran" value={formatNumber(summary.gapToWvt)} />
        <KpiCard label="Swing Min" value={formatNumber(summary.swingMin)} />
        <KpiCard label="Swing %" value={formatPercent(summary.swingPct)} />
      </div>

      <div className="card">
        <h2>Cadangan Tindakan</h2>
        <ul>
          <li>Jika Jurang ke Sasaran besar, naikkan kerja Persuasion dan GOTV.</li>
          <li>Jika Jumlah Undi Dijangka atau WVT melebihi Undi Sah, sasaran tak realistik.</li>
          <li>Jika Swing % ≤ 2%, kerusi dekat / marginal dan perlu tindakan cepat.</li>
        </ul>
      </div>

      <div className="card">
        <h2>Semakan Data</h2>
        <p className="muted">Jumlah isu dikesan: {dataIssues.reduce((acc, [, count]) => acc + count, 0)}</p>
        <ul>
          {dataIssues.length === 0 ? <li>Tiada isu data pada penapis semasa.</li> : dataIssues.map(([flag, count]) => <li key={flag}>{flag}: {count} kerusi</li>)}
        </ul>
      </div>

      <div className="card">
        <h2>Top Jurang ke Sasaran ({grain.toUpperCase()})</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ left: 24, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="seat" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="gapToWvt" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {grain === "parlimen" && (
        <div className="card">
          <h2>Senarai DUN di bawah Parlimen</h2>
          <p className="muted">Jumlah DUN dipaparkan: {dunUnderParlimen.length}</p>
          <div className="flag-cell">
            {dunUnderParlimen.slice(0, 20).map((dun) => (
              <Badge key={dun.seat.seat_id} label={dun.seat.seat_name} tone="info" />
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>Ringkasan {grain === "parlimen" ? "Parlimen" : "DUN"}</h2>
        <label>
          Susunan Pantas
          <select value={preset} onChange={(event) => setPreset(event.target.value as "dekat" | "risiko" | "gotv")}>
            <option value="dekat">Paling dekat menang</option>
            <option value="risiko">Paling berisiko</option>
            <option value="gotv">Keutamaan GOTV</option>
          </select>
        </label>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Kerusi</th>
                <th>Parlimen</th>
                <th>Undi Sah (Anggaran)</th>
                <th>UMM (Minimum Menang)</th>
                <th>WVT (Sasaran Selamat)</th>
                <th>Jumlah Undi Dijangka</th>
                <th>Jurang ke Sasaran</th>
                <th>Swing Min</th>
                <th>Swing %</th>
                <th>Status & Cadangan</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((metric) => (
                <tr key={metric.seat.seat_id}>
                  <td>{metric.seat.seat_name}</td>
                  <td>{metric.seat.parlimen_name}</td>
                  <td>{formatNumber(metric.validVotes)}</td>
                  <td>{formatNumber(metric.umm)}</td>
                  <td>{formatNumber(metric.wvt)}</td>
                  <td>{formatNumber(metric.totalVote)}</td>
                  <td className={metric.gapToWvt > 0 ? "text-danger" : "text-ok"}>{formatNumber(metric.gapToWvt)}</td>
                  <td>{formatNumber(metric.swingMin)}</td>
                  <td>{formatPercent(metric.swingPct)}</td>
                  <td className="flag-cell">
                    {metric.gapToWvt > 0 ? <Badge label="⚠️ Masih kurang undi" /> : <Badge label="✅ Capai sasaran" tone="ok" />}
                    {metric.swingPct <= 0.02 && <Badge label="⚠️ Kerusi dekat / marginal" />}
                    {(metric.totalVote > metric.validVotes || metric.wvt > metric.validVotes) && <Badge label="⚠️ Sasaran tak realistik" />}
                    {getSeatActionNotes(metric).map((note) => (
                      <Badge key={note} label={note} tone="info" />
                    ))}
                  </td>
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
