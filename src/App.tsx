import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { DashboardProvider, useDashboard } from "./data/dashboard";
import RingkasanKerusi from "./pages/RingkasanKerusi";
import FunnelKempen from "./pages/FunnelKempen";
import OperasiGotv from "./pages/OperasiGotv";
import BantuanFormula from "./pages/BantuanFormula";
import PeneranganIstilah from "./pages/PeneranganIstilah";
import KemasKiniData from "./pages/KemasKiniData";

const scenarioLabel: Record<string, string> = { low: "Rendah", base: "Sederhana", high: "Tinggi" };

const TetapanThreshold = () => {
  const { thresholds, setThresholds, resetThresholds } = useDashboard();

  const updateNumber = (path: string, value: number) => {
    setThresholds((prev) => {
      const next = structuredClone(prev);
      const [group, level, key] = path.split(".");
      (next as any)[group][level][key] = Number.isFinite(value) ? value : 0;
      return next;
    });
  };

  return (
    <details className="card settings-panel">
      <summary>Tetapan Threshold (simpan automatik)</summary>
      <div className="settings-grid">
        <label>Serang Dekat (undi)
          <input type="number" value={thresholds.attack.dekat.margin_votes} onChange={(e) => updateNumber("attack.dekat.margin_votes", Number(e.target.value))} />
        </label>
        <label>Serang Dekat (%)
          <input type="number" step="0.001" value={thresholds.attack.dekat.margin_pct} onChange={(e) => updateNumber("attack.dekat.margin_pct", Number(e.target.value))} />
        </label>
        <label>Serang Sederhana (undi)
          <input type="number" value={thresholds.attack.sederhana.margin_votes} onChange={(e) => updateNumber("attack.sederhana.margin_votes", Number(e.target.value))} />
        </label>
        <label>Serang Sederhana (%)
          <input type="number" step="0.001" value={thresholds.attack.sederhana.margin_pct} onChange={(e) => updateNumber("attack.sederhana.margin_pct", Number(e.target.value))} />
        </label>
        <label>Defend Risiko Tinggi (undi)
          <input type="number" value={thresholds.defend.risiko_tinggi.majority_votes} onChange={(e) => updateNumber("defend.risiko_tinggi.majority_votes", Number(e.target.value))} />
        </label>
        <label>Defend Risiko Tinggi (%)
          <input type="number" step="0.001" value={thresholds.defend.risiko_tinggi.majority_pct} onChange={(e) => updateNumber("defend.risiko_tinggi.majority_pct", Number(e.target.value))} />
        </label>
        <label>Defend Risiko Sederhana (undi)
          <input type="number" value={thresholds.defend.risiko_sederhana.majority_votes} onChange={(e) => updateNumber("defend.risiko_sederhana.majority_votes", Number(e.target.value))} />
        </label>
        <label>Defend Risiko Sederhana (%)
          <input type="number" step="0.001" value={thresholds.defend.risiko_sederhana.majority_pct} onChange={(e) => updateNumber("defend.risiko_sederhana.majority_pct", Number(e.target.value))} />
        </label>
      </div>
      <button type="button" onClick={resetThresholds}>Reset ke Default</button>
    </details>
  );
};

const Filters = () => {
  const { filters, setFilters, parlimenOptions, dunOptions, assumptions } = useDashboard();
  return (
    <div className="filters">
      <label>Parlimen (Sabah)
        <select value={filters.parlimen} onChange={(event) => setFilters((prev) => ({ ...prev, parlimen: event.target.value, dun: "" }))}>
          <option value="">Semua Parlimen</option>
          {parlimenOptions.map((parlimen) => <option key={parlimen.code} value={parlimen.code}>{parlimen.code} {parlimen.name}</option>)}
        </select>
      </label>
      <label>DUN (ikut Parlimen)
        <select value={filters.dun} onChange={(event) => setFilters((prev) => ({ ...prev, dun: event.target.value }))} disabled={dunOptions.length === 0}>
          <option value="">Semua DUN</option>
          {dunOptions.map((dun) => <option key={dun.code} value={dun.code}>{dun.code} {dun.name}</option>)}
        </select>
      </label>
      <label>Senario Turnout
        <select value={filters.turnoutScenario} onChange={(event) => setFilters((prev) => ({ ...prev, turnoutScenario: event.target.value as keyof typeof assumptions.turnout_scenario }))}>
          {Object.keys(assumptions.turnout_scenario).map((scenario) => <option key={scenario} value={scenario}>{scenarioLabel[scenario] ?? scenario}</option>)}
        </select>
      </label>
    </div>
  );
};


const DataCoverageBanner = () => {
  const { detailCoverage, candidateCoverage } = useDashboard();
  return (
    <div className="coverage-banner" role="status">
      <strong>Data lengkap (turnout/berdaftar/majoriti) tersedia untuk {detailCoverage}/73 DUN</strong>
      <strong>Data pecahan calon tersedia untuk {candidateCoverage}/73 DUN</strong>
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
          <li>Tengok status BN, jurang sasaran, dan cadangan tindakan.</li>
        </ol>
        <button type="button" onClick={() => { localStorage.setItem("formula-menang-onboarding-v1", "1"); setShow(false); }}>Faham, tutup</button>
      </div>
    </div>
  );
};

const Layout = () => {
  const { isLoading, error } = useDashboard();
  if (isLoading) return <div className="page">Memuatkan data...</div>;
  if (error) return <div className="page">{error}</div>;
  return (
    <div className="app">
      <CaraGunaModal />
      <header className="header">
        <div>
          <h1>Formula Menang</h1>
          <p className="subtitle">Dashboard BN-centric War Room Sabah (Parlimen + DUN)</p>
        </div>
        <nav>
          <NavLink to="/" end>Ringkasan BN War Room</NavLink>
          <NavLink to="/funnel">Funnel Kempen</NavLink>
          <NavLink to="/gotv">Operasi GOTV</NavLink>
          <NavLink to="/bantuan">Bantuan & Maksud Angka</NavLink>
          <NavLink to="/penerangan">Penerangan Istilah</NavLink>
          <NavLink to="/kemas-kini">Kemas Kini Data</NavLink>
        </nav>
      </header>
      <DataCoverageBanner />
      <Filters />
      <TetapanThreshold />
      <main className="page">
        <Routes>
          <Route path="/" element={<RingkasanKerusi />} />
          <Route path="/funnel" element={<FunnelKempen />} />
          <Route path="/gotv" element={<OperasiGotv />} />
          <Route path="/bantuan" element={<BantuanFormula />} />
          <Route path="/penerangan" element={<PeneranganIstilah />} />
          <Route path="/kemas-kini" element={<KemasKiniData />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => <DashboardProvider><Layout /></DashboardProvider>;

export default App;
