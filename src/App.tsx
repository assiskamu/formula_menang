import { NavLink, Route, Routes } from "react-router-dom";
import { DashboardProvider, useDashboard } from "./data/dashboard";
import RingkasanKerusi from "./pages/RingkasanKerusi";
import FunnelKempen from "./pages/FunnelKempen";
import OperasiGotv from "./pages/OperasiGotv";

const Filters = () => {
  const {
    filters,
    setFilters,
    parlimenOptions,
    dunOptions,
    assumptions,
    grain,
    setGrain,
  } = useDashboard();

  return (
    <div className="filters">
      <label>
        Paparan
        <select
          value={grain}
          onChange={(event) => setGrain(event.target.value as "parlimen" | "dun")}
        >
          <option value="parlimen">Parlimen</option>
          <option value="dun">DUN</option>
        </select>
      </label>
      <label>
        Parlimen (Sabah)
        <select
          value={filters.parlimen}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, parlimen: event.target.value, dun: "" }))
          }
        >
          <option value="">Semua</option>
          {parlimenOptions.map((parlimen) => (
            <option key={parlimen.code} value={parlimen.code}>
              {parlimen.code} {parlimen.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        DUN
        <select
          value={filters.dun}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, dun: event.target.value }))
          }
          disabled={dunOptions.length === 0}
        >
          <option value="">Semua</option>
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
              turnoutScenario: event.target
                .value as keyof typeof assumptions.turnout_scenario,
            }))
          }
        >
          {Object.keys(assumptions.turnout_scenario).map((scenario) => (
            <option key={scenario} value={scenario}>
              {scenario}
            </option>
          ))}
        </select>
      </label>
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
      <header className="header">
        <div>
          <h1>Formula Menang</h1>
          <p className="subtitle">Dashboard Kempen Pilihan Raya Sabah (Parlimen + DUN)</p>
        </div>
        <nav>
          <NavLink to="/" end>
            Ringkasan Kerusi
          </NavLink>
          <NavLink to="/funnel">Funnel Kempen</NavLink>
          <NavLink to="/gotv">Operasi GOTV</NavLink>
        </nav>
      </header>
      <Filters />
      <main className="page">
        <Routes>
          <Route path="/" element={<RingkasanKerusi />} />
          <Route path="/funnel" element={<FunnelKempen />} />
          <Route path="/gotv" element={<OperasiGotv />} />
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
