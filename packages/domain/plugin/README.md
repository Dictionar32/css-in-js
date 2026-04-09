# Plugins

## Vite Plugin

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { tailwindStyledPlugin } from "@tailwind-styled/vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindStyledPlugin({
      generateSafelist: true,
      useEngineBuild: true,
      scanReportOutput: ".tailwind-styled-scan-report.json",
    }),
  ],
})
```

## Rspack Plugin

```ts
import { tailwindStyledRspackPlugin } from "@tailwind-styled/rspack"

export default {
  plugins: [tailwindStyledRspackPlugin()],
}
```

## Next.js Plugin

```ts
// next.config.ts
import { withTailwindStyled } from "tailwind-styled-v4/next"

export default withTailwindStyled({
  routeCss: true,           // CSS splitting per route (production)
  deadStyleElimination: true,
  staticVariants: true,
  devtools: true,           // DevTools overlay di development
})(nextConfig)
```

## Engine plugins

Plugin engine memungkinkan hook ke lifecycle scan/build/watch:

```ts
import { createEngine } from "@tailwind-styled/engine"

const engine = await createEngine({
  root: process.cwd(),
  plugins: [
    {
      name: "my-plugin",
      beforeScan(ctx) { console.log("scanning...") },
      transformClasses(classes) {
        // Filter atau tambah classes
        return classes.filter(c => !c.startsWith("debug-"))
      },
      afterBuild(result) {
        console.log(`built: ${result.mergedClassList.split(" ").length} classes`)
      },
    },
  ],
})
```

Plugin hooks: `beforeScan`, `afterScan`, `transformClasses`, `beforeBuild`, `afterBuild`, `onError`

## Object Config Transform Hook

Plugin package `@tailwind-styled/plugin` sekarang bisa memodifikasi konfigurasi `tw.tag({ ... })`
sebelum compiler menghasilkan kode.

```ts
import { use, type TwPlugin } from "@tailwind-styled/plugin"

const brandVariantPlugin: TwPlugin = {
  name: "brand-variant-plugin",
  setup(ctx) {
    ctx.addTransform((config, meta) => {
      if (meta.tag !== "button") return config
      return {
        ...config,
        variants: {
          ...config.variants,
          brand: {
            primary: "bg-blue-600 text-white",
            secondary: "bg-gray-200 text-gray-800",
          },
        },
        defaultVariants: {
          ...config.defaultVariants,
          brand: "primary",
        },
      }
    })
  },
}

use(brandVariantPlugin)
```

## Plugin registry

```bash
tw plugin search animation      # cari plugin
tw plugin info @tailwind-styled/plugin-animation  # detail plugin
tw plugin install @tailwind-styled/plugin-animation  # install
```

Lihat [docs/plugin-registry.md](plugin-registry.md) untuk dokumentasi lengkap.

## Animate Plugin

```ts
import { use } from "@tailwind-styled/plugin"
import { pluginAnimation } from "@tailwind-styled/plugin/plugins"

use(pluginAnimation({
  defaultDuration: "200ms",
  defaultEasing: "ease-out",
}))

// Sekarang komponen bisa pakai preset animasi
import { animations, injectAnimationCss } from "@tailwind-styled/animate"

const fadeInCss = await animations.fadeIn()
injectAnimationCss(fadeInCss.css)
```

## Theme Plugin

```ts
import { use } from "@tailwind-styled/plugin"
import { pluginTokens } from "@tailwind-styled/plugin/plugins"

use(pluginTokens({
  brand: "#ff6b6b",
  "brand-dark": "#cc5555",
  radius: "0.75rem",
}))

// Token tersedia sebagai CSS variable di semua komponen
const Button = tw.button`
  bg-[var(--tw-brand)]
  hover:bg-[var(--tw-brand-dark)]
  rounded-[var(--tw-radius)]
  text-white px-4 py-2
`
```

## DevTools Integration

DevTools overlay tidak perlu konfigurasi plugin — cukup render komponen:

```tsx
// app/layout.tsx
import { TwDevTools } from "@tailwind-styled/devtools"

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV === "development" && <TwDevTools />}
      </body>
    </html>
  )
}
```

Toggle via `Ctrl+Shift+D`. Panel: Inspector, State, Container, Tokens, Analyzer, Trace.

## Storybook Integration

```ts
// .storybook/preview.ts
import { withTailwindStyled } from "@tailwind-styled/storybook-addon"
export const decorators = [withTailwindStyled]

// Button.stories.ts
import { generateArgTypes } from "@tailwind-styled/storybook-addon"
export default {
  title: "Components/Button",
  component: Button,
  argTypes: generateArgTypes(Button),
}
```

## Testing Integration

```ts
// vitest.config.ts
export default defineConfig({
  test: { setupFiles: ["@tailwind-styled/testing/setup"] }
})

// Button.test.ts
import { tailwindMatchers, expectClasses } from "@tailwind-styled/testing"
expect.extend(tailwindMatchers)

test("Button primary", () => {
  const { container } = render(<Button intent="primary" />)
  expect(container.firstChild).toHaveClasses(["bg-blue-600", "text-white"])
})
```