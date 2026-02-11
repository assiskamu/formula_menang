import { useMemo, useState } from "react";
import type { SeatMetrics } from "../data/types";

type ActionKey = "kekalkan" | "yakinkan" | "keluar_mengundi";

const actionSteps: Record<ActionKey, string[]> = {
  kekalkan: [
    "Hubungi penyokong tegar dan sahkan komitmen mereka.",
    "Buat lawatan rumah untuk penyokong yang belum aktif.",
    "Aktifkan ketua cawangan untuk semak isu setempat.",
    "Pantau kerusi majoriti kecil setiap malam.",
  ],
  yakinkan: [
    "Senaraikan pengundi atas pagar ikut lokaliti.",
    "Guna mesej mudah: kos hidup, kerja, kemudahan asas.",
    "Hantar jurucakap yang dipercayai di kawasan itu.",
    "Catat respons pengundi dan kemas kini status harian.",
  ],
  keluar_mengundi: [
    "Sediakan pengangkutan untuk penyokong berisiko tidak keluar.",
    "Hantar peringatan undi (pagi, tengah hari, petang).",
    "Buat semakan turnout mengikut saluran setiap 2 jam.",
    "Aktifkan pasukan jemput pengundi yang belum hadir.",
  ],
};

const ActionPanel = ({ metric }: { metric: SeatMetrics | null }) => {
  const suggested = useMemo<ActionKey>(() => {
    const actionText = metric?.cadanganTindakan.toLowerCase() ?? "";
    if (actionText.includes("gotv")) return "keluar_mengundi";
    if (actionText.includes("persuasion")) return "yakinkan";
    return "kekalkan";
  }, [metric]);

  const [activeTab, setActiveTab] = useState<ActionKey>(suggested);

  const recommendation = useMemo(() => {
    if (!metric) return "Pilih kerusi untuk dapat cadangan yang lebih tepat.";
    if (activeTab === "keluar_mengundi" && (metric.seat.turnout_pct ?? 100) < 65) return "Turnout kerusi ini rendah. Fokus mobilisasi pengundi.";
    if (activeTab === "yakinkan" && metric.seat.bn_rank !== 1) return "BN belum menang. Fokus pengundi atas pagar dan lawan utama.";
    if (activeTab === "kekalkan" && metric.seat.bn_rank === 1) return "BN sedang pegang kerusi. Kekalkan penyokong dan elak kebocoran.";
    return "Gunakan tindakan ini sebagai pelan harian pasukan.";
  }, [activeTab, metric]);

  return (
    <section id="panel-tindakan" className="card">
      <div className="title-row">
        <h3>Apa tindakan yang sesuai?</h3>
        <p className="muted">Pilih tab ikut keadaan kerusi.</p>
      </div>
      <div className="action-tabs" role="tablist" aria-label="Pilihan tindakan">
        <button type="button" role="tab" aria-selected={activeTab === "kekalkan"} className={activeTab === "kekalkan" ? "active" : ""} onClick={() => setActiveTab("kekalkan")}>Kekalkan</button>
        <button type="button" role="tab" aria-selected={activeTab === "yakinkan"} className={activeTab === "yakinkan" ? "active" : ""} onClick={() => setActiveTab("yakinkan")}>Yakinkan</button>
        <button type="button" role="tab" aria-selected={activeTab === "keluar_mengundi"} className={activeTab === "keluar_mengundi" ? "active" : ""} onClick={() => setActiveTab("keluar_mengundi")}>Keluar Mengundi</button>
      </div>
      <p className="context-label">{recommendation}</p>
      <ul className="action-list">
        {actionSteps[activeTab].map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
};

export default ActionPanel;
