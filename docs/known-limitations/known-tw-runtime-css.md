# runtime-css — Known Limitations

## 1. `requestAnimationFrame` tidak tersedia di SSR
- **Status**: By design — ada SSR fallback
- **Impact**: Di server environment, `batchedInject` langsung inject synchronous (tanpa batching)
- **Behavior**: Sudah ditangani via `typeof requestAnimationFrame === "undefined"` check

## 2. `<style id="__tw-runtime-css">` bisa konflik dengan CSP
- **Status**: Known
- **Impact**: Jika CSP tidak mengizinkan `style` injection dinamis, runtime CSS tidak bisa diterapkan
- **Workaround**: Tambahkan nonce ke injector:
  ```ts
  // Di v5.0, State Engine production wajib pakai nonce CSP
  // Inject CSS via server-rendered <style nonce="..."> bukan runtime
  ```

## 3. Dedup berdasarkan exact string match
- **Status**: By design
- **Impact**: CSS rule yang semantically identik tapi berbeda whitespace/formatting akan keduanya diinjeksi
- **Workaround**: Normalize CSS string sebelum memanggil `batchedInject`

## 4. Style element hilang jika `document.head` di-replace
- **Status**: Known edge case
- **Impact**: Framework yang mengganti `document.head` secara keseluruhan (mis. beberapa SPA routers) bisa menyebabkan style hilang
- **Behavior**: Auto-recreate style element sudah ada — akan re-inject saat DOM call berikutnya