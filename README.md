# Business Services Sales Dashboard 2026

Dashboard interaktif untuk menvisualisasikan data jualan cuci karpet, kasut, langsir, sofa, dan tilam bagi tahun 2026.

## Ciri-Ciri Utama
- **KPI Ringkasan**: Jumlah Jualan, Bilangan Resit, Purata Nilai Resit (AOV), dan Pertumbuhan Bulan-ke-Bulan.
- **Carta Visual**: Graf tren jualan bulanan, perkongsian jualan mengikut kategori, dan nisbah jualan berbanding bilangan resit menggunakan **Chart.js**.
- **Jadual Data**: Paparan terperinci data jualan yang boleh ditapis mengikut bulan atau perkhidmatan serta boleh disusun (sortable).
- **Import Fail**: Membolehkan pengguna memuat naik fail JSON baharu untuk mengemaskini dashboard.
- **Penyimpanan Tempatan**: Data disimpan secara automatik dalam `localStorage` pelayar web anda supaya data tidak hilang apabila halaman dimuat semula.
- **GitHub Sync (Pilihan)**: Kebolehan untuk menyegerakkan data ke repositori GitHub secara terus dari pelayar.

## Cara Penggunaan
1. Buka fail `index.html` terus di dalam mana-mana pelayar web, ATAU
2. Jalankan pelayan web tempatan (local web server) di direktori ini:
   ```bash
   npx http-server
   ```
   kemudian layari alamat yang diberikan (biasanya `http://localhost:8080`).

## Struktur Fail
- `index.html` - Struktur utama antaramuka dashboard.
- `css/custom.css` - Reka bentuk premium dan responsif (menggunakan Tailwind CSS & Vanilla CSS).
- `js/dashboard.js` - Logik kawalan UI utama.
- `js/charts.js` - Konfigurasi dan penjanaan graf Chart.js.
- `js/storage.js` - Menguruskan penyimpanan data (LocalStorage/GitHub).
- `js/import.js` - Logik parsing dan import fail data jualan.
- `data/sample-data.json` - Fail data jualan awal tahun 2026 (Jan – Apr).
