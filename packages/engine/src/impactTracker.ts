import type { ScanFileResult, ScanWorkspaceResult } from "@tailwind-styled/scanner"
import { type BundleAnalysisResult, BundleAnalyzer } from "./bundleAnalyzer"

type ImpactScanFile = ScanFileResult & {
  variants?: string[]
  lineNumbers?: number[]
  columnNumbers?: number[]
}

export interface ImpactReport {
  className: string
  totalComponents: number
  directUsage: number
  indirectUsage: number
  bundleSizeBytes: number
  estimatedSavings: number
  riskLevel: "low" | "medium" | "high"
  suggestions: string[]
}

export interface ComponentImpact {
  file: string
  line: number
  column: number
  usageType: "direct" | "variant" | "component"
  variant?: string
}

export class ImpactTracker {
  private bundleAnalyzer: BundleAnalyzer
  private criticalPatterns = [
    "fixed",
    "absolute",
    "sticky",
    "z-50",
    "z-index",
    "top-0",
    "right-0",
    "bottom-0",
    "left-0",
    "w-full",
    "h-full",
    "min-h-screen",
    "flex",
    "grid",
    "block",
    "inline",
    "hidden",
    "visible",
    "opacity",
    "pointer-events",
    "cursor",
  ]

  constructor() {
    this.bundleAnalyzer = new BundleAnalyzer()
  }

  /**
   * Analisis impact sebuah class menggunakan BundleAnalyzer untuk dapat
   * data akurat tentang bundle size contribution.
   *
   * @param className - Tailwind class yang ingin dianalisis
   * @param scanResult - Hasil scan workspace
   * @param css - CSS string dari build output (opsional — jika tidak ada, gunakan estimasi)
   */
  analyzeWithBundle(
    className: string,
    scanResult: ScanWorkspaceResult,
    css = ""
  ): ImpactReport {
    const normalizedClass = className.startsWith(".") ? className.slice(1) : className

    let bundleAnalysis: BundleAnalysisResult | null = null
    try {
      if (scanResult && css) {
        bundleAnalysis = this.bundleAnalyzer.analyzeClass(normalizedClass, scanResult, css)
      }
    } catch {
      // BundleAnalyzer bisa throw jika css kosong atau class tidak dikenali
      // Graceful fallback ke calculateImpact tanpa bundle data
    }

    if (!bundleAnalysis) {
      // Buat BundleAnalysisResult minimal dari scan data saja
      const usedIn = (scanResult?.files ?? []).filter(f =>
        f.classes?.includes(normalizedClass)
      )
      bundleAnalysis = {
        className: normalizedClass,
        totalUsage: usedIn.length,
        files: usedIn.map(f => f.file),
        bundleSizeBytes: 0,
        variantChains: [],
        isDeadCode: usedIn.length === 0,
        dependencies: [],
      }
    }

    return this.calculateImpact(normalizedClass, bundleAnalysis, scanResult)
  }

  /**
   * Analisis semua class dalam workspace sekaligus.
   */
  analyzeAll(scanResult: ScanWorkspaceResult, css = ""): Map<string, ImpactReport> {
    const results = new Map<string, ImpactReport>()
    const classes = scanResult?.uniqueClasses ?? []

    for (const cls of classes) {
      try {
        results.set(cls, this.analyzeWithBundle(cls, scanResult, css))
      } catch {
        // skip class yang gagal dianalisis
      }
    }

    return results
  }

  calculateImpact(
    className: string,
    bundleAnalysis: BundleAnalysisResult,
    scanResult: ScanWorkspaceResult | null | undefined
  ): ImpactReport {
    if (!className || className.trim() === "") {
      return this.createEmptyReport(className)
    }

    if (!bundleAnalysis) {
      return this.createEmptyReport(className)
    }

    const normalizedClass = className.startsWith(".") ? className.slice(1) : className
    const affectedComponents = this.findAffectedComponents(normalizedClass, scanResult)

    const directUsage = affectedComponents.filter((c) => c.usageType === "direct").length
    const indirectUsage = affectedComponents.filter((c) => c.usageType !== "direct").length
    const totalComponents = affectedComponents.length

    const bundleSizeBytes = bundleAnalysis.bundleSizeBytes || 0
    const estimatedSavings = this.calculateSavings(bundleSizeBytes, totalComponents)

    const impactReport: ImpactReport = {
      className: normalizedClass,
      totalComponents,
      directUsage,
      indirectUsage,
      bundleSizeBytes,
      estimatedSavings,
      riskLevel: "low",
      suggestions: [],
    }

    impactReport.riskLevel = this.calculateRisk(normalizedClass, impactReport)
    impactReport.suggestions = this.generateSuggestions(normalizedClass, impactReport)

    return impactReport
  }

  findAffectedComponents(
    className: string,
    scanResult: ScanWorkspaceResult | null | undefined
  ): ComponentImpact[] {
    const components: ComponentImpact[] = []

    if (!className || className.trim() === "") {
      return components
    }

    if (!scanResult || !Array.isArray(scanResult.files)) {
      return components
    }

    const normalizedClass = className.startsWith(".") ? className.slice(1) : className
    const classParts = normalizedClass.split(":")

    for (const file of scanResult.files as ImpactScanFile[]) {
      if (!file || !file.file) continue

      const filePath = file.file
      const classes = file.classes || []
      const variants = file.variants || []

      for (const [i, fileClass] of classes.entries()) {
        if (!fileClass) continue

        const normalizedFileClass = fileClass.startsWith(".") ? fileClass.slice(1) : fileClass

        if (normalizedFileClass === normalizedClass) {
          components.push({
            file: filePath,
            line: file.lineNumbers?.[i] || 1,
            column: file.columnNumbers?.[i] || 1,
            usageType: "direct",
          })
        } else if (normalizedFileClass.includes(normalizedClass)) {
          const variant = classParts.length > 1 ? classParts[0] : undefined
          components.push({
            file: filePath,
            line: file.lineNumbers?.[i] || 1,
            column: file.columnNumbers?.[i] || 1,
            usageType: "variant",
            variant,
          })
        }
      }

      for (const [i, variant] of variants.entries()) {
        if (!variant) continue

        if (variant.includes(normalizedClass)) {
          const baseClass = variant.split(":").pop()
          if (baseClass === normalizedClass) {
            components.push({
              file: filePath,
              line: file.lineNumbers?.[i] || 1,
              column: file.columnNumbers?.[i] || 1,
              usageType: "variant",
              variant: variant.split(":")[0],
            })
          }
        }
      }
    }

    return components
  }

  calculateRisk(className: string, impact: ImpactReport): "low" | "medium" | "high" {
    if (!className || className.trim() === "") {
      return "low"
    }

    if (!impact) {
      return "low"
    }

    const normalizedClass = className.startsWith(".") ? className.slice(1) : className

    if (impact.totalComponents > 10) {
      return "high"
    }

    if (this.isCriticalClass(normalizedClass)) {
      return "high"
    }

    if (impact.totalComponents >= 5 && impact.totalComponents <= 10) {
      return "medium"
    }

    return "low"
  }

  generateSuggestions(className: string, impact: ImpactReport): string[] {
    const suggestions: string[] = []

    if (!className || className.trim() === "") {
      return suggestions
    }

    if (!impact) {
      return suggestions
    }

    const normalizedClass = className.startsWith(".") ? className.slice(1) : className

    if (impact.riskLevel === "high") {
      if (impact.totalComponents > 10) {
        suggestions.push(
          `This class is used in ${impact.totalComponents} components. Consider creating a utility component instead.`
        )
      }

      if (this.isCriticalClass(normalizedClass)) {
        suggestions.push(
          "This is a critical positioning/display class. Review all usages before removal."
        )
      }

      suggestions.push("Manual code review recommended before removing this class.")
    } else if (impact.riskLevel === "medium") {
      suggestions.push(
        `This class is used in ${impact.totalComponents} components. Test each component after removal.`
      )

      if (impact.indirectUsage > 0) {
        suggestions.push("Check for indirect usages via variants before removing.")
      }
    } else {
      if (impact.totalComponents > 0) {
        suggestions.push("Low risk: class is used in fewer than 5 components.")
      } else {
        suggestions.push("This class appears to be unused. Consider removing it.")
      }
    }

    if (impact.estimatedSavings > 0) {
      suggestions.push(`Estimated bundle size savings: ~${impact.estimatedSavings} bytes.`)
    }

    if (impact.bundleSizeBytes > 100) {
      suggestions.push(
        "This class has significant CSS bundle contribution. Removal will improve load times."
      )
    }

    return suggestions
  }

  private isCriticalClass(className: string): boolean {
    const normalized = className.startsWith(".") ? className.slice(1) : className
    return this.criticalPatterns.some(
      (pattern) => normalized === pattern || normalized.startsWith(`${pattern}:`)
    )
  }

  private calculateSavings(bundleSize: number, componentCount: number): number {
    const baseSavings = bundleSize
    const componentOverhead = componentCount * 50
    return Math.max(0, baseSavings - componentOverhead)
  }

  private createEmptyReport(className: string): ImpactReport {
    const normalizedClass = className?.startsWith(".") ? className.slice(1) : className || ""
    return {
      className: normalizedClass,
      totalComponents: 0,
      directUsage: 0,
      indirectUsage: 0,
      bundleSizeBytes: 0,
      estimatedSavings: 0,
      riskLevel: "low",
      suggestions: ["Invalid class name or analysis data."],
    }
  }
}
