import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Badge from "../components/Badge";
import KpiCard from "../components/KpiCard";
import { useDashboard } from "../data/dashboard";
import { formatNumber, formatPercent } from "../utils/format";

const RingkasanKerusi = () => {
  const { filteredMetrics } = useDashboard();
  const [sortKey, setSortKey] = useState<"gapToWvt" | "seat">("gapToWvt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
      {
        validVotes: 0,
        umm: 0,
        wvt: 0,
        totalVote: 0,
        gapToWvt: 0,
        totalMajority: 0,
      }
    );
    const swingMin = Math.floor(totals.totalMajority / 2) + 1;
    const swingPct =
      totals.validVotes === 0
        ? 0
        : totals.totalMajority / 2 / totals.validVotes;
    return { ...totals, swingMin, swingPct };
  }, [filteredMetrics]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredMetrics];
    rows.sort((a, b) => {
      if (sortKey === "seat") {
        return sortDir === "asc"
          ? a.seat.seat_name.localeCompare(b.seat.seat_name)
          : b.seat.seat_name.localeCompare(a.seat.seat_name);
      }
      const delta = a.gapToWvt - b.gapToWvt;
      return sortDir === "asc" ? delta : -delta;
    });
    return rows;
  }, [filteredMetrics, sortDir, sortKey]);

  const toggleSort = (key: "gapToWvt" | "seat") => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "gapToWvt" ? "desc" : "asc");
  };

  const chartData = useMemo(() => {
    return [...filteredMetrics]
      .sort((a, b) => b.gapToWvt - a.gapToWvt)
      .slice(0, 10)
      .map((metric) => ({
        seat: metric.seat.seat_name,
        gapToWvt: metric.gapToWvt,
      }));
  }, [filteredMetrics]);

  const totalFlags = filteredMetrics.reduce(
    (acc, metric) => acc + metric.flags.length,
    0
  );

  return (
    <section className="stack">
      <div className="grid grid-kpi">
        <KpiCard label="ValidVotes" value={formatNumber(summary.validVotes)} />
        <KpiCard label="UMM" value={formatNumber(summary.umm)} />
        <KpiCard label="WVT" value={formatNumber(summary.wvt)} />
        <KpiCard label="TotalVote" value={formatNumber(summary.totalVote)} />
        <KpiCard label="GapToWVT" value={formatNumber(summary.gapToWvt)} />
        <KpiCard label="SwingMin" value={formatNumber(summary.swingMin)} />
        <KpiCard label="SwingPct" value={formatPercent(summary.swingPct)} />
        <KpiCard label="Jumlah Flags" value={totalFlags} />
      </div>

      <div className="card">
        <h2>Top GapToWVT</h2>
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

      <div className="card">
        <h2>Ringkasan Kerusi</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>
                  <button type="button" onClick={() => toggleSort("seat")}>
                    Kerusi
                  </button>
                </th>
                <th>Negeri</th>
                <th>ValidVotes</th>
                <th>TotalVote</th>
                <th>WVT</th>
                <th>
                  <button type="button" onClick={() => toggleSort("gapToWvt")}>
                    GapToWVT
                  </button>
                </th>
                <th>SwingMin</th>
                <th>SwingPct</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((metric) => (
                <tr key={metric.seat.seat_id}>
                  <td>{metric.seat.seat_name}</td>
                  <td>{metric.seat.state}</td>
                  <td>{formatNumber(metric.validVotes)}</td>
                  <td>{formatNumber(metric.totalVote)}</td>
                  <td>{formatNumber(metric.wvt)}</td>
                  <td className={metric.gapToWvt > 0 ? "text-danger" : "text-ok"}>
                    {formatNumber(metric.gapToWvt)}
                  </td>
                  <td>{formatNumber(metric.swingMin)}</td>
                  <td>{formatPercent(metric.swingPct)}</td>
                  <td className="flag-cell">
                    {metric.flags.length === 0
                      ? "-"
                      : metric.flags.map((flag) => (
                          <Badge key={flag} label={flag} />
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
