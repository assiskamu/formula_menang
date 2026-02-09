import { NavLink, Route, Routes } from "react-router-dom";
import { DashboardProvider, useDashboard } from "./data/dashboard";
import RingkasanKerusi from "./pages/RingkasanKerusi";
import FunnelKempen from "./pages/FunnelKempen";
import OperasiGotv from "./pages/OperasiGotv";

const Filters = () => {
  const { filters, setFilters, seatOptions, stateOptions, assumptions } =
    useDashboard();

  return (
    <div className="filters">
      <label>
        Negeri
        <select
          value={filters.state}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, state: event.target.value }))
          }
        >
          <option value="">Semua</option>
          {stateOptions.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>
      <label>
        Kerusi
        <select
          value={filters.seat}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, seat: event.target.value }))
          }
        >
          <option value="">Semua</option>
          {seatOptions.map((seat) => (
            <option key={seat.seat_id} value={seat.seat_id}>
              {seat.seat_name}
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
          <p className="subtitle">Dashboard Kempen Pilihan Raya</p>
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
