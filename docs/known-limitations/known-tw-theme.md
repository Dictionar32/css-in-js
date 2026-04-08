# theme — Known Limitations

## 1. Live token changes tidak persisten antar session
- **Status**: By design (runtime state)
- **Impact**: Token yang diubah via `setToken()` hilang saat page reload
- **Workaround**: Persist token ke `localStorage` atau simpan ke config file, lalu load di startup:
  ```ts
  const saved = localStorage.getItem("tw-tokens")
  if (saved) applyTokenSet(JSON.parse(saved))
  ```

## 2. Rust `compileTheme` hanya untuk build time
- **Status**: By design
- **Impact**: `native.compileTheme()` tidak bisa dipanggil di browser — hanya di Node.js/build pipeline
- **Workaround**: Panggil `compileTheme` di server/build step, inject CSS ke halaman sebagai `<style>` tag

## 3. Theme switching via `data-theme` butuh CSS manual
- **Status**: By design
- **Impact**: Theme CSS (`[data-theme='dark'] { ... }`) harus di-inject ke halaman secara manual
- **Workaround**:
  ```ts
  document.head.insertAdjacentHTML("beforeend", `<style>${darkTheme.css}</style>`)
  document.documentElement.setAttribute("data-theme", "dark")
  ```

## 4. `defineThemeContract` tidak support nested optional tokens
- **Status**: Known
- **Impact**: Semua token dalam kontrak wajib diisi di setiap tema — tidak ada `optional` field
- **Workaround**: Gunakan empty string `""` sebagai placeholder untuk token opsional