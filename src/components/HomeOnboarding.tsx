import Badge from "./Badge";

type FocusCard = {
  key: string;
  title: string;
  reason: string;
  seatName: string;
  tone: "danger" | "warn" | "ok" | "neutral";
  onOpen: () => void;
};

type HomeOnboardingProps = {
  onStepSelectArea: () => void;
  onStepPriority: () => void;
  onStepAction: () => void;
  focusCards: FocusCard[];
};

const HomeOnboarding = ({ onStepSelectArea, onStepPriority, onStepAction, focusCards }: HomeOnboardingProps) => (
  <section id="mula-di-sini" className="stack">
    <article className="card purpose-card">
      <h2>Mula Di Sini</h2>
      <p className="muted">Panduan ringkas untuk pengguna baru (siap dalam 30 saat).</p>
      <div className="purpose-grid">
        <div>
          <h3>Tujuan Dashboard</h3>
          <ul>
            <li>Bantu pilih kerusi fokus dan tindakan harian.</li>
            <li>Tunjuk kerusi berisiko, sasaran dekat, dan turnout lemah.</li>
            <li>Susun tindakan ikut keadaan semasa kerusi.</li>
          </ul>
        </div>
        <div>
          <h3>Siapa guna</h3>
          <ul>
            <li>War room negeri/parlimen.</li>
            <li>Petugas lapangan dan penyelaras DUN.</li>
            <li>Ketua jentera yang perlu keputusan cepat.</li>
          </ul>
        </div>
        <div>
          <h3>Had data</h3>
          <ul>
            <li>Bergantung pada data CSV semasa (bukan data masa nyata).</li>
            <li>Cadangan tindakan ialah panduan, bukan arahan mutlak.</li>
            <li>Semak semula keputusan dengan maklumat lapangan.</li>
          </ul>
        </div>
      </div>
    </article>

    <article className="card">
      <h3 style={{ marginTop: 0 }}>Panduan Pantas (1–2–3)</h3>
      <div className="quick-stepper" role="list" aria-label="Langkah penggunaan utama">
        <button type="button" className="step-item step-1" role="listitem" onClick={onStepSelectArea}>
          <span>1</span>
          <div>
            <strong>Pilih Kawasan</strong>
            <p>Parlimen / DUN</p>
          </div>
        </button>
        <button type="button" className="step-item step-2" role="listitem" onClick={onStepPriority}>
          <span>2</span>
          <div>
            <strong>Semak Keutamaan Hari Ini</strong>
            <p>Tahu kerusi mana perlu fokus</p>
          </div>
        </button>
        <button type="button" className="step-item step-3" role="listitem" onClick={onStepAction}>
          <span>3</span>
          <div>
            <strong>Pilih Tindakan</strong>
            <p>Kekalkan / Yakinkan / Keluar Mengundi</p>
          </div>
        </button>
      </div>
    </article>

    <article id="keutamaan-hari-ini" className="card">
      <div className="title-row">
        <h3>Keutamaan Hari Ini</h3>
        <p className="muted">3 kerusi dipilih automatik untuk fokus harian.</p>
      </div>
      <div className="three-col">
        {focusCards.map((card) => (
          <article key={card.key} className="focus-card">
            <Badge label={card.title} tone={card.tone} />
            <h4>{card.seatName}</h4>
            <p>{card.reason}</p>
            <button type="button" onClick={card.onOpen}>Buka Butiran</button>
          </article>
        ))}
      </div>
    </article>
  </section>
);

export default HomeOnboarding;
