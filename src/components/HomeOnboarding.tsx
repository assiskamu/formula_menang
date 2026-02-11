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
      <h2>Tujuan Dashboard</h2>
      <p className="muted">Dashboard ini untuk kenal pasti kerusi BN yang perlu dipertahan dan kerusi sasaran paling hampir.</p>
      <p className="muted">Apa yang anda dapat: Top Risiko, Top Sasaran, dan cadangan tindakan.</p>
      <h3>Contoh penggunaan 30 saat</h3>
      <ul>
        <li>Pilih parlimen dan DUN (jika perlu) di Step 1.</li>
        <li>Lihat ringkasan kerusi dan kenal pasti risiko/sasaran di Step 2.</li>
        <li>Pilih satu tindakan utama, kemudian buka kerusi berkaitan di Step 3.</li>
      </ul>
    </article>

    <article className="card">
      <h3 style={{ marginTop: 0 }}>FLOW PANTAS 1–2–3</h3>
      <div className="quick-stepper" role="list" aria-label="Langkah penggunaan utama">
        <button type="button" className="step-item step-1" role="listitem" onClick={onStepSelectArea}>
          <span>1</span>
          <div>
            <strong>PILIH kawasan</strong>
            <p>Apa perlu buat sekarang? Pilih Parlimen/DUN dan tujuan paparan.</p>
          </div>
        </button>
        <button type="button" className="step-item step-2" role="listitem" onClick={onStepPriority}>
          <span>2</span>
          <div>
            <strong>FAHAM ringkasan</strong>
            <p>Apa perlu buat sekarang? Semak defend/sasaran dan data belum lengkap.</p>
          </div>
        </button>
        <button type="button" className="step-item step-3" role="listitem" onClick={onStepAction}>
          <span>3</span>
          <div>
            <strong>BERTINDAK</strong>
            <p>Apa perlu buat sekarang? Pilih kad tindakan dan buka kerusi berkaitan.</p>
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
