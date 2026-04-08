# shared -- Known Limitations

## 1. Generated types mungkin stale
- **Status**: Perlu maintenance manual
- **Impact**: Jika `native/src/lib.rs` berubah tapi `npm run wave1:gate` tidak dijalankan, types TS bisa tidak sinkron
- **Workaround**: Jalankan `npm run wave1:gate` sebelum commit perubahan ke `native/`

## 2. `wrapUnknownError` wrap semua error ke TwError
- **Status**: By design
- **Impact**: Stack trace dari library third-party mungkin tidak terlihat
- **Workaround**: Set `TWS_LOG_LEVEL=debug` untuk lihat original error

## 3. LRU cache tidak ada TTL
- **Status**: Known
- **Impact**: Cache tidak expire berdasarkan waktu -- hanya evicted saat kapasitas penuh
- **Workaround**: Clear manual atau restart process

## 4. Telemetry toggle via env var saja
- **Status**: Backlog
- **Impact**: Tidak ada UI untuk toggle telemetry
- **Workaround**: Set `TWS_TELEMETRY=0` di `.env` atau env var


## 5. `TWS_LOG_LEVEL` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah log level
- **Workaround**: Set `TWS_LOG_LEVEL` di env var sebelum start process
     TWS_LOG_LEVEL=debug npm run dev
     
## 6. `TWS_TELEMETRY` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah telemetry
- **Workaround**: Set `TWS_TELEMETRY=0` di env var sebelum start process

     TWS_TELEMETRY=0 npm run dev
     
## 7. `TWS_CACHE_DIR` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah cache dir
- **Workaround**: Set `TWS_CACHE_DIR` di env var sebelum start process

     TWS_CACHE_DIR=/tmp/cache npm run dev
     
## 8. `TWS_DATA_DIR` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah data dir
- **Workaround**: Set `TWS_DATA_DIR` di env var sebelum start process

     TWS_DATA_DIR=/tmp/data npm run dev
     
## 9. `TWS_CONFIG_DIR` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah config dir
- **Workaround**: Set `TWS_CONFIG_DIR` di env var sebelum start process

     TWS_CONFIG_DIR=/tmp/config npm run dev
     
## 10. `TWS_TEMP_DIR` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah temp dir
- **Workaround**: Set `TWS_TEMP_DIR` di env var sebelum start process

     TWS_TEMP_DIR=/tmp/temp npm run dev
     
## 11. `TWS_PORT` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah port
- **Workaround**: Set `TWS_PORT` di env var sebelum start process

     TWS_PORT=3001 npm run dev
     
## 12. `TWS_HOST` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah host
- **Workaround**: Set `TWS_HOST` di env var sebelum start process

     TWS_HOST=0.0.0.0 npm run dev
     
## 13. `TWS_HTTPS` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah HTTPS
- **Workaround**: Set `TWS_HTTPS=1` di env var sebelum start process

     TWS_HTTPS=1 npm run dev
     
## 14. `TWS_SSL_CERT` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL cert
- **Workaround**: Set `TWS_SSL_CERT` di env var sebelum start process

     TWS_SSL_CERT=/path/to/cert.pem npm run dev

## 15. `TWS_SSL_KEY` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL key
- **Workaround**: Set `TWS_SSL_KEY` di env var sebelum start process

     TWS_SSL_KEY=/path/to/key.pem npm run dev
     
## 16. `TWS_SSL_CA` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL CA
- **Workaround**: Set `TWS_SSL_CA` di env var sebelum start process

     TWS_SSL_CA=/path/to/ca.pem npm run dev
     
## 17. `TWS_SSL_PASSPHRASE` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL passphrase
- **Workaround**: Set `TWS_SSL_PASSPHRASE` di env var sebelum start process

     TWS_SSL_PASSPHRASE=mysecret npm run dev
     
## 18. `TWS_SSL_REJECT_UNAUTHORIZED` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL reject unauthorized
- **Workaround**: Set `TWS_SSL_REJECT_UNAUTHORIZED=0` di env var sebelum start process

     TWS_SSL_REJECT_UNAUTHORIZED=0 npm run dev
     
## 19. `TWS_SSL_CIPHERS` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL ciphers
- **Workaround**: Set `TWS_SSL_CIPHERS` di env var sebelum start process

     TWS_SSL_CIPHERS=ECDHE-RSA-AES128-GCM-SHA256 npm run dev
     
## 20. `TWS_SSL_MIN_VERSION` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL min version
- **Workaround**: Set `TWS_SSL_MIN_VERSION` di env var sebelum start process

     TWS_SSL_MIN_VERSION=TLSv1.2 npm run dev
     
## 21. `TWS_SSL_MAX_VERSION` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL max version
- **Workaround**: Set `TWS_SSL_MAX_VERSION` di env var sebelum start process

     TWS_SSL_MAX_VERSION=TLSv1.3 npm run dev
     
## 22. `TWS_SSL_CRL` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL CRL
- **Workaround**: Set `TWS_SSL_CRL` di env var sebelum start process

     TWS_SSL_CRL=/path/to/crl.pem npm run dev
     
## 23. `TWS_SSL_HONOR_CIPHER_ORDER` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL honor cipher order
- **Workaround**: Set `TWS_SSL_HONOR_CIPHER_ORDER` di env var sebelum start process

     TWS_SSL_HONOR_CIPHER_ORDER=1 npm run dev
     
## 24. `TWS_SSL_ECDH_CURVE` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL ECDH curve
- **Workaround**: Set `TWS_SSL_ECDH_CURVE` di env var sebelum start process

     TWS_SSL_ECDH_CURVE=prime256v1 npm run dev
     
## 25. `TWS_SSL_SESSION_TIMEOUT` tidak bisa diubah runtime
- **Status**: Backlog
- **Impact**: Harus restart process untuk mengubah SSL session timeout
- **Workaround**: Set `TWS_SSL_SESSION_TIMEOUT` di env var sebelum start process

     TWS_SSL_SESSION_TIMEOUT=3600 npm run dev