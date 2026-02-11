import { useDashboard } from "../data/dashboard";

const BeginnerModeToggle = () => {
  const { dashboardMode, setDashboardMode } = useDashboard();

  return (
    <div className="beginner-toggle card" role="group" aria-label="Pilih mode paparan">
      <p className="muted" style={{ margin: 0 }}>Tukar paparan ikut tahap pengguna:</p>
      <div className="segmented">
        <button
          type="button"
          className={dashboardMode === "beginner" ? "active" : ""}
          onClick={() => setDashboardMode("beginner")}
        >
          Mode Pemula ✅
        </button>
        <button
          type="button"
          className={dashboardMode === "advanced" ? "active" : ""}
          onClick={() => setDashboardMode("advanced")}
        >
          Mode Lanjutan
        </button>
      </div>
    </div>
  );
};

export default BeginnerModeToggle;
