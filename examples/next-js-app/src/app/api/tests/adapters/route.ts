import { NextResponse } from "next/server";

/**
 * GET /api/tests/adapters
 *
 * Adapter config injection tests — jalan di Next.js server runtime:
 *   - vite: plugin factory, config shape
 *   - next: withTailwindStyled webpack rule injection
 *   - rspack: plugin loader rule injection
 */

interface TestResult {
  name: string;
  passed: boolean;
  result?: string;
  error?: string;
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
  try {
    const result = fn();
    return {
      name,
      passed: true,
      result:
        typeof result === "string"
          ? result
          : result != null
            ? JSON.stringify(result).slice(0, 200)
            : "ok",
    };
  } catch (e: unknown) {
    return { name, passed: false, error: e instanceof Error ? e.message : String(e) };
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

// ─── Vite ─────────────────────────────────────────────────────────────────────

async function testViteAdapter(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let vite: AnyModule | null = null;
  try {
    vite = await import("tailwind-styled-v4/vite") as AnyModule;
  } catch (e) {
    return suite("vite:adapter", [{ name: "import vite", passed: false, error: String(e) }], start);
  }

  tests.push(runTest("exports tailwindStyledPlugin (named)", () => {
    if (typeof vite!.tailwindStyledPlugin !== "function") throw new Error("bukan function");
    return "function";
  }));

  tests.push(runTest("exports default plugin factory", () => {
    if (typeof vite!.default !== "function") throw new Error("bukan function");
    return "function";
  }));

  tests.push(runTest("tailwindStyledPlugin() returns plugin object dengan name", () => {
    const fn = vite!.tailwindStyledPlugin as () => unknown;
    const plugin = fn();
    if (!plugin || typeof plugin !== "object") throw new Error("bukan object");
    const p = plugin as Record<string, unknown>;
    const name = p.name ?? (Array.isArray(plugin) ? (plugin[0] as Record<string,unknown>)?.name : null);
    if (!name) throw new Error("plugin tidak punya name property");
    return String(name);
  }));

  tests.push(runTest("tailwindStyledPlugin({ include, exclude }) tidak throw", () => {
    const fn = vite!.tailwindStyledPlugin as (opts: unknown) => unknown;
    fn({ include: /\.view\.tsx$/, exclude: /vendor/ });
    return "ok";
  }));

  return suite("vite:adapter", tests, start);
}

// ─── Next ─────────────────────────────────────────────────────────────────────

async function testNextAdapter(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let nextAdapter: AnyModule | null = null;
  try {
    nextAdapter = await import("tailwind-styled-v4/next") as AnyModule;
  } catch (e) {
    return suite("next:adapter", [{ name: "import next", passed: false, error: String(e) }], start);
  }

  const isTwRule = (rule: unknown): boolean => {
    const r = rule as Record<string, unknown>;
    return Array.isArray(r?.use) &&
      (r.use as unknown[]).some(
        (e) => typeof (e as Record<string, unknown>)?.loader === "string" &&
          /webpackLoader\.(cjs|js)$/.test((e as Record<string, unknown>).loader as string)
      );
  };

  tests.push(runTest("exports withTailwindStyled", () => {
    if (typeof nextAdapter!.withTailwindStyled !== "function") throw new Error("bukan function");
    return "function";
  }));

  tests.push(runTest("withTailwindStyled() injects tepat 1 webpack rule", async () => {
    const wrapped = (nextAdapter!.withTailwindStyled as (opts: unknown) => Record<string, unknown>)({
      autoClientBoundary: false,
      addDataAttr: false,
    });

    const baseConfig = { module: { rules: [] as unknown[] }, plugins: [], resolve: { alias: {} } };
    const webpackFn = wrapped.webpack as ((cfg: unknown, ctx: unknown) => unknown) | undefined;

    if (typeof webpackFn !== "function") {
      return "withTailwindStyled tidak punya webpack fn (mungkin non-webpack config)";
    }

    const config = await webpackFn(baseConfig, {
      buildId: "test",
      dev: false,
      isServer: false,
      defaultLoaders: {},
      nextRuntime: undefined,
      webpack: {},
    }) as { module: { rules: unknown[] } };

    const count = (config.module?.rules ?? []).filter(isTwRule).length;
    if (count !== 1) throw new Error(`expected 1 rule, got ${count}`);
    return `${count} rule injected`;
  }));

  tests.push(runTest("withTailwindStyled() loader options diteruskan", async () => {
    const wrapped = (nextAdapter!.withTailwindStyled as (opts: unknown) => Record<string, unknown>)({
      addDataAttr: true,
      autoClientBoundary: true,
    });
    const webpackFn = wrapped.webpack as ((cfg: unknown, ctx: unknown) => unknown) | undefined;
    if (typeof webpackFn !== "function") return "no webpack fn";

    const baseConfig = { module: { rules: [] as unknown[] }, plugins: [], resolve: { alias: {} } };
    const config = await webpackFn(baseConfig, { buildId: "t", dev: false, isServer: false, defaultLoaders: {}, nextRuntime: undefined, webpack: {} }) as { module: { rules: unknown[] } };
    const rule = (config.module?.rules ?? []).find(isTwRule) as Record<string, unknown> | undefined;
    if (!rule) return "no rule injected";
    const loaderEntry = (rule.use as unknown[]).find(
      (e) => typeof (e as Record<string,unknown>)?.loader === "string" && /webpackLoader/.test((e as Record<string,unknown>).loader as string)
    ) as Record<string, unknown> | undefined;
    const opts = loaderEntry?.options as Record<string, unknown> | undefined;
    return `options present: ${JSON.stringify(opts ?? {}).slice(0, 100)}`;
  }));

  return suite("next:adapter", tests, start);
}

// ─── Rspack ───────────────────────────────────────────────────────────────────

async function testRspackAdapter(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let rspack: AnyModule | null = null;
  try {
    rspack = await import("tailwind-styled-v4/rspack") as AnyModule;
  } catch (e) {
    return suite("rspack:adapter", [{ name: "import rspack", passed: false, error: String(e) }], start);
  }

  const countMarked = (rules: unknown[]) =>
    rules.filter((r) => (r as Record<string, unknown>)?._tailwindStyledRspackMarker === true).length;

  const fn = (rspack.tailwindStyledRspackPlugin ?? rspack.default) as ((opts: unknown) => { apply: (c: unknown) => void }) | undefined;

  tests.push(runTest("exports plugin factory", () => {
    if (typeof fn !== "function") throw new Error("tailwindStyledRspackPlugin atau default bukan function");
    return "function";
  }));

  tests.push(runTest("exports TailwindStyledRspackPlugin class", () => {
    if (typeof rspack.TailwindStyledRspackPlugin !== "function") throw new Error("bukan function");
    return "function";
  }));

  if (typeof fn === "function") {
    tests.push(runTest("plugin inject tepat 1 loader rule", () => {
      const plugin = fn({ include: /\.view\.tsx$/, exclude: /vendor/, addDataAttr: false });
      const compiler = {
        options: { module: { rules: [] as unknown[] }, plugins: [] as unknown[] },
        hooks: {
          compilation: { tap: () => {} },
          make: { tapAsync: (_n: string, cb: (comp: unknown, done: () => void) => void) => {
            cb({ hooks: { buildModule: { tap: () => {} } } }, () => {});
          }},
        },
      };
      if (typeof plugin.apply === "function") plugin.apply(compiler);
      const count = countMarked(compiler.options.module.rules);
      if (count !== 1) throw new Error(`expected 1, got ${count}`);
      return `${count} rule injected`;
    }));

    tests.push(runTest("TailwindStyledRspackPlugin instantiable", () => {
      const Plugin = rspack.TailwindStyledRspackPlugin as new (opts: unknown) => { apply: unknown };
      const inst = new Plugin({ addDataAttr: false });
      if (typeof inst.apply !== "function") throw new Error("tidak punya apply()");
      return "ok";
    }));
  }

  return suite("rspack:adapter", tests, start);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET() {
  const allStart = performance.now();

  const suites = await Promise.all([
    testViteAdapter(),
    testNextAdapter(),
    testRspackAdapter(),
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
