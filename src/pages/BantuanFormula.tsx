const kpiDocs = [
  {
    tajuk: "Undi Sah (Anggaran)",
    maksud: "Anggaran jumlah undi yang benar-benar sah pada hari mengundi.",
    formula: "Berdaftar × Turnout × (1 − Undi Rosak)",
    contoh: "Contoh: 10,000 × 0.65 × (1 − 0.02) = 6,370 undi.",
    tindakan: "Jika kecil, semak semula andaian turnout atau data pemilih.",
  },
  {
    tajuk: "UMM (Minimum Menang)",
    maksud: "Undi paling minimum untuk potong lawan tertinggi.",
    formula: "Undi lawan tertinggi + 1",
    contoh: "Contoh: lawan 4,000, maka UMM = 4,001.",
    tindakan: "Pastikan jumlah undi dijangka melepasi angka ini dulu.",
  },
  {
    tajuk: "WVT (Sasaran Selamat)",
    maksud: "Sasaran lebih selesa selepas tambah buffer keselamatan.",
    formula: "UMM + Buffer (buffer_votes atau buffer_rate)",
    contoh: "Contoh: UMM 4,001 + buffer 200 = 4,201.",
    tindakan: "Gunakan untuk sasaran kerja pasukan lapangan mingguan.",
  },
  {
    tajuk: "Jumlah Undi Dijangka",
    maksud: "Gabungan undi asas, persuasi, dan GOTV.",
    formula: "Base + Persuasion + GOTV",
    contoh: "Contoh: 3,500 + 800 + 400 = 4,700.",
    tindakan: "Jika perlahan naik, tambah aktiviti persuasi atau GOTV ikut jurang.",
  },
  {
    tajuk: "Jurang ke Sasaran",
    maksud: "Baki undi yang masih kurang untuk capai WVT.",
    formula: "WVT − TotalVote",
    contoh: "Contoh: 4,201 − 4,700 = -499 (sudah lepas sasaran).",
    tindakan: "Jika positif, masih kurang undi dan perlu tindakan segera.",
  },
  {
    tajuk: "Swing Min (Anggaran)",
    maksud: "Anggaran bilangan undi swing minimum untuk ubah keputusan.",
    formula: "floor(Majoriti/2) + 1",
    contoh: "Contoh: majoriti 1,000 → 501 undi swing.",
    tindakan: "Paling sesuai untuk kerusi 2 penjuru; guna sebagai panduan awal.",
  },
  {
    tajuk: "Swing %",
    maksud: "Peratus swing berbanding undi sah.",
    formula: "≈ (Majoriti/2) / UndiSah",
    contoh: "Contoh: 500 / 6,370 = 7.85%.",
    tindakan: "Jika kecil (≤2%), kerusi dekat dan perlu fokus pertahan + mobilisasi.",
  },
];

const BantuanFormula = () => (
  <section className="stack">
    <div className="card">
      <h2>Bantuan & Maksud Formula</h2>
      <p className="muted">Rujukan ringkas untuk faham nombor dan tindakan lapangan.</p>
    </div>
    {kpiDocs.map((item) => (
      <article key={item.tajuk} className="card">
        <h3>{item.tajuk}</h3>
        <p><strong>Maksud mudah:</strong> {item.maksud}</p>
        <p><strong>Formula ringkas:</strong> {item.formula}</p>
        <p><strong>Contoh kiraan:</strong> {item.contoh}</p>
        <p><strong>Apa tindakan?</strong> {item.tindakan}</p>
      </article>
    ))}
  </section>
);

export default BantuanFormula;
