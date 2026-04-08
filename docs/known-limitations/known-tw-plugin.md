# plugin -- Known Limitations

## 1. Registry global -- bisa konflik antar library
- **Status**: Known
- **Impact**: Library yang register plugin ke global registry bisa mempengaruhi project host
- **Workaround**: Gunakan `createTw()` untuk isolated registry di library

## 2. Plugin `setup()` dipanggil sekali -- tidak bisa di-unregister
- **Status**: By design
- **Impact**: Tidak ada cara untuk remove plugin setelah di-register
- **Workaround**: Gunakan `createTw()` dengan registry baru jika perlu reset

## 3. `addTransform` hanya untuk konfigurasi objek (bukan template literal)
- **Status**: Known
- **Impact**: `ctx.addTransform()` hanya berlaku untuk `tw.button({ ... })` -- bukan `` tw.button`...` ``
- **Workaround**: Dokumentasikan ke user plugin bahwa transform hanya untuk object config

## 4. Urutan plugin mempengaruhi hasil transform
- **Status**: By design
- **Impact**: Plugin yang di-register belakangan bisa override transform plugin sebelumnya
- **Workaround**: Dokumentasikan dependency order di plugin README
