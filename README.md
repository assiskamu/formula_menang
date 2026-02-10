# Formula Menang Dashboard BN (Sabah)

Aplikasi ini fokus kepada **BN War Room** untuk kerusi Parlimen + DUN Sabah.

## Fokus utama

- Bezakan kerusi **Defend** (BN menang) vs **Sasaran** (BN belum menang).
- Guna tag praktikal: `risiko_tinggi/sederhana/rendah` dan `Sasaran Dekat/Sederhana/Jauh`.
- Bantu petugas faham setiap KPI melalui tooltip + halaman bantuan penuh.

## Formula BN penting

- **ValidVotes / Undi Sah** = `registered × turnout × (1-spoiled)`
- **BN_MarginToWin** = `(winner_votes - bn_votes) + 1` *(jika BN belum menang)*
- **BN_MarginToWinPct** = `BN_MarginToWin / ValidVotes`
- **BN_BufferToLose** = `(bn_votes - runner_up_votes) - 1` *(jika BN menang)*
- **MajorityPct** = `majority_votes / ValidVotes`
- **GapToWVT** = `WVT - TotalVote`

## Threshold default (boleh ubah di panel Tetapan)

Rujuk `data/thresholds.json`:

- **Attack (BN belum menang)**
  - Sasaran Dekat: `margin_votes <= 500` **atau** `margin_pct <= 0.02`
  - Sasaran Sederhana: `margin_votes <= 1500` **atau** `margin_pct <= 0.05`
  - Sasaran Jauh: selainnya
- **Defend (BN menang)**
  - Risiko Tinggi: `majority_votes <= 300` **atau** `majority_pct <= 0.01`
  - Risiko Sederhana: `majority_votes <= 800` **atau** `majority_pct <= 0.025`
  - Risiko Rendah: selainnya

Tetapan ini disimpan dalam `localStorage` secara automatik.

## Halaman utama

- **Ringkasan BN War Room**: KPI utama, Top 10 Sasaran Dekat, Top 10 Paling Berisiko, jadual status + cadangan tindakan.
- **Funnel Kempen**: Base/Persuasi/GOTV + GapToWVT.
- **Operasi GOTV**: keutamaan kerusi ikut jurang GOTV.
- **Bantuan & Maksud Angka**: glossari formula, contoh, dan tindakan.

## Jalankan aplikasi

```bash
npm install
npm run dev
```

## Ujian & binaan

```bash
npm run test
npm run build
```

## Kemas kini data

Sumber runtime berada dalam `public/data/`:

- `parlimen_sabah.csv`
- `dun_sabah.csv`
- `prn_sabah_baseline.csv`
- `progress_weekly.csv`
- `assumptions.json`
- `thresholds.json`

Kemas kini data, semak paparan, kemudian jalankan ujian sebelum push.

## Key-in data terus dari UI + Export/Import

Gunakan tab **Kemas Kini Data** untuk masukkan data tanpa CSV:

1. Pilih DUN (boleh cari kod/nama).
2. Isi **Butiran Kerusi**: Registered Voters, Total Votes Cast, Turnout %, Majority.
3. Isi **Undi Setiap Calon** (tambah/buang baris, auto kira % undi, auto kira majoriti).
4. Simpan perubahan. Data disimpan ke `localStorage` browser (bukan server).

Pilihan pengurusan data tempatan:

- **Export Data (JSON)** untuk backup/share fail override.
- **Import Data (JSON) [Merge]** untuk gabung data baharu dengan data sedia ada.
- **Import Data (JSON) [Replace]** untuk ganti semua override tempatan.
- **Reset local changes** untuk padam semua override tempatan.

Keutamaan data runtime:

1. Local overrides (`localStorage`) — paling tinggi.
2. CSV enriched jika tersedia (`seat_details_enriched_v3.csv`, `seat_details_enriched_with_candidates_v2.csv`).
3. Master winners (`prn_sabah_2025_winners.csv`) sebagai fallback.

Senarai 73 DUN daripada `prn_sabah_2025_winners.csv` sentiasa dikekalkan.
