# Formula Menang Dashboard (Sabah Sahaja)

Aplikasi web ini membantu pasukan kempen faham kedudukan kerusi **Parlimen dan DUN Sabah** dengan bahasa mudah.

## Tujuan app

- Tunjuk status semasa kerusi: selamat, hampir capai, atau masih tertinggal.
- Terangkan maksud formula menang terus dalam aplikasi.
- Bantu pasukan buat keputusan tindakan cepat (persuasi, GOTV, semakan data).

## Siapa boleh guna

- Ketua jentera Parlimen/DUN
- Pengarah operasi lapangan
- Petugas data asas (tanpa latar belakang teknikal)

## Jalankan secara lokal

```bash
npm install
npm run dev
```

Binaan produksi:

```bash
npm run build
npm run preview
```

## Cara update data

Semua data berada dalam `public/data/` (dan sumber asal di `data/`):

- `parlimen_sabah.csv` — senarai Parlimen Sabah sahaja
- `dun_sabah.csv` — pemetaan DUN Sabah ikut Parlimen
- `progress_weekly.csv` — kemas kini mingguan `base_votes`, `persuasion_votes`, `gotv_votes`
- `assumptions.json` — andaian turnout, undi rosak, dan buffer

Langkah ringkas:

1. Kemas kini fail CSV/JSON.
2. Pastikan kod kerusi betul (contoh `P.167`, `N.01`).
3. Jalankan `npm run dev` untuk semak paparan.
4. Jalankan `npm run test` sebelum push.

## Maksud KPI ringkas

- **Undi Sah (Anggaran)** = `Berdaftar × Turnout × (1 − Undi Rosak)`
- **UMM (Minimum Menang)** = `Undi lawan tertinggi + 1`
- **WVT (Sasaran Selamat)** = `UMM + Buffer`
- **Jumlah Undi Dijangka** = `Base + Persuasion + GOTV`
- **Jurang ke Sasaran** = `WVT − TotalVote` (positif = masih kurang undi)
- **Swing Min (anggaran)** = `floor(Majoriti/2) + 1` (sesuai rujukan kerusi 2 penjuru)
- **Swing %** ≈ `(Majoriti/2) / UndiSah`

> Rujukan penuh ada dalam menu **Bantuan & Maksud Formula** dalam app.
