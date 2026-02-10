import { ReactNode } from "react";
import InfoTooltip from "./InfoTooltip";

const KpiCard = ({
  label,
  value,
  helper,
  tooltip,
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  tooltip?: { maksud: string; formula: string; contoh: string };
}) => (
  <div className="card kpi-card">
    <span className="kpi-label">
      {label}
      {tooltip ? (
        <InfoTooltip label={label} maksud={tooltip.maksud} formula={tooltip.formula} contoh={tooltip.contoh} />
      ) : null}
    </span>
    <strong className="kpi-value">{value}</strong>
    {helper ? <span className="kpi-helper">{helper}</span> : null}
  </div>
);

export default KpiCard;
