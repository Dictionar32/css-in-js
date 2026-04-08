declare module "@tailwind-styled/shared" {
  export type VariantValue = string | number | boolean | undefined
  export type VariantProps = Record<string, VariantValue>
  export type HtmlTagName = keyof HTMLElementTagNameMap
}
