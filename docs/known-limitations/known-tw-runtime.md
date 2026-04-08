# runtime -- Known Limitations

## 1. Package ini output compiler -- jangan ditulis manual
- **Status**: By design
- **Impact**: `createStyledComponent()` dimaksudkan untuk output compiler, bukan dipakai langsung
- **Workaround**: Gunakan `tw.*` API dari `tailwind-styled-v4` untuk authoring

## 2. Sub-component tidak inherit style base
- **Status**: By design -- lihat README pattern inheritance
- **Impact**: `<Card.Header>` tidak otomatis mewarisi class dari `<Card>`
- **Workaround**: Gunakan salah satu dari 3 pattern di README (base variable, .extend(), atau tw() wrapper)

## 3. Live token API adalah re-export dari `@tailwind-styled/theme`
- **Status**: Informasi
- **Impact**: Update ke token API harus melihat di `@tailwind-styled/theme`, bukan di sini
- **Note**: Re-export dijaga agar backward-compatible selama compatibility window masih open