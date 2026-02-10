import Badge from "../components/Badge";
import InfoTooltip from "../components/InfoTooltip";
import { useDashboard } from "../data/dashboard";
import { formatNumber } from "../utils/format";

const OperasiGotv = () => {
  const { filteredMetrics } = useDashboard();
  const sortedByNeed = [...filteredMetrics].sort((a, b) => b.neededGotvToCloseGap - a.neededGotvToCloseGap);

  return (
    <section className="stack">
      <div className="card">
        <h2>Prioriti GOTV</h2>
        <ol className="priority-list">
          {sortedByNeed.slice(0, 5).map((metric) => (
            <li key={metric.seat.seat_id}>
              <strong>{metric.seat.seat_name}</strong>
              <span>Perlu {formatNumber(metric.neededGotvToCloseGap)} undi GOTV</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h2>Jurang GOTV</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Kerusi</th>
                <th>GOTV Semasa</th>
                <th>Keperluan GOTV <InfoTooltip label="Keperluan GOTV" maksud="Undi GOTV tambahan yang perlu dikejar." formula="max(0,GapToWVT-(Base+Persuasi))" contoh="700-(3000+800)=0" /></th>
                <th>Jurang ke Sasaran</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {sortedByNeed.map((metric) => (
                <tr key={metric.seat.seat_id}>
                  <td>{metric.seat.seat_name}</td>
                  <td>{formatNumber(metric.progress.gotv_votes)}</td>
                  <td>{formatNumber(metric.neededGotvToCloseGap)}</td>
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

export default OperasiGotv;
