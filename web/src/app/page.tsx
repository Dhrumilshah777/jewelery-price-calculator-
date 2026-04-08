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

type KaratKey = "22" | "18";

export default function Home() {
  const [price24, setPrice24] = useState("");
  const [weightGm, setWeightGm] = useState("");
  const [final22Multiplier, setFinal22Multiplier] = useState<99 | 98 | 97>(99);
  const [final18Multiplier, setFinal18Multiplier] = useState<83 | 82 | 81 | 80>(
    83
  );
  const [karatFocus, setKaratFocus] = useState<KaratKey>("22");
  const [resultPulse, setResultPulse] = useState(false);
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
    const id = window.setTimeout(() => {
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
    }, 0);
    return () => window.clearTimeout(id);
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
    const final22 = calcShownFinal({
      price: p24,
      weightGm: w,
      multiplier: final22Multiplier,
    });
    const final18 = calcShownFinal({
      price: p24,
      weightGm: w,
      multiplier: final18Multiplier,
    });
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
  }, [price24, weightGm, final22Multiplier, final18Multiplier]);

  const stickyFinal = useMemo(() => {
    return karatFocus === "22"
      ? computed.final22.shownFinal
      : computed.final18.shownFinal;
  }, [karatFocus, computed]);

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
      final22: computed.final22.shownFinal,
      final18: computed.final18.shownFinal,
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

  function handleDeleteSaved(id: string) {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    try {
      if (next.length === 0) {
        localStorage.removeItem("jewelry_saved_v1");
      } else {
        localStorage.setItem("jewelry_saved_v1", JSON.stringify(next));
      }
    } catch {
      // ignore
    }
  }

  function handleClearSaved() {
    const ok = window.confirm(
      "Are you sure you want to clear all saved products?"
    );
    if (!ok) return;
    setSaved([]);
    try {
      localStorage.removeItem("jewelry_saved_v1");
    } catch {
      // ignore
    }
  }

  function handleCalculate() {
    setResultPulse(true);
    window.setTimeout(() => setResultPulse(false), 600);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore
      }
    }
    const el = document.getElementById("sticky-final");
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function handleShareWhatsApp() {
    const p = price24.trim();
    const w = weightGm.trim();
    const kt = karatFocus === "22" ? "22kt" : "18kt";
    const lines = [
      "Amit Ornaments — Jewellery estimate",
      p ? `24kt rate entered: ₹${fmtAmount(p)}` : "24kt rate: —",
      w ? `Weight: ${w} gm` : "Weight: —",
      `Today's derived 22kt: ${p ? `₹${fmtAmount(computed.derived22)}` : "—"}`,
      `Final (${kt}): ₹${fmtAmount(stickyFinal || 0)}`,
      "",
      "Difference (Labour)",
      `22kt labour: ₹${fmtAmount(computed.labour22 || 0)}`,
      `18kt labour: ₹${fmtAmount(computed.labour18 || 0)}`,
    ];
    const url = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const hasInput = Boolean(price24.trim() && weightGm.trim());

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-stone-100">
      <div className="mx-auto w-full max-w-lg px-4 pb-36 pt-6 sm:px-6 md:max-w-5xl md:pb-10">
        {/* Header */}
        <header className="mb-6 text-center md:text-left">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#D4AF37] sm:text-3xl">
            Amit Ornaments <span aria-hidden>💎</span>
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            Jewellery Price Calculator
          </p>
        </header>

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            {/* Today's Gold Rate */}
            <section className="glass-card p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Today&apos;s Gold Rate
              </h2>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-2">
                  <span className="text-stone-400">24kt</span>
                  <span className="font-semibold tabular-nums text-[#D4AF37]">
                    {price24 ? `₹${fmtAmount(price24)}` : "—"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-2">
                  <span className="text-stone-400">22kt</span>
                  <span className="font-semibold tabular-nums">
                    {price24 ? `₹${fmtAmount(computed.derived22)}` : "—"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-stone-400">18kt</span>
                  <span className="font-semibold tabular-nums">
                    {price24 ? `₹${fmtAmount(computed.derived18)}` : "—"}
                  </span>
                </div>
              </div>
            </section>

            {/* Inputs */}
            <section className="glass-card p-5">
              <h2 className="font-display text-lg font-semibold text-stone-100">
                Details
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Enter 24kt price and weight — amounts update as you type.
              </p>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-stone-300">
                    <span aria-hidden className="text-lg">
                      💰
                    </span>
                    24kt Price
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-500">
                      ₹
                    </span>
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={price24}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        setPrice24(digitsOnly.slice(0, 6));
                      }}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-black/30 pl-9 pr-4 text-base outline-none ring-0 transition focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20"
                      placeholder="e.g. 152000"
                      autoComplete="off"
                    />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-stone-300">
                    <span aria-hidden className="text-lg">
                      ⚖️
                    </span>
                    Weight
                  </span>
                  <div className="relative">
                    <input
                      inputMode="decimal"
                      value={weightGm}
                      onChange={(e) => setWeightGm(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-base outline-none ring-0 transition focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20"
                      placeholder="e.g. 2.510"
                      autoComplete="off"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-500">
                      gm
                    </span>
                  </div>
                </label>
              </div>

              {/* Karat toggle */}
              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Final price for
                </div>
                <div
                  className="mt-2 flex rounded-2xl border border-white/10 bg-black/20 p-1"
                  role="group"
                  aria-label="Select karat for highlighted final price"
                >
                  {(
                    [
                      ["22", "22kt"],
                      ["18", "18kt"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setKaratFocus(key)}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                        karatFocus === key
                          ? "bg-[#D4AF37] text-black shadow-lg shadow-black/40"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasInput}
                  className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-4 text-sm font-semibold text-[#E8C547] shadow-[0_4px_20px_rgba(212,175,55,0.12)] transition enabled:hover:border-[#D4AF37]/70 enabled:hover:bg-[#D4AF37]/22 enabled:hover:shadow-[0_6px_24px_rgba(212,175,55,0.2)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Save to history
                </button>
              </div>

              {/* Multipliers */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-stone-500">
                    For 22kt multiplier
                  </span>
                  <select
                    value={final22Multiplier}
                    onChange={(e) =>
                      setFinal22Multiplier(Number(e.target.value) as 99 | 98 | 97)
                    }
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm outline-none focus:border-[#D4AF37]/40"
                  >
                    <option value={99}>99</option>
                    <option value={98}>98</option>
                    <option value={97}>97</option>
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-stone-500">
                    For 18kt multiplier
                  </span>
                  <select
                    value={final18Multiplier}
                    onChange={(e) =>
                      setFinal18Multiplier(
                        Number(e.target.value) as 83 | 82 | 81 | 80
                      )
                    }
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm outline-none focus:border-[#D4AF37]/40"
                  >
                    <option value={83}>83</option>
                    <option value={82}>82</option>
                    <option value={81}>81</option>
                    <option value={80}>80</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={handleCalculate}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#e4c04d] to-[#9a7b1a] text-base font-bold text-black shadow-lg shadow-black/50 transition hover:brightness-110 active:scale-[0.99]"
              >
                Calculate Price
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={!hasInput}
                className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-300 transition enabled:hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Share on WhatsApp
              </button>
            </section>
          </div>

          {/* Side column: results + labour + details (desktop) */}
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <section className="glass-card hidden p-5 md:block">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                Final Price
              </div>
              <div
                className={`mt-2 font-display text-4xl font-bold tabular-nums text-[#D4AF37] gold-glow transition ${resultPulse ? "scale-[1.02]" : ""}`}
              >
                ₹ {fmtAmount(stickyFinal || 0)}
              </div>
              <div className="mt-1 text-sm text-stone-500">
                Showing {karatFocus === "22" ? "22kt" : "18kt"} total (matches
                bottom bar on mobile)
              </div>
            </section>

            <section className="glass-card p-5">
              <h2 className="font-display text-lg font-semibold">All finals</h2>
              <div className="mt-4 grid gap-2">
                {(
                  [
                    ["22kt", computed.final22.shownFinal, "orange"],
                    ["18kt", computed.final18.shownFinal, "#67e8f9"],
                  ] as const
                ).map(([label, final, color]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/25 px-4 py-3 text-sm"
                  >
                    <div className="font-medium text-stone-300">{label}</div>
                    <div
                      className="font-semibold tabular-nums"
                      style={{ color }}
                    >
                      ₹ {fmtAmount(final || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card p-5">
              <h2 className="font-display text-lg font-semibold">
                Difference (Labour)
              </h2>
              <div className="mt-3 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="text-stone-400">22kt</span>
                  <span className="font-semibold tabular-nums text-orange-300">
                    ₹ {fmtAmount(computed.labour22 || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="text-stone-400">18kt</span>
                  <span className="font-semibold tabular-nums text-cyan-300">
                    ₹ {fmtAmount(computed.labour18 || 0)}
                  </span>
                </div>
              </div>
            </section>

            <details className="glass-card group p-5">
              <summary className="cursor-pointer font-display text-lg font-semibold text-stone-200 marker:text-[#D4AF37]">
                Calculation breakdown
              </summary>
              <div className="mt-4 grid gap-4">
                {(
                  [
                    ["22kt", 916, computed.p22.shownAfterMultiply, computed.p22FinalShown],
                    ["18kt", 76, computed.p18.shownAfterMultiply, computed.p18.shownFinal],
                  ] as const
                ).map(([label, multiplier, afterMultiply, final]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs text-stone-500">Steps</div>
                    </div>
                    <div className="mt-2 text-sm text-stone-400">
                      After ×{multiplier} (shown): ₹{fmtAmount(afterMultiply || 0)}
                    </div>
                    <div className="mt-1 text-xl font-semibold tabular-nums text-stone-100">
                      ₹ {fmtAmount(final || 0)}
                    </div>
                  </div>
                ))}
                <p className="text-xs leading-relaxed text-stone-500">
                  22kt: 24kt × 916 × weight (values shown use your floor rules).
                  18kt: 24kt × 76 × weight.
                </p>
              </div>
            </details>

            <section className="glass-card p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-lg font-semibold">
                  Saved history
                </h2>
                <button
                  type="button"
                  onClick={handleClearSaved}
                  disabled={saved.length === 0}
                  className="text-xs font-medium text-stone-500 underline-offset-4 hover:text-stone-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>
              </div>

              {saved.length === 0 ? (
                <div className="mt-3 text-sm text-stone-500">
                  Nothing saved yet. Add price + weight, then tap save.
                </div>
              ) : (
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {saved.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-white/5 bg-black/30 p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 font-semibold tabular-nums text-stone-200">
                          24kt: {s.price24 ? `₹${fmtAmount(s.price24)}` : "—"} ·{" "}
                          <span className="text-emerald-400">
                            {s.weightGm || "—"} gm
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="text-xs text-stone-500">
                            {new Date(s.createdAt).toLocaleString()}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSaved(s.id)}
                            className="rounded-lg p-1.5 text-rose-400/90 transition hover:bg-rose-500/15 hover:text-rose-300"
                            aria-label={`Delete saved entry from ${new Date(s.createdAt).toLocaleString()}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="h-4 w-4"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-1.5 tabular-nums sm:grid-cols-2">
                        <div className="text-stone-400">
                          22kt ref: ₹{fmtAmount(s.price22Shown)} →{" "}
                          <span className="font-semibold text-orange-300">
                            ₹{fmtAmount(s.final22)}
                          </span>
                        </div>
                        <div className="text-stone-400">
                          18kt ref: ₹{fmtAmount(s.price18Shown)} →{" "}
                          <span className="font-semibold text-cyan-300">
                            ₹{fmtAmount(s.final18)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Sticky final — mobile (and narrow tablets); desktop duplicate above */}
      <div
        id="sticky-final"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D4AF37]/25 bg-[#0A0A0A]/92 pb-safe backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="text-center text-xs font-semibold uppercase tracking-widest text-stone-500">
            Final Price
          </div>
          <div
            className={`mt-1 text-center font-display text-3xl font-bold tabular-nums text-[#D4AF37] gold-glow transition ${resultPulse ? "scale-[1.03]" : ""}`}
          >
            ₹ {fmtAmount(stickyFinal || 0)}
          </div>
          <div className="mt-0.5 text-center text-xs text-stone-500">
            {karatFocus === "22" ? "22kt" : "18kt"} · updates live
          </div>
        </div>
      </div>
    </div>
  );
}
