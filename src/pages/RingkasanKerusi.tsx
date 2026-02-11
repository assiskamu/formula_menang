import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import ActionPanel from "../components/ActionPanel";
import Badge from "../components/Badge";
import HomeOnboarding from "../components/HomeOnboarding";
import InfoTooltip from "../components/InfoTooltip";
import KpiCard from "../components/KpiCard";
import QuickGlossary from "../components/QuickGlossary";
import { useDashboard } from "../data/dashboard";
import type { SeatMetrics } from "../data/types";
import { formatNumber, formatPercent } from "../utils/format";
import { scrollToSection } from "../utils/scrollToSection";

const actionLabel = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized.includes("gotv")) return "Keluar Mengundi";
  if (normalized.includes("persuasion")) return "Yakinkan";
  if (normalized.includes("base")) return "Kekalkan";
  return value;
};

const statusTone = (metric: SeatMetrics) => {
  if (metric.seat.bn_rank === 1 && metric.bnBufferToLose <= 1500) return "danger" as const;
  if (metric.seat.bn_rank !== 1 && metric.bnMarginToWin <= 2000) return "warn" as const;
  if ((metric.seat.turnout_pct ?? 100) < 65) return "warn" as const;
  return metric.seat.bn_rank === 1 ? "ok" as const : "neutral" as const;
};

const RingkasanKerusi = () => {
  const { metrics, filteredMetrics, filters, setFilters, dashboardMode, dataWarnings } = useDashboard();
  const location = useLocation();
  const isBeginner = dashboardMode === "beginner";

  const dunMetrics = useMemo(() => metrics.filter((metric) => metric.seat.grain === "dun"), [metrics]);
  const visibleRows = useMemo(() => filteredMetrics.filter((metric) => metric.seat.grain === "dun"), [filteredMetrics]);


  useEffect(() => {
    if (location.pathname === "/senarai") scrollToSection("senarai-kerusi");
    if (location.pathname === "/butiran") scrollToSection("butiran-kerusi");
  }, [location.pathname]);
  const selectedMetric = useMemo(() => {
    if (filters.dun) return dunMetrics.find((metric) => metric.seat.dun_code === filters.dun) ?? null;
    return visibleRows[0] ?? dunMetrics[0] ?? null;
  }, [dunMetrics, filters.dun, visibleRows]);

  const prioritySeats = useMemo(() => {
    const highRisk = dunMetrics
      .filter((metric) => metric.seat.winner_party === "BN")
      .sort((a, b) => a.bnBufferToLose - b.bnBufferToLose)[0];
    const closeTarget = dunMetrics
      .filter((metric) => metric.seat.winner_party !== "BN")
      .sort((a, b) => a.bnMarginToWin - b.bnMarginToWin)[0];
    const lowTurnout = dunMetrics
      .filter((metric) => typeof metric.seat.turnout_pct === "number")
      .sort((a, b) => (a.seat.turnout_pct ?? 100) - (b.seat.turnout_pct ?? 100))[0];

    const applySeat = (metric: SeatMetrics | undefined) => {
      if (!metric?.seat.dun_code) return;
      setFilters((prev) => ({ ...prev, dun: metric.seat.dun_code ?? "" }));
      scrollToSection("butiran-kerusi");
    };

    return [
      {
        key: "risk",
        title: "Risiko Tinggi",
        reason: highRisk ? `BN pegang kerusi ini dengan buffer ${formatNumber(highRisk.bnBufferToLose)} undi.` : "Tiada data kerusi risiko buat masa ini.",
        seatName: highRisk?.seat.seat_name ?? "Tiada kerusi",
        tone: "danger" as const,
        onOpen: () => applySeat(highRisk),
      },
      {
        key: "target",
        title: "Sasaran Paling Dekat",
        reason: closeTarget ? `BN perlukan sekitar ${formatNumber(closeTarget.bnMarginToWin)} undi tambahan untuk menang.` : "Tiada data sasaran rapat buat masa ini.",
        seatName: closeTarget?.seat.seat_name ?? "Tiada kerusi",
        tone: "warn" as const,
        onOpen: () => applySeat(closeTarget),
      },
      {
        key: "turnout",
        title: "Turnout Lemah",
        reason: lowTurnout ? `Turnout semasa ${formatPercent((lowTurnout.seat.turnout_pct ?? 0) / 100)}. Sesuai fokus keluar mengundi.` : "Tiada data turnout buat masa ini.",
        seatName: lowTurnout?.seat.seat_name ?? "Tiada kerusi",
        tone: "neutral" as const,
        onOpen: () => applySeat(lowTurnout),
      },
    ];
  }, [dunMetrics, setFilters]);

  return (
    <section className="stack">
      {isBeginner ? (
        <HomeOnboarding
          onStepSelectArea={() => scrollToSection("kawasan-filter", "#parlimen-filter")}
          onStepPriority={() => scrollToSection("keutamaan-hari-ini")}
          onStepAction={() => scrollToSection("panel-tindakan")}
          focusCards={prioritySeats}
        />
      ) : null}

      <section className="card" id="kawasan-filter">
        <div className="title-row">
          <h2>{isBeginner ? "Senarai Kerusi" : "Ringkasan Kerusi"}</h2>
          <p className="muted">{visibleRows.length} kerusi dipaparkan berdasarkan filter semasa.</p>
        </div>
        {dataWarnings.length > 0 ? <p className="context-label">Amaran data: {dataWarnings[0]}</p> : null}
        <div className="grid grid-kpi">
          <KpiCard label="Jumlah Kerusi DUN" value={formatNumber(dunMetrics.length)} helper="Keseluruhan dataset" />
          <KpiCard label="Kerusi BN Menang" value={formatNumber(dunMetrics.filter((metric) => metric.seat.winner_party === "BN").length)} helper="Perlu kekalkan" />
          <KpiCard label="Kerusi Sasaran" value={formatNumber(dunMetrics.filter((metric) => metric.seat.winner_party !== "BN").length)} helper="Perlu yakinkan" />
        </div>
      </section>

      <ActionPanel metric={selectedMetric} />

      <section className="card" id="senarai-kerusi">
        <div className="title-row">
          <h3>Senarai Kerusi</h3>
          <InfoTooltip label="Maksud angka dalam senarai" maksud="Margin kecil = kerusi lebih rapat dan perlu fokus segera." formula="Buffer rendah atau margin sasaran rendah = keutamaan" contoh="Buffer 800 undi lebih kritikal berbanding 4000 undi" />
        </div>
        <div className="table-wrapper desktop-table-view">
          <table>
            <thead>
              <tr>
                <th>Kerusi</th>
                <th>Status</th>
                <th>Sebab fokus</th>
                <th>Turnout</th>
                <th>Tindakan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((metric) => (
                <tr key={metric.seat.seat_id}>
                  <td>
                    <strong>{metric.seat.seat_name}</strong>
                    <p className="muted">{metric.seat.parlimen_name}</p>
                  </td>
                  <td>
                    <Badge label={metric.seat.winner_party === "BN" ? "Defend" : "Sasaran"} tone={statusTone(metric)} />
                  </td>
                  <td>
                    {metric.seat.winner_party === "BN"
                      ? `Buffer BN: ${formatNumber(metric.bnBufferToLose)} undi`
                      : `Margin sasaran: ${formatNumber(metric.bnMarginToWin)} undi`}
                  </td>
                  <td>{typeof metric.seat.turnout_pct === "number" ? formatPercent(metric.seat.turnout_pct / 100) : "Data kurang"}</td>
                  <td><span className="action-pill">{actionLabel(metric.cadanganTindakan)}</span></td>
                  <td><button type="button" onClick={() => { setFilters((prev) => ({ ...prev, dun: metric.seat.dun_code ?? "" })); scrollToSection("butiran-kerusi"); }}>Buka Butiran</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-card-list">
          {visibleRows.map((metric) => (
            <article key={metric.seat.seat_id} className="card seat-card">
              <h4>{metric.seat.seat_name}</h4>
              <Badge label={metric.seat.winner_party === "BN" ? "Defend" : "Sasaran"} tone={statusTone(metric)} />
              <p>{metric.seat.winner_party === "BN" ? `Buffer BN: ${formatNumber(metric.bnBufferToLose)} undi` : `Margin sasaran: ${formatNumber(metric.bnMarginToWin)} undi`}</p>
              <p>Turnout: {typeof metric.seat.turnout_pct === "number" ? formatPercent(metric.seat.turnout_pct / 100) : "Data kurang"}</p>
              <p><strong>Tindakan:</strong> {actionLabel(metric.cadanganTindakan)}</p>
              <button type="button" onClick={() => { setFilters((prev) => ({ ...prev, dun: metric.seat.dun_code ?? "" })); scrollToSection("butiran-kerusi"); }}>Buka Butiran</button>
            </article>
          ))}
        </div>
      </section>

      <section className="card" id="butiran-kerusi">
        <h3>Butiran Kerusi</h3>
        {selectedMetric ? (
          <div className="detail-stats">
            <p><strong>Kerusi:</strong> {selectedMetric.seat.seat_name}</p>
            <p><strong>Status:</strong> {selectedMetric.seat.winner_party === "BN" ? "BN pegang kerusi" : "Kerusi sasaran BN"}</p>
            <p><strong>Majoriti:</strong> {formatNumber(selectedMetric.seat.majority_votes ?? selectedMetric.seat.last_majority ?? 0)} undi</p>
            <p><strong>Turnout:</strong> {typeof selectedMetric.seat.turnout_pct === "number" ? formatPercent(selectedMetric.seat.turnout_pct / 100) : "Data kurang"}</p>
            <p><strong>Saranan Utama:</strong> {actionLabel(selectedMetric.cadanganTindakan)}</p>
          </div>
        ) : <p className="muted">Pilih kerusi dalam senarai untuk lihat butiran.</p>}
      </section>

      <QuickGlossary showAdvancedLink={isBeginner} />

      {!isBeginner ? (
        <section className="card" id="bantuan-lanjutan">
          <h3>Bantuan (Mode Lanjutan)</h3>
          <p className="muted">Akses modul lanjutan melalui menu: Perjalanan Undi, Pelan Hari Mengundi, Bantuan & Maksud Angka, dan Penerangan Istilah penuh.</p>
        </section>
      ) : null}
    </section>
  );
};

export default RingkasanKerusi;
