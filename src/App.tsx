import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { DashboardProvider, useDashboard } from "./data/dashboard";
import RingkasanKerusi from "./pages/RingkasanKerusi";
import FunnelKempen from "./pages/FunnelKempen";
import OperasiGotv from "./pages/OperasiGotv";
import BantuanFormula from "./pages/BantuanFormula";

const scenarioLabel: Record<string, string> = {
  low: "Rendah",
  base: "Sederhana",
  high: "Tinggi",
};

const Filters = () => {
  const { filters, setFilters, parlimenOptions, dunOptions, assumptions } = useDashboard();

  return (
    <div className="filters">
      <label>
        Parlimen (Sabah)
        <select
          value={filters.parlimen}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, parlimen: event.target.value, dun: "" }))
          }
        >
          <option value="">Semua Parlimen</option>
          {parlimenOptions.map((parlimen) => (
            <option key={parlimen.code} value={parlimen.code}>
              {parlimen.code} {parlimen.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        DUN (ikut Parlimen)
        <select
          value={filters.dun}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, dun: event.target.value }))
          }
          disabled={dunOptions.length === 0}
        >
          <option value="">Semua DUN</option>
          {dunOptions.map((dun) => (
            <option key={dun.code} value={dun.code}>
              {dun.code} {dun.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Senario Turnout
        <select
          value={filters.turnoutScenario}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              turnoutScenario: event.target.value as keyof typeof assumptions.turnout_scenario,
            }))
          }
        >
          {Object.keys(assumptions.turnout_scenario).map((scenario) => (
            <option key={scenario} value={scenario}>
              {scenarioLabel[scenario] ?? scenario}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

const CaraGunaModal = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("formula-menang-onboarding-v1");
    if (!seen) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Cara guna">
      <div className="card modal-card">
        <h2>Cara guna (3 langkah)</h2>
        <ol>
          <li>Pilih Parlimen atau DUN yang anda mahu semak.</li>
          <li>Pilih senario turnout: Rendah, Sederhana, atau Tinggi.</li>
          <li>Tengok Jurang ke Sasaran dan baca Cadangan Tindakan.</li>
        </ol>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("formula-menang-onboarding-v1", "1");
            setShow(false);
          }}
        >
          Faham, tutup
        </button>
      </div>
    </div>
  );
};

const Layout = () => {
  const { isLoading, error } = useDashboard();

  if (isLoading) {
    return <div className="page">Memuatkan data...</div>;
  }

  if (error) {
    return <div className="page">{error}</div>;
  }

  return (
    <div className="app">
      <CaraGunaModal />
      <header className="header">
        <div>
          <h1>Formula Menang</h1>
          <p className="subtitle">Dashboard BN War Room Sabah (Parlimen + DUN)</p>
        </div>
        <nav>
          <NavLink to="/" end>Ringkasan Kerusi</NavLink>
          <NavLink to="/funnel">Funnel Kempen</NavLink>
          <NavLink to="/gotv">Operasi GOTV</NavLink>
          <NavLink to="/bantuan">Bantuan</NavLink>
        </nav>
      </header>
      <Filters />
      <main className="page">
        <Routes>
          <Route path="/" element={<RingkasanKerusi />} />
          <Route path="/funnel" element={<FunnelKempen />} />
          <Route path="/gotv" element={<OperasiGotv />} />
          <Route path="/bantuan" element={<BantuanFormula />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <DashboardProvider>
    <Layout />
  </DashboardProvider>
);

export default App;
