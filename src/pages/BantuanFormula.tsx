const kpiDocs = [
  { tajuk: "Undi Sah", maksud: "Anggaran undi yang sah selepas tolak undi rosak.", formula: "registered × turnout × (1-spoiled)", contoh: "10,000 × 0.7 × 0.98 = 6,860", tindakan: "Pastikan unjuran turnout realistik ikut lokaliti." },
  { tajuk: "UMM", maksud: "Undi minimum untuk lepasi lawan teratas.", formula: "Undi lawan tertinggi + 1", contoh: "4,500 + 1 = 4,501", tindakan: "Jadikan asas sasaran minimum operasi." },
  { tajuk: "WVT", maksud: "Sasaran selamat BN selepas buffer.", formula: "UMM + Buffer", contoh: "4,501 + 200 = 4,701", tindakan: "Tetapkan target mingguan ke arah WVT." },
  { tajuk: "TotalVote", maksud: "Jumlah undi dijangka BN.", formula: "Base + Persuasi + GOTV", contoh: "3,000 + 900 + 400 = 4,300", tindakan: "Imbangkan usaha tiga komponen." },
  { tajuk: "GapToWVT", maksud: "Jurang semasa berbanding sasaran selamat.", formula: "WVT - TotalVote", contoh: "4,701 - 4,300 = 401", tindakan: "Jika positif, tambah operasi; jika negatif, kekalkan." },
  { tajuk: "SwingMin", maksud: "Anggaran minimum undi swing untuk ubah keputusan.", formula: "floor(Majority/2)+1", contoh: "floor(1,000/2)+1 = 501", tindakan: "Rancang kempen berfokus pengundi atas pagar." },
  { tajuk: "Swing%", maksud: "Saiz swing berbanding undi sah.", formula: "(Majority/2)/UndiSah", contoh: "500/25,000 = 2%", tindakan: "Banding tahap kesukaran antara kerusi." },
  { tajuk: "BN_MarginToWin", maksud: "Undi tambahan BN perlu jika belum menang.", formula: "(winner_votes - bn_votes) + 1", contoh: "5,200 - 4,850 +1 = 351", tindakan: "Jika kecil, aktifkan serangan sasaran dekat." },
  { tajuk: "BN_BufferToLose", maksud: "Ruang undi BN boleh susut sebelum kalah.", formula: "(bn_votes - runner_up_votes) - 1", contoh: "5,300 - 5,000 -1 = 299", tindakan: "Jika kecil, fokus pertahanan base + GOTV." },
];

const BantuanFormula = () => (
  <section className="stack">
    <div className="card">
      <h2>Bantuan & Maksud Angka</h2>
      <p className="muted">Setiap KPI diterangkan dengan maksud, formula ringkas, contoh kecil, dan tindakan praktikal untuk jentera BN.</p>
    </div>
    {kpiDocs.map((item) => (
      <article key={item.tajuk} className="card">
        <h3>{item.tajuk}</h3>
        <p><strong>Maksud:</strong> {item.maksud}</p>
        <p><strong>Formula:</strong> {item.formula}</p>
        <p><strong>Contoh:</strong> {item.contoh}</p>
        <p><strong>Apa tindakan:</strong> {item.tindakan}</p>
      </article>
    ))}
  </section>
);

export default BantuanFormula;
