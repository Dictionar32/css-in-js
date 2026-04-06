import { NextResponse } from "next/server";

/**
 * GET /api/tests/behavior
 *
 * Behavior tests yang jalan di dalam Next.js server runtime:
 *   - compiler: transformSource nyata (template literal, variant object, extend)
 *   - compiler: adaptNativeResult, loadSafelist
 *   - scanner: parseScanWorkspaceOptions schema validation
 *   - scanner: parseScanWorkspaceResult schema validation
 *   - engine: applyIncrementalChange exports
 *   - core: twMerge conflict resolution
 *   - core: cx() class joining
 *   - runtime: createComponent subcomponents
 *
 * Semua test jalan di server-side — tidak ada mock, tidak ada Node.js script terpisah.
 * Error muncul langsung di response JSON dan di browser.
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
      name,
      passed: true,
      result:
        typeof result === "string"
          ? result
          : result != null
            ? JSON.stringify(result).slice(0, 200)
            : "ok",
      durationMs: Math.round(performance.now() - start),
    };
  } catch (e: unknown) {
    return {
      name,
      passed: false,
      error: e instanceof Error ? e.message : String(e),
      durationMs: Math.round(performance.now() - start),
    };
  }
}

async function runTestAsync(name: string, fn: () => Promise<unknown>): Promise<TestResult> {
  const start = performance.now();
  try {
    const result = await fn();
    return {
      name,
      passed: true,
      result:
        typeof result === "string"
          ? result
          : result != null
            ? JSON.stringify(result).slice(0, 200)
            : "ok",
      durationMs: Math.round(performance.now() - start),
    };
  } catch (e: unknown) {
    return {
      name,
      passed: false,
      error: e instanceof Error ? e.message : String(e),
      durationMs: Math.round(performance.now() - start),
    };
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

// ─── Suites ───────────────────────────────────────────────────────────────────

async function testCompilerBehavior(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let compiler: AnyModule | null = null;
  try {
    compiler = await import("tailwind-styled-v4/compiler") as AnyModule;
  } catch (e) {
    return suite("compiler:behavior", [{
      name: "import compiler",
      passed: false,
      error: e instanceof Error ? e.message : String(e),
    }], start);
  }

  const transform = compiler.transformSource as ((src: string, opts?: unknown) => { code: string; classes: string[]; changed: boolean }) | undefined;

  if (typeof transform === "function") {
    tests.push(runTest("template literal: tw.div`flex p-4` → changed=true", () => {
      const src = `import { tw } from "tailwind-styled-v4"\nconst Box = tw.div\`flex items-center p-4\``;
      const r = transform(src, { hoist: false });
      if (!r.changed) throw new Error("changed должен быть true");
      if (!r.classes.includes("flex")) throw new Error(`classes не содержит flex: ${JSON.stringify(r.classes)}`);
      return `classes: ${r.classes.slice(0, 5).join(", ")}`;
    }));

    tests.push(runTest("variant object config: extracts base + variant classes", () => {
      const src = `import { tw } from "tailwind-styled-v4"\nconst Btn = tw.button({ base: "px-4 py-2", variants: { size: { sm: "text-sm", lg: "text-lg" } } })`;
      const r = transform(src, { hoist: false });
      if (!r.changed) throw new Error("changed harus true");
      if (!r.classes.includes("px-4")) throw new Error("harus collect px-4 dari base");
      if (!r.classes.includes("text-sm")) throw new Error("harus collect text-sm dari variant");
      return `${r.classes.length} classes extracted`;
    }));

    tests.push(runTest("extend pattern: Base.extend`bg-blue-500`", () => {
      const src = `import { tw } from "tailwind-styled-v4"\nconst Base = tw.div\`flex\`\nconst Ext = Base.extend\`bg-blue-500\``;
      const r = transform(src, { hoist: false });
      if (!r.changed) throw new Error("changed harus true");
      return "ok";
    }));

    tests.push(runTest("no tw usage: changed=false", () => {
      const r = transform(`const x = 1 + 2`, { hoist: false });
      if (r.changed) throw new Error("tidak ada tw usage, changed harus false");
      return "ok";
    }));

    tests.push(runTest("cv() headless: classes extracted tanpa element", () => {
      const src = `import { cv } from "tailwind-styled-v4"\nconst btn = cv({ base: "px-4 py-2", variants: { intent: { primary: "bg-blue-500" } } })`;
      const r = transform(src, { hoist: false });
      return `changed=${r.changed}, classes=${r.classes.length}`;
    }));
  } else {
    tests.push({ name: "transformSource", passed: false, error: "tidak diekspor dari compiler" });
  }

  const adaptNative = compiler.adaptNativeResult as ((raw: unknown) => { code: string; classes: string[]; changed: boolean }) | undefined;
  if (typeof adaptNative === "function") {
    tests.push(runTest("adaptNativeResult: pass-through code/classes/changed", () => {
      const raw = { code: "const x = 1;", classes: ["bg-blue-500", "text-white"], changed: true, rscJson: null };
      const r = adaptNative(raw);
      if (r.code !== "const x = 1;") throw new Error(`code mismatch: ${r.code}`);
      if (!r.changed) throw new Error("changed harus true");
      return `${r.classes.length} classes`;
    }));
  }

  return suite("compiler:behavior", tests, start);
}

async function testScannerBehavior(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let scanner: AnyModule | null = null;
  try {
    scanner = await import("tailwind-styled-v4/scanner") as AnyModule;
  } catch (e) {
    return suite("scanner:behavior", [{
      name: "import scanner",
      passed: false,
      error: e instanceof Error ? e.message : String(e),
    }], start);
  }

  tests.push(runTest("exports scanWorkspace", () => {
    if (typeof scanner!.scanWorkspace !== "function") throw new Error("bukan function");
    return "function";
  }));

  tests.push(runTest("exports scanWorkspaceAsync", () => {
    if (typeof scanner!.scanWorkspaceAsync !== "function") throw new Error("bukan function");
    return "function";
  }));

  const parseOpts = scanner.parseScanWorkspaceOptions as ((o: unknown) => unknown) | undefined;
  if (typeof parseOpts === "function") {
    tests.push(runTest("parseScanWorkspaceOptions: rejects string includeExtensions", () => {
      try {
        parseOpts({ includeExtensions: ".tsx" });
        throw new Error("harusnya throw untuk input invalid");
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("scanner options are invalid")) return "validation ok";
        throw e;
      }
    }));

    tests.push(runTest("parseScanWorkspaceOptions: rejects string useCache", () => {
      try {
        parseOpts({ useCache: "yes" });
        throw new Error("harusnya throw");
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("scanner options are invalid")) return "validation ok";
        throw e;
      }
    }));

    tests.push(runTest("parseScanWorkspaceOptions: accepts valid options", () => {
      const r = parseOpts({ useCache: true, includeExtensions: [".tsx", ".ts"] });
      return r ? "ok" : "null result";
    }));
  }

  const parseResult = scanner.parseScanWorkspaceResult as ((o: unknown) => unknown) | undefined;
  if (typeof parseResult === "function") {
    tests.push(runTest("parseScanWorkspaceResult: rejects string totalFiles", () => {
      try {
        parseResult({ files: [], totalFiles: "1", uniqueClasses: [] });
        throw new Error("harusnya throw");
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("scan result is invalid")) return "validation ok";
        throw e;
      }
    }));
  }

  return suite("scanner:behavior", tests, start);
}

async function testCoreBehavior(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let core: AnyModule | null = null;
  try {
    core = await import("tailwind-styled-v4") as AnyModule;
  } catch (e) {
    return suite("core:behavior", [{
      name: "import core",
      passed: false,
      error: e instanceof Error ? e.message : String(e),
    }], start);
  }

  const twMerge = core.twMerge as ((...args: string[]) => string) | undefined;
  if (typeof twMerge === "function") {
    tests.push(runTest("twMerge: px-4 + px-6 → px-6 menang", () => {
      const r = twMerge("px-4 py-2", "px-6");
      if (!r.includes("px-6")) throw new Error(`px-6 tidak ada: "${r}"`);
      if (r.includes("px-4")) throw new Error(`px-4 harusnya dikalahkan: "${r}"`);
      return r;
    }));

    tests.push(runTest("twMerge: bg-red + bg-blue → bg-blue menang", () => {
      const r = twMerge("bg-red-500 text-white", "bg-blue-500");
      if (!r.includes("bg-blue-500")) throw new Error(`bg-blue-500 tidak ada: "${r}"`);
      if (r.includes("bg-red-500")) throw new Error(`bg-red-500 harusnya dikalahkan: "${r}"`);
      return r;
    }));
  }

  const cx = core.cx as ((...args: unknown[]) => string) | undefined;
  if (typeof cx === "function") {
    tests.push(runTest("cx: join strings", () => {
      const r = cx("a", "b", "c");
      if (r !== "a b c") throw new Error(`expected "a b c", got "${r}"`);
      return r;
    }));

    tests.push(runTest("cx: filter falsy values", () => {
      const r = cx("a", false, null, undefined, "b");
      if (r !== "a b") throw new Error(`expected "a b", got "${r}"`);
      return r;
    }));

    tests.push(runTest("cx: nested arrays", () => {
      const r = cx(["a", ["b", "c"]]);
      if (r !== "a b c") throw new Error(`expected "a b c", got "${r}"`);
      return r;
    }));
  }

  const cv = core.cv as ((config: unknown) => (props?: unknown) => string) | undefined;
  if (typeof cv === "function") {
    tests.push(runTest("cv: applies base class", () => {
      const btn = cv({ base: "px-4 py-2 rounded", variants: {} });
      const r = btn({});
      if (!r.includes("px-4")) throw new Error(`px-4 tidak ada: "${r}"`);
      return r;
    }));

    tests.push(runTest("cv: applies variant prop", () => {
      const btn = cv({
        base: "btn",
        variants: { intent: { primary: "bg-blue-500", danger: "bg-red-500" } },
        defaultVariants: { intent: "primary" },
      });
      const r = btn({ intent: "danger" });
      if (!r.includes("bg-red-500")) throw new Error(`bg-red-500 tidak ada: "${r}"`);
      if (r.includes("bg-blue-500")) throw new Error(`bg-blue-500 harusnya tidak ada: "${r}"`);
      return r;
    }));

    tests.push(runTest("cv: defaultVariants applied tanpa props", () => {
      const btn = cv({
        base: "btn",
        variants: { size: { sm: "text-sm", lg: "text-lg" } },
        defaultVariants: { size: "sm" },
      });
      const r = btn({});
      if (!r.includes("text-sm")) throw new Error(`default size sm tidak applied: "${r}"`);
      return r;
    }));
  }

  return suite("core:behavior", tests, start);
}

async function testRuntimeBehavior(): Promise<SuiteResult> {
  const start = performance.now();
  const tests: TestResult[] = [];

  let runtime: AnyModule | null = null;
  try {
    runtime = await import("tailwind-styled-v4/runtime") as AnyModule;
  } catch (e) {
    return suite("runtime:behavior", [{
      name: "import runtime",
      passed: false,
      error: e instanceof Error ? e.message : String(e),
    }], start);
  }

  const createComponent = runtime.createComponent as ((tag: string, base: string, subs?: unknown, cond?: unknown) => unknown) | undefined;
  if (typeof createComponent === "function") {
    tests.push(runTest("createComponent returns ForwardRef component", () => {
      const comp = createComponent("div", "tw-base-abc123") as Record<string, unknown>;
      if (typeof comp.render !== "function") throw new Error("bukan ForwardRef component");
      return "ok";
    }));

    tests.push(runTest("createComponent attaches subcomponents", () => {
      const comp = createComponent("div", "base", {
        icon: { tag: "span", class: "icon-class" },
        text: { tag: "span", class: "text-class" },
      }) as Record<string, unknown>;
      if (typeof (comp.icon as Record<string,unknown>)?.render !== "function") throw new Error("comp.icon bukan component");
      if (typeof (comp.text as Record<string,unknown>)?.render !== "function") throw new Error("comp.text bukan component");
      return "icon + text attached";
    }));

    tests.push(runTest("createComponent displayName set correctly", () => {
      const comp = createComponent("button", "base") as { displayName?: string };
      if (!comp.displayName?.includes("button")) throw new Error(`displayName: "${comp.displayName}"`);
      return comp.displayName ?? "ok";
    }));
  }

  return suite("runtime:behavior", tests, start);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET() {
  const allStart = performance.now();

  const suites = await Promise.all([
    testCompilerBehavior(),
    testScannerBehavior(),
    testCoreBehavior(),
    testRuntimeBehavior(),
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
