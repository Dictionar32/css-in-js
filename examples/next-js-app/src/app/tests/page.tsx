"use client";

import React, { useCallback, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  durationMs?: number;
}

interface EndpointResult {
  label: string;
  endpoint: string;
  status: "idle" | "loading" | "done" | "error";
  passed?: number;
  failed?: number;
  durationMs?: number;
  suites?: SuiteResult[];
  error?: string;
}

// ─── Components ───────────────────────────────────────────────────────────────

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ok
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {label}
    </span>
  );
}

function TestRow({ test }: { test: TestResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
      >
        <span className={test.passed ? "text-green-600" : "text-red-600"}>
          {test.passed ? "✓" : "✗"}
        </span>
        <span className="flex-1 font-mono text-xs text-gray-800">{test.name}</span>
        {test.durationMs !== undefined && (
          <span className="text-xs text-gray-400">{test.durationMs}ms</span>
        )}
        {(test.result || test.error) && (
          <span className="text-xs text-gray-400">{open ? "▲" : "▼"}</span>
        )}
      </button>
      {open && (test.result || test.error) && (
        <div className="px-8 pb-2">
          {test.result && (
            <code className="block rounded bg-gray-50 px-2 py-1 text-xs text-gray-700">
              {test.result}
            </code>
          )}
          {test.error && (
            <code className="block rounded bg-red-50 px-2 py-1 text-xs text-red-700">
              {test.error}
            </code>
          )}
        </div>
      )}
    </div>
  );
}

function SuiteCard({ suite }: { suite: SuiteResult }) {
  const [open, setOpen] = useState(suite.failed > 0);
  const ok = suite.failed === 0;
  return (
    <div className={`rounded-lg border ${ok ? "border-green-200" : "border-red-200"} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left ${ok ? "bg-green-50 hover:bg-green-100" : "bg-red-50 hover:bg-red-100"}`}
      >
        <span className={`font-mono text-sm font-semibold ${ok ? "text-green-800" : "text-red-800"}`}>
          {suite.suite}
        </span>
        <span className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-green-700">{suite.passed} passed</span>
          {suite.failed > 0 && <span className="text-red-700">{suite.failed} failed</span>}
          {suite.durationMs !== undefined && <span className="text-gray-500">{suite.durationMs}ms</span>}
        </span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="divide-y divide-gray-100 bg-white">
          {suite.tests.map((t, i) => <TestRow key={i} test={t} />)}
        </div>
      )}
    </div>
  );
}

function EndpointCard({ ep, onRun }: { ep: EndpointResult; onRun: () => void }) {
  const ok = ep.status === "done" && ep.failed === 0;
  const failed = ep.status === "done" && (ep.failed ?? 0) > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-4 ${
        ok ? "bg-green-50" : failed ? "bg-red-50" : "bg-gray-50"
      }`}>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{ep.label}</span>
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
              {ep.endpoint}
            </code>
          </div>
          {ep.status === "done" && (
            <p className="mt-0.5 text-xs text-gray-500">
              {ep.passed} passed · {ep.failed} failed
              {ep.durationMs !== undefined && ` · ${ep.durationMs}ms`}
            </p>
          )}
        </div>

        {ep.status === "idle" && (
          <button onClick={onRun} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700">
            Run
          </button>
        )}
        {ep.status === "loading" && (
          <span className="animate-spin text-gray-400">⟳</span>
        )}
        {ep.status === "done" && (
          <Badge ok={ok} label={ok ? "PASS" : `${ep.failed} FAIL`} />
        )}
        {ep.status === "error" && (
          <Badge ok={false} label="ERROR" />
        )}
      </div>

      {ep.status === "done" && ep.suites && (
        <div className="divide-y divide-gray-100 p-4 space-y-2">
          {ep.suites.map((s, i) => <SuiteCard key={i} suite={s} />)}
        </div>
      )}
      {ep.status === "error" && ep.error && (
        <div className="p-4">
          <code className="block rounded bg-red-50 p-3 text-xs text-red-700">{ep.error}</code>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ENDPOINTS: Pick<EndpointResult, "label" | "endpoint">[] = [
  { label: "Package Imports",    endpoint: "/api/package-tests" },
  { label: "Compiler Behavior",  endpoint: "/api/tests/behavior" },
  { label: "Adapter Config",     endpoint: "/api/tests/adapters" },
  { label: "Pipeline (scanner → engine)", endpoint: "/api/tests/pipeline" },
];

export default function TestDashboardPage() {
  const [eps, setEps] = useState<EndpointResult[]>(
    ENDPOINTS.map((e) => ({ ...e, status: "idle" }))
  );

  const runEndpoint = useCallback(async (endpoint: string) => {
    setEps((prev) =>
      prev.map((e) => e.endpoint === endpoint ? { ...e, status: "loading" } : e)
    );
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        passed?: number; failed?: number; durationMs?: number;
        suites?: SuiteResult[]; results?: unknown[];
        generatedAt?: string;
      };

      // /api/package-tests returns { results: [...] } shape
      // /api/tests/* returns { suites: [...], passed, failed } shape
      let suites: SuiteResult[] = [];
      let passed = 0;
      let failed = 0;

      if (data.suites) {
        suites = data.suites;
        passed = data.passed ?? suites.reduce((n, s) => n + s.passed, 0);
        failed = data.failed ?? suites.reduce((n, s) => n + s.failed, 0);
      } else if (data.results) {
        // Convert package-tests format → suite format
        const results = data.results as Array<{ name: string; status: string; tests: TestResult[]; importPath: string }>;
        suites = [{
          suite: "packages",
          passed: results.filter((r) => r.status === "pass").length,
          failed: results.filter((r) => r.status === "fail").length,
          tests: results.map((r) => ({
            name: r.name,
            passed: r.status === "pass",
            result: r.status === "pass" ? r.importPath : undefined,
            error: r.status === "fail" ? `${r.importPath} — ${r.tests?.find((t) => !t.passed)?.error ?? "unknown"}` : undefined,
          })),
        }];
        passed = suites[0]!.passed;
        failed = suites[0]!.failed;
      }

      setEps((prev) =>
        prev.map((e) =>
          e.endpoint === endpoint
            ? { ...e, status: "done", passed, failed, durationMs: data.durationMs, suites }
            : e
        )
      );
    } catch (err) {
      setEps((prev) =>
        prev.map((e) =>
          e.endpoint === endpoint
            ? { ...e, status: "error", error: err instanceof Error ? err.message : String(err) }
            : e
        )
      );
    }
  }, []);

  const runAll = useCallback(() => {
    for (const ep of ENDPOINTS) void runEndpoint(ep.endpoint);
  }, [runEndpoint]);

  useEffect(() => { runAll(); }, [runAll]);

  const totalPassed = eps.filter((e) => e.status === "done").reduce((n, e) => n + (e.passed ?? 0), 0);
  const totalFailed = eps.filter((e) => e.status === "done").reduce((n, e) => n + (e.failed ?? 0), 0);
  const allDone = eps.every((e) => e.status === "done" || e.status === "error");
  const anyLoading = eps.some((e) => e.status === "loading");

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900">Test Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Semua test jalan di Next.js server runtime — import nyata, error nyata, tidak ada mock.
          Buka DevTools → Network untuk lihat response per endpoint.
        </p>
      </div>

      {/* Summary bar */}
      {allDone && (
        <div className={`flex items-center gap-4 rounded-xl px-5 py-3 ${totalFailed === 0 ? "bg-green-100" : "bg-red-100"}`}>
          <span className={`text-lg font-bold ${totalFailed === 0 ? "text-green-800" : "text-red-800"}`}>
            {totalFailed === 0 ? "✓ All Passed" : `✗ ${totalFailed} Failed`}
          </span>
          <span className="text-sm text-gray-600">
            {totalPassed} passed · {totalFailed} failed across {eps.length} endpoints
          </span>
          <button
            onClick={runAll}
            className="ml-auto rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Re-run All
          </button>
        </div>
      )}

      {anyLoading && (
        <p className="text-sm text-gray-500 animate-pulse">Running tests…</p>
      )}

      {/* Endpoint cards */}
      <div className="space-y-4">
        {eps.map((ep) => (
          <EndpointCard key={ep.endpoint} ep={ep} onRun={() => runEndpoint(ep.endpoint)} />
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center pt-4">
        Route:{" "}
        {ENDPOINTS.map((e) => (
          <code key={e.endpoint} className="mx-1">{e.endpoint}</code>
        ))}
      </p>
    </div>
  );
}
