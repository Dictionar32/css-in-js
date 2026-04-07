declare module "tailwind-styled-v4" {
  export const tw: any
  export const cv: any
  export const cx: any
  export const cn: any
  export const server: any
}

declare module "tailwind-styled-v4/next" {
  export const withTailwindStyled: any
}

declare module "tailwind-styled-v4/runtime-css" {
  export const TwCssInjector: any
  export const useTwClasses: any
}

declare module "tailwind-styled-v4/compiler" {
  const compiler: any
  export = compiler
}

declare module "tailwind-styled-v4/scanner" {
  const scanner: any
  export = scanner
}

declare module "tailwind-styled-v4/engine" {
  const engine: any
  export = engine
}

declare module "tailwind-styled-v4/analyzer" {
  const analyzer: any
  export = analyzer
}

declare module "tailwind-styled-v4/runtime" {
  const runtime: any
  export = runtime
}

declare module "tailwind-styled-v4/vite" {
  const viteAdapter: any
  export = viteAdapter
}

declare module "tailwind-styled-v4/rspack" {
  const rspackAdapter: any
  export = rspackAdapter
}

declare module "tailwind-styled-v4/vue" {
  const vueAdapter: any
  export = vueAdapter
}

declare module "tailwind-styled-v4/svelte" {
  const svelteAdapter: any
  export = svelteAdapter
}

declare module "tailwind-styled-v4/devtools" {
  export const TwDevTools: any
}
