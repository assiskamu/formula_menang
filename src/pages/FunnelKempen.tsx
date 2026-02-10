import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Badge from "../components/Badge";
import InfoTooltip from "../components/InfoTooltip";
import { useDashboard } from "../data/dashboard";
import { formatNumber } from "../utils/format";

const FunnelKempen = () => {
  const { filteredMetrics } = useDashboard();
  const totalFlags = filteredMetrics.reduce((acc, metric) => acc + metric.flags.length, 0);
  const chartData = filteredMetrics.map((metric) => ({ seat: metric.seat.seat_name, Base: metric.progress.base_votes, Persuasi: metric.progress.persuasion_votes, GOTV: metric.progress.gotv_votes }));

  return (
    <section className="stack">
      <div className="card">
        <h2>Funnel Kempen</h2>
        <p className="muted">Jumlah data quality flags: {totalFlags}</p>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} margin={{ left: 24, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="seat" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Base" stackId="a" fill="#1d4ed8" />
              <Bar dataKey="Persuasi" stackId="a" fill="#eab308" />
              <Bar dataKey="GOTV" stackId="a" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2>Jadual Funnel</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Kerusi</th>
                <th>Base <InfoTooltip label="Base" maksud="Undi teras BN yang stabil." formula="input data lapangan" contoh="Base=3000" /></th>
                <th>Persuasi <InfoTooltip label="Persuasi" maksud="Undi tambahan hasil pujukan." formula="input data persuasi" contoh="Persuasi=800" /></th>
                <th>GOTV <InfoTooltip label="GOTV" maksud="Undi yang dimobilisasi hari mengundi." formula="input gerak operasi" contoh="GOTV=500" /></th>
                <th>TotalVote <InfoTooltip label="TotalVote" maksud="Jumlah undi dijangka BN." formula="Base+Persuasi+GOTV" contoh="3000+800+500=4300" /></th>
                <th>GapToWVT <InfoTooltip label="GapToWVT" maksud="Baki undi untuk capai sasaran selamat." formula="WVT-TotalVote" contoh="5000-4300=700" /></th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((metric) => (
                <tr key={metric.seat.seat_id}>
                  <td>{metric.seat.seat_name}</td>
                  <td>{formatNumber(metric.progress.base_votes)}</td>
                  <td>{formatNumber(metric.progress.persuasion_votes)}</td>
                  <td>{formatNumber(metric.progress.gotv_votes)}</td>
                  <td>{formatNumber(metric.totalVote)}</td>
                  <td className={metric.gapToWvt > 0 ? "text-danger" : "text-ok"}>{formatNumber(metric.gapToWvt)}</td>
                  <td className="flag-cell">{metric.flags.length === 0 ? "-" : metric.flags.map((flag) => <Badge key={flag} label={flag} tone="warn" />)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default FunnelKempen;
