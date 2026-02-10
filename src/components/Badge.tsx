const Badge = ({ label, tone = "warn" }: { label: string; tone?: "warn" | "ok" | "info" }) => (
  <span className={`badge badge-${tone}`}>{label}</span>
);

export default Badge;
