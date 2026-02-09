import { ReactNode } from "react";

const KpiCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: ReactNode;
  helper?: string;
}) => (
  <div className="card kpi-card">
    <span className="kpi-label">{label}</span>
    <strong className="kpi-value">{value}</strong>
    {helper ? <span className="kpi-helper">{helper}</span> : null}
  </div>
);

export default KpiCard;
