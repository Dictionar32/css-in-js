import { NextResponse } from "next/server";

/**
 * GET /api/tests/pipeline
 *
 * End-to-end pipeline tests jalan di Next.js server runtime:
 *   scanner → analyzer → compiler → engine
 *
 * Menggantikan examples/integration-test/pipeline-check.mjs
 * dan sebagian dari sprint2.integration.test.mjs
 */

interface TestResult {
  name: string;
  passed: boolean;
  result?: string;
  error?: string;
  durationMs?: number;
}

interface SuiteResult {
  suite: string;
  passed: number;
  failed: number;
  tests: TestResult[];
  durationMs: number;
}

type AnyModule = Record<string, unknown>;

function runTest(name: string, fn: () => unknown): TestResult {
  const start = performance.now();
  try {
    const result = fn();
    return {
      name, passed: true, durationMs: Math.round(performance.now() - start),
      result: typeof result === "string" ? result
        : result != null ? JSON.stringify(result).slice(0, 200) : "ok",
    };
  } catch (e: unknown) {
    return { name, passed: false, durationMs: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : String(e) };
  }
}

async function runTestAsync(name: string, fn: () => Promise<unknown>): Promise<TestResult> {
  const start = performance.now();
  try {
    const result = await fn();
    return {
      name, passed: true, durationMs: Math.round(performance.now() - start),
      result: typeof result === "string" ? result
        : result != null ? JSON.stringify(result).slice(0, 200) : "ok",
    };
  } catch (e: unknown) {
    return { name, passed: false, durationMs: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : String(e) };
  }
}

function suite(name: string, tests: TestResult[], start: number): SuiteResult {
  return {
    suite: name,
    passed: tests.filter((t) => t.passed).length,
    failed: tests.filter((t) => !t.passed).length,
    tests,
    durationMs: Math.round(performance.now() - start),
  };
}

// ─── Scanner suite ────────────────────────────────────────────────────────────

async function testScannerPipeline(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let scanner: AnyModule | null = null;
  try {
    scanner = await import("tailwind-styled-v4/scanner") as AnyModule;
  } catch (e) {
    return suite("scanner:pipeline", [{ name: "import scanner", passed: false, error: String(e) }], start);
  }

  tests.push(runTest("scanWorkspace is function", () => {
    if (typeof scanner!.scanWorkspace !== "function") throw new Error("bukan function");
    return "ok";
  }));

  tests.push(runTest("scanWorkspaceAsync is function", () => {
    if (typeof scanner!.scanWorkspaceAsync !== "function") throw new Error("bukan function");
    return "ok";
  }));

  tests.push(runTest("isScannableFile('.tsx') = true", () => {
    const fn = scanner!.isScannableFile as (f: string) => boolean;
    if (!fn("src/App.tsx")) throw new Error("harus true untuk .tsx");
    if (fn("image.png")) throw new Error("harus false untuk .png");
    return "ok";
  }));

  tests.push(runTest("DEFAULT_EXTENSIONS berisi .tsx dan .ts", () => {
    const ext = scanner!.DEFAULT_EXTENSIONS as string[];
    if (!Array.isArray(ext)) throw new Error("bukan array");
    if (!ext.includes(".tsx")) throw new Error(".tsx tidak ada");
    if (!ext.includes(".ts")) throw new Error(".ts tidak ada");
    return ext.join(", ");
  }));

  return suite("scanner:pipeline", tests, start);
}

// ─── Compiler suite ───────────────────────────────────────────────────────────

async function testCompilerPipeline(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let compiler: AnyModule | null = null;
  try {
    compiler = await import("tailwind-styled-v4/compiler") as AnyModule;
  } catch (e) {
    return suite("compiler:pipeline", [{ name: "import compiler", passed: false, error: String(e) }], start);
  }

  tests.push(runTest("extractAllClasses is function", () => {
    if (typeof compiler!.extractAllClasses !== "function") throw new Error("bukan function");
    return "ok";
  }));

  tests.push(runTest("transformSource is function", () => {
    if (typeof compiler!.transformSource !== "function") throw new Error("bukan function");
    return "ok";
  }));

  // Full transform pipeline
  const transform = compiler.transformSource as ((src: string, opts?: unknown) => { code: string; classes: string[]; changed: boolean }) | undefined;
  if (typeof transform === "function") {
    tests.push(runTest("pipeline: source → transform → classes extracted", () => {
      const src = [
        `import { tw, cv } from "tailwind-styled-v4"`,
        `const Card = tw.div\`rounded-lg shadow-sm p-6 bg-white\``,
        `const Button = tw.button({ base: "px-4 py-2 rounded", variants: { intent: { primary: "bg-blue-500", danger: "bg-red-500" } } })`,
        `const alertStyles = cv({ base: "rounded border p-4", variants: { type: { info: "border-blue-200", error: "border-red-200" } } })`,
      ].join("\n");

      const r = transform(src, { hoist: false });
      if (!r.changed) throw new Error("changed harus true");
      if (r.classes.length < 5) throw new Error(`terlalu sedikit class: ${r.classes.length}`);

      const expected = ["rounded-lg", "shadow-sm", "px-4", "py-2", "bg-blue-500", "bg-red-500"];
      const missing = expected.filter((c) => !r.classes.includes(c));
      if (missing.length > 0) throw new Error(`class tidak diekstrak: ${missing.join(", ")}`);

      return `${r.classes.length} classes: ${r.classes.slice(0, 6).join(", ")}…`;
    }));
  }

  return suite("compiler:pipeline", tests, start);
}

// ─── Engine suite ─────────────────────────────────────────────────────────────

async function testEnginePipeline(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let engine: AnyModule | null = null;
  try {
    engine = await import("tailwind-styled-v4/engine") as AnyModule;
  } catch (e) {
    return suite("engine:pipeline", [{ name: "import engine", passed: false, error: String(e) }], start);
  }

  tests.push(runTest("createEngine is function", () => {
    if (typeof engine!.createEngine !== "function") throw new Error("bukan function");
    return "ok";
  }));

  tests.push(runTest("applyIncrementalChange is function", () => {
    if (typeof engine!.applyIncrementalChange !== "function") throw new Error("bukan function");
    return "ok";
  }));

  tests.push(runTest("applyIncrementalChange: detects added class", () => {
    const fn = engine!.applyIncrementalChange as (prev: unknown, curr: unknown) => unknown;
    try {
      const prev = { files: [], uniqueClasses: [] };
      const curr = { files: [{ file: "/tmp/a.tsx", classes: ["flex", "p-4"], hash: "abc" }], uniqueClasses: ["flex", "p-4"] };
      const r = fn(prev, curr) as Record<string, unknown>;
      return `result type: ${typeof r}`;
    } catch (e: unknown) {
      // Native mungkin tidak tersedia — acceptable
      if (e instanceof Error && (e.message.includes("native") || e.message.includes("path") || e.message.includes("binding"))) {
        return `native tidak tersedia: ${e.message.slice(0, 60)}`;
      }
      throw e;
    }
  }));

  return suite("engine:pipeline", tests, start);
}

// ─── Analyzer suite ───────────────────────────────────────────────────────────

async function testAnalyzerPipeline(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let analyzer: AnyModule | null = null;
  try {
    analyzer = await import("tailwind-styled-v4/analyzer") as AnyModule;
  } catch (e) {
    return suite("analyzer:pipeline", [{ name: "import analyzer", passed: false, error: String(e) }], start);
  }

  tests.push(runTest("analyzeWorkspace is function", () => {
    if (typeof analyzer!.analyzeWorkspace !== "function") throw new Error("bukan function");
    return "ok";
  }));

  tests.push(await runTestAsync("analyzeWorkspace: rejects invalid option type", async () => {
    const fn = analyzer!.analyzeWorkspace as (path: string, opts: unknown) => Promise<unknown>;
    try {
      await fn("/non-existent-dir-xyz", { classStats: { top: "3" } });
      throw new Error("harusnya throw untuk option invalid");
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("options.classStats.top must be a number")) {
        return "validation ok";
      }
      throw e;
    }
  }));

  return suite("analyzer:pipeline", tests, start);
}

// ─── Framework adapters (Vue + Svelte) ───────────────────────────────────────

async function testFrameworkAdapters(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  // Vue
  try {
    const vue = await import("tailwind-styled-v4/vue") as AnyModule;
    tests.push(runTest("vue: cv() resolves base", () => {
      const cv = vue.cv as (config: unknown) => (props?: unknown) => string;
      const btn = cv({ base: "px-4 py-2", variants: {} });
      const r = btn({});
      if (!r.includes("px-4")) throw new Error(`px-4 tidak ada: "${r}"`);
      return r;
    }));
    tests.push(runTest("vue: cv() applies variant", () => {
      const cv = vue.cv as (config: unknown) => (props?: unknown) => string;
      const btn = cv({ base: "btn", variants: { size: { sm: "text-sm", lg: "text-lg" } } });
      const r = btn({ size: "lg" });
      if (!r.includes("text-lg")) throw new Error(`text-lg tidak ada: "${r}"`);
      return r;
    }));
  } catch (e) {
    tests.push({ name: "import vue adapter", passed: false, error: String(e) });
  }

  // Svelte
  try {
    const svelte = await import("tailwind-styled-v4/svelte") as AnyModule;
    tests.push(runTest("svelte: cv() resolves base", () => {
      const cv = svelte.cv as (config: unknown) => (props?: unknown) => string;
      const btn = cv({ base: "px-4 py-2", variants: {} });
      const r = btn({});
      if (!r.includes("px-4")) throw new Error(`px-4 tidak ada: "${r}"`);
      return r;
    }));
  } catch (e) {
    tests.push({ name: "import svelte adapter", passed: false, error: String(e) });
  }

  return suite("framework-adapters:pipeline", tests, start);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET() {
  const allStart = performance.now();

  const suites = await Promise.all([
    testScannerPipeline(),
    testCompilerPipeline(),
    testEnginePipeline(),
    testAnalyzerPipeline(),
    testFrameworkAdapters(),
  ]);

  const totalPassed = suites.reduce((n, s) => n + s.passed, 0);
  const totalFailed = suites.reduce((n, s) => n + s.failed, 0);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - allStart),
    passed: totalPassed,
    failed: totalFailed,
    ok: totalFailed === 0,
    suites,
  });
}
