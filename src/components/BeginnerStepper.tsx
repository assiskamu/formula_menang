import type { SeatMetrics } from "../data/types";
import Tooltip from "./Tooltip";
import { formatNumber, formatPercent } from "../utils/format";

type Option = { code: string; name: string };

type BeginnerStepperProps = {
  parlimen: string;
  dun: string;
  parlimenOptions: Option[];
  dunOptions: Option[];
  onParlimenChange: (value: string) => void;
  onDunChange: (value: string) => void;
  selectedMetric: SeatMetrics | null;
  onCopyAction: () => void;
};

const majoritySize = (value: number) => {
  if (value < 1000) return "kecil";
  if (value < 3000) return "sederhana";
  return "besar";
};

const turnoutLevel = (value?: number | null) => {
  if (typeof value !== "number") return "tiada data";
  if (value < 60) return "rendah";
  if (value < 75) return "sederhana";
  return "tinggi";
};

const primaryFocus = (metric: SeatMetrics | null) => {
  if (!metric) return "BASE";
  const text = metric.cadanganTindakan.toUpperCase();
  if (text.includes("GOTV")) return "GOTV";
  if (text.includes("PERSUASION")) return "PERSUASION";
  return "BASE";
};

const actionBullets: Record<string, string[]> = {
  BASE: ["Hubungi 20 penyokong tegar dan sahkan komitmen.", "Kemas kini ketua cawangan tentang isu setempat.", "Susun lawatan rumah untuk penyokong yang pasif."],
  PERSUASION: ["Senaraikan 15 pengundi atas pagar untuk follow-up.", "Buat mesej ringkas fokus isu kos sara hidup setempat.", "Hantar jurucakap paling dipercayai untuk sesi kecil."],
  GOTV: ["Semak senarai penyokong yang perlukan pengangkutan.", "Hantar peringatan undi melalui WhatsApp pagi dan petang.", "Pastikan petugas check-in pengundi berjadual setiap 2 jam."],
};

const BeginnerStepper = ({
  parlimen,
  dun,
  parlimenOptions,
  dunOptions,
  onParlimenChange,
  onDunChange,
  selectedMetric,
  onCopyAction,
}: BeginnerStepperProps) => {
  const focus = primaryFocus(selectedMetric);
  const majority = selectedMetric?.seat.majority_votes ?? selectedMetric?.seat.last_majority ?? 0;
  const turnout = selectedMetric?.seat.turnout_pct;

  return (
    <section className="card">
      <h3 style={{ marginTop: 0 }}>Flow 1–2–3 (Mode Pemula)</h3>
      <div className="beginner-stepper">
        <article className="step-card">
          <h4>STEP 1: Pilih Kawasan</h4>
          <p className="muted">Pilih Parlimen dulu, kemudian DUN. Kalau tak pasti, pilih “Semua”.</p>
          <div className="step-grid">
            <label>
              Parlimen
              <select value={parlimen} onChange={(event) => onParlimenChange(event.target.value)}>
                <option value="">Semua Parlimen</option>
                {parlimenOptions.map((item) => (
                  <option key={item.code} value={item.code}>{item.code} {item.name}</option>
                ))}
              </select>
            </label>
            <label>
              DUN
              <select value={dun} onChange={(event) => onDunChange(event.target.value)}>
                <option value="">Semua DUN</option>
                {dunOptions.map((item) => (
                  <option key={item.code} value={item.code}>{item.code} {item.name}</option>
                ))}
              </select>
            </label>
          </div>
          {dun && !parlimen ? <p className="context-label">Nota: DUN ikut data mapping walaupun Parlimen = Semua.</p> : null}
        </article>

        <article className="step-card">
          <h4>STEP 2: Faham Status Kerusi (Ringkas)</h4>
          <div className="beginner-status-grid">
            <div className="card beginner-mini-card">
              <div className="title-row">
                <strong>Status BN</strong>
                <Tooltip label="Status BN" maksud="Menang = BN pegang kerusi. Kalah = perlu rampas." contoh="Jika gabungan lawan menang, fokus mesej lawan utama." />
              </div>
              <p>{selectedMetric?.bnStatusTag ?? "Tiada data"}</p>
            </div>
            <div className="card beginner-mini-card">
              <div className="title-row">
                <strong>Majoriti</strong>
                <Tooltip label="Majoriti" maksud="Beza undi antara pemenang dan calon kedua." contoh="Majoriti kecil perlukan gerak cepat." />
              </div>
              <p>{formatNumber(majority)} undi ({majoritySize(majority)})</p>
            </div>
            <div className="card beginner-mini-card">
              <div className="title-row">
                <strong>Turnout</strong>
                <Tooltip label="Turnout" maksud="Peratus pengundi yang benar-benar keluar mengundi." contoh="Turnout rendah biasanya perlukan GOTV." />
              </div>
              <p>{typeof turnout === "number" ? formatPercent(turnout / 100) : "—"} ({turnoutLevel(turnout)})</p>
            </div>
          </div>
        </article>

        <article className="step-card">
          <h4>STEP 3: Apa patut buat hari ini?</h4>
          <div className="card beginner-action-card">
            <p className="muted" style={{ margin: 0 }}>Fokus utama hari ini</p>
            <h3>{focus}</h3>
            <ul>
              {actionBullets[focus].map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
            <button type="button" onClick={onCopyAction}>Salin untuk WhatsApp</button>
          </div>
        </article>
      </div>
    </section>
  );
};

export default BeginnerStepper;
