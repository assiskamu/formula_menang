const toneMeta = {
  warn: { icon: "⚠️" },
  ok: { icon: "✅" },
  info: { icon: "ℹ️" },
  danger: { icon: "🛑" },
  neutral: { icon: "📍" },
};

const Badge = ({ label, tone = "warn" }: { label: string; tone?: keyof typeof toneMeta }) => (
  <span className={`badge badge-${tone}`}>
    <span aria-hidden="true">{toneMeta[tone].icon}</span>
    {label}
  </span>
);

export default Badge;
