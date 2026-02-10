# Formula Menang Dashboard (Sabah Sahaja)

Dashboard kempen statik untuk memantau ringkasan **Parlimen + DUN Sabah**.

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

## Dataset Sabah

Master dataset disediakan dalam `/data` dan disalin ke `public/data` untuk loading dalam app:

- `data/parlimen_sabah.csv` – P.167 hingga P.191 (Labuan P.166 dikecualikan).
- `data/dun_sabah.csv` – pemetaan Parlimen Sabah ke DUN N.01 hingga N.73.
- `public/data/progress_weekly.csv` – data mingguan berasaskan DUN.
- `public/data/assumptions.json` – senario turnout dan parameter formula.

## Grain KPI yang disokong

KPI dikira dengan formula asal, tetapi kini menyokong 2 grain:

- **Parlimen**: agregat (jumlah) daripada semua DUN di bawah Parlimen.
- **DUN**: metrik per DUN.

## Andaian data pemilih DUN (ESTIMATE)

Jika jumlah pemilih DUN tidak disediakan, sistem menganggarkan:

`registered_voters_dun = jumlah_pemilih_parlimen / bilangan_dun_dalam_parlimen`

Paparan UI melabelkan rekod ini sebagai **ESTIMATE** dan menambah flag kualiti data `Data pemilih DUN: ESTIMATE`.

## Penapis UI

Dashboard kini ada penapis berikut:

- Parlimen (Sabah sahaja)
- DUN (cascading ikut Parlimen)
- Senario turnout
- Paparan grain (Parlimen / DUN)

Paparan lalai ialah **Ringkasan Parlimen** dengan butang **Drilldown DUN**.
