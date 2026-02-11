import { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import BeginnerModeToggle from "./components/BeginnerModeToggle";
import HelpModal from "./components/HelpModal";
import { actionTagGuides, type ActionTag } from "./data/actionTags";
import { DashboardProvider, useDashboard } from "./data/dashboard";
import BantuanFormula from "./pages/BantuanFormula";
import FunnelKempen from "./pages/FunnelKempen";
import KemasKiniData from "./pages/KemasKiniData";
import OperasiGotv from "./pages/OperasiGotv";
import PeneranganIstilah from "./pages/PeneranganIstilah";
import RingkasanKerusi from "./pages/RingkasanKerusi";

const actionTags: ActionTag[] = ["GOTV", "PERSUASION", "BASE"];

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
  const [parlimenQuery, setParlimenQuery] = useState("");
  const [dunQuery, setDunQuery] = useState("");
  const selectedParlimenLabel = useMemo(
    () => parlimenOptions.find((item) => item.code === filters.parlimen)?.name ?? "",
    [filters.parlimen, parlimenOptions],
  );
  const selectedDunLabel = useMemo(
    () => dunOptions.find((item) => item.code === filters.dun)?.name ?? "",
    [dunOptions, filters.dun],
  );

  useEffect(() => {
    setParlimenQuery(filters.parlimen ? `${filters.parlimen} ${selectedParlimenLabel}` : "");
  }, [filters.parlimen, selectedParlimenLabel]);

  useEffect(() => {
    setDunQuery(filters.dun ? `${filters.dun} ${selectedDunLabel}` : "");
  }, [filters.dun, selectedDunLabel]);

  const resetFilters = () => {
    setFilters((prev) => ({ ...prev, parlimen: "", dun: "" }));
    setParlimenQuery("");
    setDunQuery("");
  };

  const updateParlimenFromSearch = (query: string) => {
    const normalized = query.trim().toLowerCase();
    const matched = parlimenOptions.find((item) => `${item.code} ${item.name}`.toLowerCase() === normalized || item.code.toLowerCase() === normalized);
    setFilters((prev) => ({ ...prev, parlimen: matched?.code ?? "", dun: "" }));
  };

  const updateDunFromSearch = (query: string) => {
    const normalized = query.trim().toLowerCase();
    const matched = dunOptions.find((item) => `${item.code} ${item.name}`.toLowerCase() === normalized || item.code.toLowerCase() === normalized);
    setFilters((prev) => ({ ...prev, dun: matched?.code ?? "" }));
  };

  return (
    <>
      <div className="mobile-top-bar" role="region" aria-label="Navigasi pantas mudah alih">
        <label>
          <span className="label-title">Parlimen</span>
          <input
            list="parlimen-mobile-options"
            value={parlimenQuery}
            onChange={(event) => { setParlimenQuery(event.target.value); updateParlimenFromSearch(event.target.value); }}
            placeholder="Cari parlimen"
            aria-label="Cari parlimen"
          />
          <datalist id="parlimen-mobile-options">
            {parlimenOptions.map((parlimen) => <option key={parlimen.code} value={`${parlimen.code} ${parlimen.name}`} />)}
          </datalist>
        </label>

        <label>
          <span className="label-title">DUN</span>
          <input
            list="dun-mobile-options"
            value={dunQuery}
            onChange={(event) => { setDunQuery(event.target.value); updateDunFromSearch(event.target.value); }}
            placeholder={dunOptions.length === 0 ? "Pilih parlimen dulu" : "Cari DUN"}
            aria-label="Cari DUN"
            disabled={dunOptions.length === 0}
          />
          <datalist id="dun-mobile-options">
            {dunOptions.map((dun) => <option key={dun.code} value={`${dun.code} ${dun.name}`} />)}
          </datalist>
        </label>

        <div className="mobile-top-actions">
          <button type="button" onClick={resetFilters}>Reset</button>
          <button type="button" className="secondary" onClick={() => window.dispatchEvent(new CustomEvent("open-istilah-sheet"))}>Istilah</button>
        </div>
      </div>

      <div className="filters desktop-filters">
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
    </>
  );
};

const DataCoverageBanner = () => {
  const { detailCoverage, candidateCoverage, dataSummary } = useDashboard();
  return (
    <div className="coverage-banner" role="status" aria-live="polite">
      <strong>Data: {dataSummary.totalDun} DUN • Lengkap: {detailCoverage} • Calon: {candidateCoverage} • BN: {dataSummary.bnWins}</strong>
    </div>
  );
};

const BackToTop = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(window.scrollY > 380);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (!show) return null;

  return (
    <button type="button" className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Kembali ke atas">
      ↑ Atas
    </button>
  );
};

const Layout = () => {
  const { isLoading, error, dashboardMode } = useDashboard();
  const [showGlossarySheet, setShowGlossarySheet] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const handler = () => setShowGlossarySheet(true);
    window.addEventListener("open-istilah-sheet", handler);
    return () => window.removeEventListener("open-istilah-sheet", handler);
  }, []);

  if (isLoading) return <div className="page">Memuatkan data...</div>;
  if (error) return <div className="page">{error}</div>;
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Formula Menang</h1>
          <p className="subtitle">Dashboard BN-centric War Room Sabah (Parlimen + DUN)</p>
        </div>
        <nav>
          <NavLink to="/" end>Ringkasan BN War Room</NavLink>
          <button type="button" className={`nav-help-button ${dashboardMode === "beginner" ? "beginner-highlight" : ""}`} onClick={() => setShowHelpModal(true)}>Cara Guna (1 min)</button>
          <NavLink to="/funnel" className={dashboardMode === "beginner" ? "beginner-muted" : ""}>Funnel Kempen</NavLink>
          <NavLink to="/gotv" className={dashboardMode === "beginner" ? "beginner-muted" : ""}>Operasi GOTV</NavLink>
          <NavLink to="/bantuan" className={dashboardMode === "beginner" ? "beginner-muted" : ""}>Bantuan & Maksud Angka</NavLink>
          <NavLink to="/penerangan" className={dashboardMode === "beginner" ? "beginner-muted" : ""}>Penerangan Istilah</NavLink>
          <NavLink to="/kemas-kini" className={dashboardMode === "beginner" ? "beginner-muted" : ""}>Kemas Kini Data</NavLink>
        </nav>
      </header>
      <BeginnerModeToggle />
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

      <HelpModal open={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {showGlossarySheet && (
        <div className="bottom-sheet-overlay" role="dialog" aria-modal="true" aria-label="Istilah penting" onClick={() => setShowGlossarySheet(false)}>
          <div className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="bottom-sheet-header">
              <h2>Istilah Pantas War Room</h2>
              <button type="button" onClick={() => setShowGlossarySheet(false)} aria-label="Tutup istilah">Tutup</button>
            </div>
            <p className="muted">Rujukan ringkas untuk tag tindakan utama.</p>
            <div className="sheet-tag-grid">
              {actionTags.map((tag) => (
                <article key={tag} className="sheet-tag-card">
                  <h3>{tag}</h3>
                  <p>{actionTagGuides[tag].maksud}</p>
                  <ul>
                    {actionTagGuides[tag].bilaGuna.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
      <BackToTop />
    </div>
  );
};

const App = () => <DashboardProvider><Layout /></DashboardProvider>;

export default App;
