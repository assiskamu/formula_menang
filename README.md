# Formula Menang Dashboard

Dashboard kempen statik untuk memantau ringkasan kerusi, funnel kempen, dan operasi GOTV.

## Jalankan secara lokal

```bash
npm install
npm run dev
```

Untuk binaan produksi:

```bash
npm run build
npm run preview
```

## Kemas kini data

Fail data disimpan di `public/data/` supaya boleh diakses oleh aplikasi tanpa backend.

- `public/data/seats.csv`
- `public/data/progress_weekly.csv`
- `public/data/assumptions.json`

Setiap kali anda mengubah data, muat semula aplikasi untuk melihat kemas kini.

## KPI dan andaian

**Formula**
- `ValidVotes = registered_voters * turnout * (1 - spoiled_rate)`
- `UMM = last_opponent_top_votes + 1`
- `WVT = (last_opponent_top_votes + 1) + buffer_votes`
  - Jika `buffer_rate` disediakan, `buffer_votes = round(ValidVotes * buffer_rate)`
- `TotalVote = base_votes + persuasion_votes + gotv_votes`
- `GapToWVT = WVT - TotalVote`
- `SwingMin ≈ floor(last_majority / 2) + 1`
- `SwingPct ≈ (last_majority / 2) / ValidVotes`

**Flags kualiti data**
- turnout luar julat `[0, 1]`
- spoiled_rate luar julat `[0, 0.10]`
- `TotalVote > ValidVotes`
- `WVT > ValidVotes`

## GitHub Pages

Vite dikonfigurasi menggunakan `base` mengikut nama repo dalam `package.json`. Jika nama repo berubah, tetapkan pemboleh ubah persekitaran `VITE_BASE_PATH` semasa build.

Contoh:

```bash
VITE_BASE_PATH=/nama-repo/ npm run build
```

Workflow GitHub Actions sudah disediakan untuk deploy ke GitHub Pages pada push ke `main`.
