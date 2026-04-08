"use client";

import { useEffect, useMemo, useState } from "react";

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const amountFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

function fmtAmount(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return amountFormatter.format(n);
}

function calcShownFinal({
  price,
  weightGm,
  multiplier,
}: {
  price: number;
  weightGm: number;
  multiplier: number;
}) {
  const multiplied = price * multiplier;
  const shownAfterMultiply = Math.floor(multiplied / 100);

  const multipliedByWeight = multiplied * weightGm;
  const shownFinal = Math.floor(multipliedByWeight / 1000);

  return { shownAfterMultiply, shownFinal };
}

export default function Home() {
  const [price24, setPrice24] = useState("");
  const [weightGm, setWeightGm] = useState("");
  const [saved, setSaved] = useState<
    Array<{
      id: string;
      key: string;
      createdAt: number;
      price24: string;
      price22Shown: number;
      price18Shown: number;
      weightGm: string;
      final22: number;
      final18: number;
    }>
  >([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("jewelry_saved_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const normalized = parsed
        .filter((x) => x && typeof x === "object")
        .map((x) => {
          const price24 = typeof x.price24 === "string" ? x.price24 : "";
          const weightGm = typeof x.weightGm === "string" ? x.weightGm : "";
          const key =
            typeof x.key === "string" ? x.key : `${price24}|${weightGm}`;
          return { ...x, price24, weightGm, key };
        });
      setSaved(normalized);
    } catch {
      // ignore
    }
  }, []);

  const computed = useMemo(() => {
    const w = toNumber(weightGm);
    const p24 = toNumber(price24);
    const derived22Raw = p24 * 916;
    const derived18Raw = p24 * 76;
    const derived22 = Math.floor(derived22Raw / 1000);
    const derived18 = Math.floor(derived18Raw / 100);
    const p22 = calcShownFinal({ price: p24, weightGm: w, multiplier: 916 });
    const p18 = calcShownFinal({ price: p24, weightGm: w, multiplier: 76 });
    const final22 = calcShownFinal({ price: p24, weightGm: w, multiplier: 99 });
    const final18 = calcShownFinal({ price: p24, weightGm: w, multiplier: 83 });
    return {
      derived22,
      derived18,
      p22,
      p22FinalShown: Math.floor(p22.shownFinal / 10),
      p18,
      final22,
      final18,
      labour22: final22.shownFinal - Math.floor(p22.shownFinal / 10),
      labour18: final18.shownFinal - p18.shownFinal,
    };
  }, [price24, weightGm]);

  function handleSave() {
    const key = `${price24.trim()}|${weightGm.trim()}`;
    const entry = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()),
      key,
      createdAt: Date.now(),
      price24: price24.trim(),
      price22Shown: computed.derived22,
      price18Shown: computed.derived18,
      weightGm: weightGm.trim(),
      final22: computed.p22FinalShown,
      final18: computed.p18.shownFinal,
    };

    const existingIdx = saved.findIndex((s) => s.key === key);
    const next =
      existingIdx >= 0
        ? [
            { ...saved[existingIdx], ...entry, id: saved[existingIdx].id },
            ...saved.slice(0, existingIdx),
            ...saved.slice(existingIdx + 1),
          ].slice(0, 50)
        : [entry, ...saved].slice(0, 50);

    setSaved(next);
    try {
      localStorage.setItem("jewelry_saved_v1", JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function handleClearSaved() {
    setSaved([]);
    try {
      localStorage.removeItem("jewelry_saved_v1");
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Prices
            </div>
            <div className="mt-2 grid gap-1 text-sm">
              <div className="flex items-baseline justify-between gap-6">
                <span className="text-zinc-600 dark:text-zinc-400">
                  24kt
                </span>
                <span className="font-semibold tabular-nums">
                  {price24 ? fmtAmount(price24) : "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-6">
                <span className="text-zinc-600 dark:text-zinc-400">
                  22kt
                </span>
                <span className="font-semibold tabular-nums">
                  {price24 ? fmtAmount(computed.derived22) : "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-6">
                <span className="text-zinc-600 dark:text-zinc-400">
                  18kt
                </span>
                <span className="font-semibold tabular-nums">
                  {price24 ? fmtAmount(computed.derived18) : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 text-right backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Weight (gm)
            </div>
            <div className="mt-2 font-semibold tabular-nums">
              {weightGm || "—"}
            </div>
          </div>
        </div>

        <main className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="text-xl font-semibold tracking-tight">
              Jewelry Price Calculator
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Enter prices and weight. Final amount updates instantly.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  24kt price
                </span>
                <input
                  inputMode="decimal"
                  value={price24}
                  onChange={(e) => setPrice24(e.target.value)}
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                  placeholder="e.g. 152000"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  22kt price
                </span>
                <input
                  inputMode="decimal"
                  value={price24 ? fmtAmount(computed.derived22) : ""}
                  readOnly
                  className="h-11 cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none ring-0 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300"
                  placeholder="Auto-calculated from 24kt"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  18kt price
                </span>
                <input
                  inputMode="decimal"
                  value={price24 ? fmtAmount(computed.derived18) : ""}
                  readOnly
                  className="h-11 cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none ring-0 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300"
                  placeholder="Auto-calculated from 24kt"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Weight (in gm)
                </span>
                <input
                  inputMode="decimal"
                  value={weightGm}
                  onChange={(e) => setWeightGm(e.target.value)}
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                  placeholder="e.g. 2.510"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={!price24.trim() || !weightGm.trim()}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
              >
                Save
              </button>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                (Requires 24kt price + weight)
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
              Final Result
            </div>
            <div className="mt-4 grid gap-3">
              {(
                [
                  ["22kt", computed.final22.shownFinal],
                  ["18kt", computed.final18.shownFinal],
                ] as const
              ).map(([label, final]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/40"
                >
                  <div className="font-medium">{label} Price</div>
                  <div
                    className="font-semibold tabular-nums"
                    style={{
                      color: label === "22kt" ? "#a17783" : "#03d3fc",
                    }}
                  >
                    {fmtAmount(final || 0)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <div className="font-semibold text-zinc-700 dark:text-zinc-300">
                Difference (Labour)
              </div>
              <div className="mt-2 grid gap-2 tabular-nums">
                <div className="flex items-center justify-between">
                  <div className="text-zinc-600 dark:text-zinc-400">
                    22kt labour (24kt×99×wt − 24kt×916×wt)
                  </div>
                  <div className="font-semibold">
                    {fmtAmount(computed.labour22 || 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-zinc-600 dark:text-zinc-400">
                    18kt labour (24kt×83×wt − 24kt×76×wt)
                  </div>
                  <div className="font-semibold">
                    {fmtAmount(computed.labour18 || 0)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-xl font-semibold tracking-tight">Result</h2>
            <div className="mt-6 grid gap-4">
              {(
                [
                  ["22kt", 916, computed.p22.shownAfterMultiply, computed.p22FinalShown],
                  ["18kt", 76, computed.p18.shownAfterMultiply, computed.p18.shownFinal],
                ] as const
              ).map(([label, multiplier, afterMultiply, final]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Final price
                    </div>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <div className="text-3xl font-semibold tabular-nums">
                      {fmtAmount(final || 0)}
                    </div>
                    <div className="text-right text-sm text-zinc-600 dark:text-zinc-400">
                      <div className="tabular-nums">
                        after ×{multiplier} (shown):{" "}
                        {fmtAmount(afterMultiply || 0)}
                      </div>
                      <div className="tabular-nums">
                        after ×weight (shown): {fmtAmount(final || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
              Formula (as you described):<br />
              22kt: 24kt × 916 × weight (shown is trimmed)<br />
              18kt: 24kt × 76 × weight (shown is trimmed)
            </div>

            <div className="mt-6 rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-semibold">Saved products</div>
                <button
                  type="button"
                  onClick={handleClearSaved}
                  disabled={saved.length === 0}
                  className="text-xs font-medium text-zinc-600 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400"
                >
                  Clear
                </button>
              </div>

              {saved.length === 0 ? (
                <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Nothing saved yet.
                </div>
              ) : (
                <div className="mt-3 grid gap-2">
                  {saved.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900/40"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="font-semibold tabular-nums">
                          24kt: {s.price24 ? fmtAmount(s.price24) : "—"} | wt:{" "}
                          {s.weightGm || "—"}gm
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          {new Date(s.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2 tabular-nums">
                        <div>
                          <span className="text-zinc-600 dark:text-zinc-400">
                            22kt:
                          </span>{" "}
                          {fmtAmount(s.price22Shown)} | final:{" "}
                          {fmtAmount(s.final22)}
                        </div>
                        <div>
                          <span className="text-zinc-600 dark:text-zinc-400">
                            18kt:
                          </span>{" "}
                          {fmtAmount(s.price18Shown)} | final:{" "}
                          {fmtAmount(s.final18)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
