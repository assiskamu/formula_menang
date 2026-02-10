import { glossaryTerms } from "../data/glossary";

const PeneranganIstilah = () => (
  <section className="stack">
    <div className="card">
      <h2>Penerangan Istilah</h2>
      <p className="muted">Istilah kempen ini disimpan dalam JSON supaya mudah dikemas kini pada masa depan.</p>
    </div>
    {glossaryTerms.map((term) => (
      <article className="card" key={term.nama}>
        <h3>{term.nama}</h3>
        <p><strong>Maksud mudah:</strong> {term.definition_ms}</p>
        <p><strong>Bila guna:</strong></p>
        <ul>
          {term.how_to_use.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p><strong>Contoh kiraan ringkas:</strong> {term.example}</p>
        <p><strong>Kenapa penting:</strong> Membantu keputusan kempen lebih berasaskan data dan prioriti sumber.</p>
        <p><strong>Perangkap biasa:</strong> {term.common_pitfalls}</p>
      </article>
    ))}
  </section>
);

export default PeneranganIstilah;
