export type GlossaryTerm = {
  nama: string;
  definition_ms: string;
  how_to_use: string[];
  example: string;
  common_pitfalls: string;
};

export const glossaryTerms: GlossaryTerm[] = [
  { nama: "Funnel Kempen (Awareness → Persuasion → GOTV)", definition_ms: "Aliran kerja kempen dari kenal calon, yakinkan pengundi, sampai pastikan keluar mengundi.", how_to_use: ["Rancang aktiviti ikut fasa funnel.", "Jejak jumlah undi sasaran yang berpindah setiap fasa."], example: "Awareness 8,000 → Persuasion 2,000 → GOTV 1,400 undi hadir.", common_pitfalls: "Terus fokus GOTV tanpa cukup kerja persuasion awal." },
  { nama: "Operasi GOTV", definition_ms: "Usaha hari mengundi untuk pastikan penyokong keluar dan mengundi.", how_to_use: ["Sediakan senarai pengundi sasaran ikut saluran.", "Pantau turnout setiap jam dan aktifkan pasukan jemputan."], example: "Sasaran GOTV 900, jam 2 petang capai 540 (60%).", common_pitfalls: "Tiada pemantauan masa nyata menyebabkan respon lambat." },
  { nama: "Persuasion", definition_ms: "Usaha memujuk pengundi atas pagar atau lawan lembut menyokong BN.", how_to_use: ["Utamakan lokaliti dengan margin nipis.", "Gunakan mesej isu setempat."], example: "Dari 1,000 persuadables, kadar tukar 25% = 250 undi.", common_pitfalls: "Sasar kumpulan terlalu luas tanpa segmentasi." },
  { nama: "Base (penyokong asas)", definition_ms: "Kumpulan pengundi teras yang konsisten menyokong BN.", how_to_use: ["Kekalkan komunikasi berkala.", "Pastikan mereka hadir mengundi awal."], example: "Base 3,800; jika 90% hadir, dapat 3,420 undi.", common_pitfalls: "Anggap base pasti keluar tanpa pelan mobilisasi." },
  { nama: "Swing / Swing%", definition_ms: "Perubahan undi dari satu pihak ke pihak lain berbanding pilihan raya lalu.", how_to_use: ["Banding swing antara DUN untuk prioriti.", "Gunakan Swing% untuk ukur tahap kesukaran."], example: "Perlu 500 undi pindah daripada 25,000 undi sah = Swing 2%.", common_pitfalls: "Keliru antara tambahan undi baru dan undi swing." },
  { nama: "Kerusi marginal", definition_ms: "Kerusi dengan majoriti kecil yang mudah berubah keputusan.", how_to_use: ["Naikkan intensiti jentera di kerusi marginal.", "Gabung strategi persuasion dan GOTV serentak."], example: "Majoriti 220 dianggap marginal berbanding 3,000.", common_pitfalls: "Menilai hanya pada emosi tanpa semak angka majoriti." },
  { nama: "Majoriti", definition_ms: "Beza undi pemenang dengan calon tempat kedua.", how_to_use: ["Tentukan defend vs target.", "Gunakan untuk kira risiko kehilangan kerusi."], example: "5,100 - 4,700 = majoriti 400.", common_pitfalls: "Guna majoriti lama tanpa kemas kini turnout semasa." },
  { nama: "Turnout / Peratus Keluar Mengundi", definition_ms: "Peratus pengundi berdaftar yang keluar mengundi.", how_to_use: ["Sediakan senario turnout rendah/sederhana/tinggi.", "Laraskan sasaran undi ikut turnout sebenar."], example: "12,000 berdaftar, 7,200 keluar = turnout 60%.", common_pitfalls: "Anggap turnout seragam untuk semua saluran." },
  { nama: "UMM (Undi Minimum Menang)", definition_ms: "Undi minimum untuk menang tipis, biasanya undi lawan tertinggi +1.", how_to_use: ["Jadikan sasaran minimum mingguan.", "Banding dengan total undi semasa untuk lihat jurang."], example: "Lawan tertinggi 4,950, UMM = 4,951.", common_pitfalls: "Berhenti pada UMM tanpa buffer keselamatan." },
  { nama: "WVT (Winning Vote Threshold / sasaran selamat)", definition_ms: "Sasaran undi selamat selepas tambah buffer pada UMM.", how_to_use: ["Tetapkan target operasi harian.", "Ukur prestasi funnel terhadap sasaran selamat."], example: "UMM 4,951 + buffer 200 = WVT 5,151.", common_pitfalls: "Buffer terlalu kecil untuk kerusi volatile." },
  { nama: "GapToWVT", definition_ms: "Baki undi diperlukan untuk capai WVT.", how_to_use: ["Jika positif, tambah persuasion/GOTV.", "Jika negatif, kekalkan pertahanan dan turnout."], example: "WVT 5,151 - undi semasa 4,700 = gap 451.", common_pitfalls: "Abaikan gap negatif hingga berlaku kebocoran saat akhir." },
  { nama: "Defend vs Target", definition_ms: "Defend ialah kerusi BN sedang pegang; Target ialah kerusi BN belum menang.", how_to_use: ["Asingkan sumber ikut kategori.", "Defend fokus elak bocor, Target fokus tambah undi."], example: "BN menang = defend; BN kalah 300 undi = target dekat.", common_pitfalls: "Guna strategi sama untuk defend dan target." },
];
