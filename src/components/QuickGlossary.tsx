const terms = [
  ["Kekalkan Penyokong", "Jaga penyokong sedia ada supaya kekal bersama."],
  ["Yakinkan Atas Pagar", "Pujuk pengundi yang belum pasti pilihan."],
  ["Keluar Mengundi", "Pastikan penyokong benar-benar hadir mengundi."],
  ["Perjalanan Undi", "Aliran kerja kempen dari awal hingga hari mengundi."],
  ["Pelan Hari Mengundi", "Pelan operasi untuk mobilisasi pengundi pada hari mengundi."],
  ["Majoriti", "Beza undi antara pemenang dan calon kedua."],
  ["Margin Sasaran", "Bilangan undi tambahan untuk menang kerusi lawan."],
  ["Turnout", "Peratus pengundi yang keluar mengundi."],
  ["Kerusi Risiko", "Kerusi dimenangi BN tetapi majoriti kecil."],
  ["Data Kurang", "Maklumat kerusi belum lengkap, perlu semakan lapangan."],
];

const QuickGlossary = ({ showAdvancedLink = false }: { showAdvancedLink?: boolean }) => (
  <section className="card" id="glosari-ringkas">
    <div className="title-row">
      <h3>Glosari Ringkas</h3>
      {showAdvancedLink ? <a href="#bantuan-lanjutan">Lihat penuh (Mode Lanjutan)</a> : null}
    </div>
    <div className="simple-glossary-list">
      {terms.map(([title, desc]) => (
        <p key={title}><strong>{title}:</strong> {desc}</p>
      ))}
    </div>
  </section>
);

export default QuickGlossary;
