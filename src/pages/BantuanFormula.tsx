const kpiDocs = [
  { tajuk: "UMM", maksud: "Undi minimum untuk melepasi lawan teratas.", formula: "Undi lawan tertinggi + 1" },
  { tajuk: "WVT", maksud: "Sasaran selamat selepas tambah buffer.", formula: "UMM + Buffer" },
  { tajuk: "GapToWVT", maksud: "Baki undi untuk capai sasaran WVT.", formula: "WVT - TotalVote" },
  { tajuk: "Base/Persuasion/GOTV", maksud: "Komponen undi teras, pujukan atas pagar, dan mobilisasi hari mengundi.", formula: "Base + Persuasion + GOTV" },
  { tajuk: "SwingMin", maksud: "Anggaran undi swing minimum untuk ubah keputusan.", formula: "floor(Majoriti/2)+1" },
  { tajuk: "Swing%", maksud: "Peratus swing berbanding undi sah.", formula: "(Majoriti/2)/UndiSah" },
  { tajuk: "BN_MarginToWin", maksud: "Jika BN kalah, tambahan undi yang diperlukan untuk memintas pemenang.", formula: "(winner_votes - bn_votes) + 1" },
];

const BantuanFormula = () => (
  <section className="stack">
    <div className="card">
      <h2>Bantuan</h2>
      <p className="muted">Maksud istilah utama untuk kegunaan petugas lapangan.</p>
    </div>
    {kpiDocs.map((item) => (
      <article key={item.tajuk} className="card">
        <h3>{item.tajuk}</h3>
        <p>{item.maksud}</p>
        <p><strong>Formula:</strong> {item.formula}</p>
      </article>
    ))}
  </section>
);

export default BantuanFormula;
