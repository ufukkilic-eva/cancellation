"use client";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

// ---------- Types ----------
type Scenario = "growth" | "scaleads" | "scaleads+dedicated";
type Step = 1 | 2; // 1: choices, 2: confirmation
type ConfirmKind = "cancel" | "downgrade" | "switch"; // switch = Growth → ScaleAds free month
type Mode = "paid" | "trial";

type ConfirmLine = {
  name: string;        // e.g. "ScaleAds Self Service"
  days: number;        // policy: 30
  amountToday: number; // charged today (trial flows = 0)
};

// ---------- Pricing & Policy ----------
const PRICES = {
  growth: 49,
  scaleads: 299,
  dedicated: 200,
};
const PERIOD_DAYS = 30;

// ---------- Helpers ----------
const money = (n: number, currency = "$") =>
  `${currency}${n.toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });

const toggleBtn = (active: boolean) =>
  `cursor-pointer px-3 py-2 rounded-md border transition
   ${active
     ? "bg-slate-800 text-white border-emerald-500 ring-2 ring-emerald-500 hover:bg-slate-700"
     : "bg-slate-700/40 text-slate-300 border-slate-600 hover:bg-slate-700/60"}`;

// ---------- Component ----------
export default function Page() {
  const [scenario, setScenario] = useState<Scenario>("scaleads+dedicated");
  const [step, setStep] = useState<Step>(1);

  // --- Styles ---
  const radioItemCls =
    "border-slate-400 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-600";
  const checkItemCls =
    "border-slate-400 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-600";

  // Dates (demo: bugün +30 gün)
  const today = new Date();
  const trialEndDate = fmtDate(addDays(today, PERIOD_DAYS));
  const nextPeriodEnd = fmtDate(addDays(today, PERIOD_DAYS));

  // ---------- Reusable UI ----------
  const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative w-full max-w-2xl mx-auto rounded-lg bg-slate-900/90 border border-slate-700 p-6 text-slate-100 shadow">
      <button
        onClick={() => setStep(1)}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
        aria-label="Close"
        title="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      {children}
    </div>
  );

  const Pills: React.FC<{ items: string[] }> = ({ items }) => (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      {items.map((it, i) => (
        <div key={i} className="px-3 py-2 rounded-md text-sm font-medium bg-slate-800 border border-slate-700">
          {it}
        </div>
      ))}
    </div>
  );

  const Box: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-6 rounded-lg border border-blue-400/40 bg-slate-900 p-4 shadow-[0_0_0_1px_rgba(56,97,251,0.15)_inset]">
      <div className="text-blue-300 font-semibold mb-2">{title}</div>
      {children}
    </div>
  );

  const PriceCompare: React.FC<{
    fromLabel: string;
    fromMonthly: number;
    toLabel: string;
    toMonthly: number;
    fromAddons?: string[];
    toAddons?: string[];
  }> = ({ fromLabel, fromMonthly, toLabel, toMonthly, fromAddons = [], toAddons = [] }) => (
    <div className="grid grid-cols-2 gap-3 my-4">
      <div className="rounded-md bg-slate-800 border border-slate-700 p-3">
        <div className="text-xs text-slate-400 mb-1">Current monthly</div>
        <div className="text-sm font-semibold">{fromLabel}</div>
        <div className="text-base mt-1">{money(fromMonthly)}/month</div>
        {fromAddons.length > 0 && (
          <ul className="mt-2 text-xs text-slate-300 list-disc list-inside space-y-1">
            {fromAddons.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
      </div>
      <div className="rounded-md bg-slate-800 border border-slate-700 p-3">
        <div className="text-xs text-slate-400 mb-1">New monthly</div>
        <div className="text-sm font-semibold">{toLabel}</div>
        <div className="text-base mt-1">{money(toMonthly)}/month</div>
        {toAddons.length > 0 && (
          <ul className="mt-2 text-xs text-slate-300 list-disc list-inside space-y-1">
            {toAddons.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
      </div>
    </div>
  );

  // ---------- Step 2: Confirmation ----------
  const CancellationConfirm: React.FC<{
    kind: ConfirmKind;           // cancel | downgrade | switch
    mode: Mode;                  // paid | trial
    endDate: string;             // yeni dönem bitişi / trial sonu (hep 30 gün sonrası)
    items: ConfirmLine[];        // bugün tahsil edilecekler
    fromLabel?: string;          // karşılaştırma
    fromMonthly?: number;
    toLabel?: string;
    toMonthly?: number;
    fromAddons?: string[];
    toAddons?: string[];
    firstChargeDate?: string;    // trial → ilk tahsil tarihi
    firstChargeAmount?: number;  // trial → ilk tahsil tutarı
    primaryText?: string;
    onStay: () => void;
    onConfirm: () => void;
  }> = ({
    kind,
    mode,
    endDate,
    items,
    fromLabel,
    fromMonthly,
    toLabel,
    toMonthly,
    fromAddons,
    toAddons,
    firstChargeDate,
    firstChargeAmount,
    primaryText,
    onStay,
    onConfirm,
  }) => {
    const [ack, setAck] = useState(false);
    const totalToday = useMemo(() => items.reduce((s, it) => s + (it.amountToday || 0), 0), [items]);
    const title =
      kind === "cancel" ? "Are you sure?" :
      kind === "downgrade" ? "Confirm your plan change" :
      "Start your free month";

    return (
      <div>
        <h2 className="text-center text-2xl font-semibold mb-3">{title}</h2>

        {/* Metinler */}
        {kind === "cancel" && mode === "paid" && (
          <p className="text-sm text-slate-300">
            When you cancel, your subscription stays active for <b>{PERIOD_DAYS} days</b> from today.
            You’ll be charged <b>one full month now</b>, and your plan will remain active until <b>{endDate}</b>.
          </p>
        )}

        {kind === "cancel" && mode === "trial" && (
          <>
            <p className="text-sm text-slate-300">
              You’re on a free period. If you cancel now, you won’t be charged. Your trial remains active
              until <b>{endDate}</b>, after which your subscription will end automatically.
            </p>
            <p className="text-sm text-slate-300 mt-3">You’ll pay <b>$0.00 today</b>.</p>
          </>
        )}

        {/* Compare (cancel harici) */}
        {kind !== "cancel" &&
          fromLabel && toLabel &&
          typeof fromMonthly === "number" && typeof toMonthly === "number" && (
            <PriceCompare
              fromLabel={fromLabel}
              fromMonthly={fromMonthly}
              toLabel={toLabel}
              toMonthly={toMonthly}
              fromAddons={fromAddons}
              toAddons={toAddons}
            />
        )}

        {kind === "switch" && mode === "trial" && (
          <>
            <p className="text-sm text-slate-300">
              You’re moving to <b>{toLabel}</b> with a <b>free month</b>. You’ll pay <b>$0.00 today</b>.
              Your free period runs until <b>{endDate}</b>.
            </p>
            {firstChargeDate && typeof firstChargeAmount === "number" && (
              <p className="text-sm text-slate-300 mt-3">
                Starting on <b>{firstChargeDate}</b>, you’ll be charged <b>{money(firstChargeAmount)}</b> every {PERIOD_DAYS} days unless you cancel.
              </p>
            )}
          </>
        )}

        {kind === "downgrade" && mode === "trial" && (
          <>
            <p className="text-sm text-slate-300">
              You’re on a free period now. Your plan will switch to <b>{toLabel}</b> when the trial ends on <b>{endDate}</b>.
              You’ll pay <b>$0.00 today</b>.
            </p>
            {firstChargeDate && typeof firstChargeAmount === "number" && (
              <p className="text-sm text-slate-300 mt-3">
                First charge on <b>{firstChargeDate}</b>: <b>{money(firstChargeAmount)}</b> for the next {PERIOD_DAYS} days.
              </p>
            )}
          </>
        )}

        {kind === "downgrade" && mode === "paid" && (
          <p className="text-sm text-slate-300">
            You’re switching plans. Today you’ll be charged only the difference between the new and current monthly price
            for the next <b>{PERIOD_DAYS}</b> days (never negative).
          </p>
        )}

        {/* Bugün tahsil edilecekler */}
        <div className="mt-5">
          <div className="text-center text-sm text-slate-400 mb-2">
            {kind === "cancel" ? "Your cancellation plan" : "Charged today"}
          </div>

        <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-md bg-slate-800 border border-slate-700 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-slate-700 px-2 py-1 text-xs">{it.name}</div>
                  <div className="text-xs text-slate-400">×{it.days} {it.days === 1 ? "day" : "days"}</div>
                </div>
                <div className="text-sm font-medium">{money(it.amountToday)}</div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-md bg-slate-900 border border-slate-700 px-3 py-2">
              <div className="text-sm text-slate-300">Total today</div>
              <div className="text-sm font-semibold">{money(items.reduce((s, it) => s + it.amountToday, 0))}</div>
            </div>
          </div>
        </div>

        {/* Onay — HER ZAMAN aynı T&C metni */}
        <label className="mt-5 flex items-start gap-2 text-sm text-slate-200 cursor-pointer">
          <Checkbox
            className="mt-0.5 border-slate-400 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-600"
            checked={ack}
            onCheckedChange={(v) => setAck(!!v)}
          />
          <span>
            I have read and agree to the{" "}
            <a href="#" className="underline">Terms &amp; Conditions</a>.
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-5">
          <Button className="cursor-pointer" variant="secondary" onClick={onStay}>
            Go back
          </Button>
          <Button
            className="cursor-pointer bg-blue-600 hover:bg-blue-500"
            disabled={!ack}
            onClick={onConfirm}
          >
            {primaryText ??
              (kind === "cancel" ? "Cancel my subscription" :
               kind === "downgrade" ? "Confirm plan change" :
               "Start free month")}
          </Button>
        </div>

        <div className="text-xs text-slate-400 mt-4">
          If you have a problem, before cancellation <a href="#" className="underline">let us contact you</a>.
        </div>
      </div>
    );
  };

  // ---------- Step 1 Common Footer ----------
  const Footer: React.FC<{
    enabled: boolean;
    ctaText?: string;
    onNext?: () => void;
  }> = ({ enabled, ctaText = "Next", onNext }) => (
    <div className="flex items-center justify-between mt-6 text-xs text-slate-400">
      <span>
        If you have a problem, before cancellation{" "}
        <a href="#" className="underline">let us contact you</a>.
      </span>
      <Button className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6" disabled={!enabled} onClick={onNext}>
        {ctaText}
      </Button>
    </div>
  );

  // ===== 1) GROWTH =====
  const [selGrowth, setSelGrowth] = useState<"" | "consider-scaleads" | "not-interested">("");
  const [keepGrowth, setKeepGrowth] = useState<boolean>(true);
  const growthEnabled = selGrowth === "consider-scaleads" || selGrowth === "not-interested";

  const GrowthFlow = () => (
    <>
      <Pills items={["Growth", "FBA Reimbursement"]} />
      <Box title="Exclusive Offer">
        <RadioGroup value={selGrowth} onValueChange={(v) => { setSelGrowth(v as typeof selGrowth); setKeepGrowth(true); }}>
          {/* Upgrade → ScaleAds free month */}
          <div className="flex items-start gap-3 mb-3">
            <RadioGroupItem className={radioItemCls} value="consider-scaleads" id="gr1" />
            <div>
              <Label htmlFor="gr1" className="cursor-pointer text-slate-100">
                Consider the <b>ScaleAds Self Service Plan</b> — first month free
              </Label>
              <p className="text-xs text-slate-400">
                Try AI-powered PPC automation with no charges for the first month.
              </p>
              {selGrowth === "consider-scaleads" && (
                <label className="mt-2 flex items-center gap-2 text-slate-200">
                  <Checkbox className={checkItemCls} checked={keepGrowth} onCheckedChange={(v) => setKeepGrowth(!!v)} />
                  <span>Keep reimbursement with <b>9% commission rate</b></span>
                </label>
              )}
            </div>
          </div>

          {/* Cancel Growth */}
          <div className="flex items-start gap-3 mb-1 mt-2">
            <RadioGroupItem className={radioItemCls} value="not-interested" id="gr2" />
            <div>
              <Label htmlFor="gr2" className="cursor-pointer text-slate-100">Not interested</Label>
              {selGrowth === "not-interested" && (
                <label className="mt-2 flex items-center gap-2 text-slate-200">
                  <Checkbox className={checkItemCls} checked={keepGrowth} onCheckedChange={(v) => setKeepGrowth(!!v)} />
                  <span>Keep reimbursement with <b>15% commission rate</b></span>
                </label>
              )}
            </div>
          </div>
        </RadioGroup>
      </Box>

      <Footer
        enabled={growthEnabled}
        onNext={() => {
          if (selGrowth === "not-interested") {
            // Cancel Growth (paid)
            const items: ConfirmLine[] = [
              { name: "Growth Plan", days: PERIOD_DAYS, amountToday: PRICES.growth },
            ];
            setConfirmData({
              kind: "cancel",
              mode: "paid",
              endDate: nextPeriodEnd,
              items,
            });
            setStep(2);
          } else {
            // Switch to ScaleAds — free month (compare: reimbursement kept ise eklenecek)
            const fromAddons = keepGrowth ? ["FBA Reimbursement — 9% commission"] : [];
            const toAddons = keepGrowth ? ["FBA Reimbursement — 9% commission"] : [];
            const items: ConfirmLine[] = [
              { name: "ScaleAds Self Service — Free month", days: PERIOD_DAYS, amountToday: 0 },
            ];
            setConfirmData({
              kind: "switch",
              mode: "trial",
              endDate: trialEndDate,
              items,
              fromLabel: "Growth Plan",
              fromMonthly: PRICES.growth,
              toLabel: "ScaleAds Self Service",
              toMonthly: PRICES.scaleads,
              fromAddons,
              toAddons,
              firstChargeDate: trialEndDate,
              firstChargeAmount: PRICES.scaleads,
              primaryText: "Start free month",
            });
            setStep(2);
          }
        }}
      />
    </>
  );

  // ===== 2) SCALEADS =====
  const [saIsTrial, setSaIsTrial] = useState<boolean>(true);
  const [selSA, setSelSA] = useState<"" | "continue" | "consider-growth" | "not-interested">("");
  const [keepSA, setKeepSA] = useState<boolean>(true);
  const [saNiConsiderGrowth, setSaNiConsiderGrowth] = useState<boolean>(false); // NEW
  const saEnabled = ["continue", "consider-growth", "not-interested"].includes(selSA);
  const saCta = selSA === "continue" ? "Finish" : "Next";
  const saNiRate = saNiConsiderGrowth ? 9 : 15;

  const ScaleAdsFlow = () => (
    <>
      <Pills items={["ScaleAds Self Service", "FBA Reimbursement"]} />
      <Box title={saIsTrial ? "We’re sorry to see you go" : "Exclusive Offer"}>
        {saIsTrial && (
          <p className="text-sm text-slate-200 mb-3">
            You are currently on a free period of ScaleAds Self Service until <b>{trialEndDate}</b>. There are no charges during this period.
          </p>
        )}

        <RadioGroup
          value={selSA}
          onValueChange={(v) => {
            setSelSA(v as typeof selSA);
            setKeepSA(true);
            if (v !== "not-interested") setSaNiConsiderGrowth(false); // reset when leaving NI
          }}
        >
          {saIsTrial && (
            <div className="flex items-start gap-3 mb-3">
              <RadioGroupItem className={radioItemCls} value="continue" id="sa1" />
              <div><Label htmlFor="sa1" className="cursor-pointer text-slate-100">Continue trial</Label></div>
            </div>
          )}

          {/* DOWNGRADE → Growth (direct) */}
          <div className="flex items-start gap-3 mb-3">
            <RadioGroupItem className={radioItemCls} value="consider-growth" id="sa2" />
            <div>
              <Label htmlFor="sa2" className="cursor-pointer text-slate-100">
                Consider the <b>Growth Plan</b> for $49/month
              </Label>
              <p className="text-xs text-slate-400">Experience the robust features of the Growth Plan prior to considering cancellation.</p>
              {selSA === "consider-growth" && (
                <label className="mt-2 flex items-center gap-2 text-slate-200">
                  <Checkbox className={checkItemCls} checked={keepSA} onCheckedChange={(v) => setKeepSA(!!v)} />
                  <span>Keep reimbursement with <b>9% commission rate</b></span>
                </label>
              )}
            </div>
          </div>

          {/* NOT INTERESTED (with Consider Growth + Keep reimbursement) */}
          <div className="flex items-start gap-3 mb-1">
            <RadioGroupItem
              className={radioItemCls}
              value="not-interested"
              id="sa3"
            />
            <div className="w-full">
              <Label htmlFor="sa3" className="cursor-pointer text-slate-100">Not interested</Label>

              {selSA === "not-interested" && (
                <div className="mt-3 ml-1 pl-7 border-l border-slate-700">
                  <label className="flex items-center gap-2 text-slate-200 mb-2">
                    <Checkbox
                      className={checkItemCls}
                      checked={saNiConsiderGrowth}
                      onCheckedChange={(v) => setSaNiConsiderGrowth(!!v)}
                    />
                    <span>Consider the <b>Growth Plan</b> for <b>$49/month</b></span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-200">
                    <Checkbox
                      className={checkItemCls}
                      checked={keepSA}
                      onCheckedChange={(v) => setKeepSA(!!v)}
                    />
                    <span>
                      Keep reimbursement with <b>{saNiRate}% commission rate</b>
                    </span>
                  </label>
                  <p className="text-xs text-slate-400 mt-1">
                    (9% if you also choose the Growth Plan, otherwise 15%)
                  </p>
                </div>
              )}
            </div>
          </div>
        </RadioGroup>
      </Box>

      <Footer
        enabled={saEnabled}
        ctaText={saCta}
        onNext={() => {
          if (selSA === "continue") {
            alert("Continuing current plan — demo");
            return;
          }

          if (selSA === "consider-growth") {
            // Downgrade (direct) — compare’da reimbursement göster
            const fromAddons = keepSA ? ["FBA Reimbursement — 9% commission"] : ["FBA Reimbursement — 9% commission"];
            const toAddons = keepSA ? ["FBA Reimbursement — 9% commission"] : [];
            if (saIsTrial) {
              const items: ConfirmLine[] = [
                { name: "ScaleAds (trial) → Growth later", days: PERIOD_DAYS, amountToday: 0 },
              ];
              setConfirmData({
                kind: "downgrade",
                mode: "trial",
                endDate: trialEndDate,
                items,
                fromLabel: "ScaleAds Self Service",
                fromMonthly: PRICES.scaleads,
                toLabel: "Growth Plan",
                toMonthly: PRICES.growth,
                fromAddons,
                toAddons,
                firstChargeDate: trialEndDate,
                firstChargeAmount: PRICES.growth,
                primaryText: "Confirm plan change",
              });
            } else {
              const delta = Math.max(PRICES.growth - PRICES.scaleads, 0);
              const items: ConfirmLine[] = [
                { name: "Plan change (difference for next 30 days)", days: PERIOD_DAYS, amountToday: delta },
              ];
              setConfirmData({
                kind: "downgrade",
                mode: "paid",
                endDate: nextPeriodEnd,
                items,
                fromLabel: "ScaleAds Self Service",
                fromMonthly: PRICES.scaleads,
                toLabel: "Growth Plan",
                toMonthly: PRICES.growth,
                fromAddons,
                toAddons,
                primaryText: "Confirm plan change",
              });
            }
            setStep(2);
            return;
          }

          if (selSA === "not-interested") {
            // Eğer Consider Growth VEYA Keep reimbursement seçiliyse → plan change olarak ele al
            const someSelected = saNiConsiderGrowth || keepSA;
            if (someSelected) {
              const fromLabel = "ScaleAds Self Service";
              const fromMonthly = PRICES.scaleads;
              const toLabel = saNiConsiderGrowth ? "Growth Plan" : "No subscription";
              const toMonthly = saNiConsiderGrowth ? PRICES.growth : 0;

              // Current'ta reimbursement 9% (ScaleAds varken)
              const fromAddons = ["FBA Reimbursement — 9% commission"];
              const toAddons = keepSA ? [`FBA Reimbursement — ${saNiRate}% commission`] : [];

              if (saIsTrial) {
                const items: ConfirmLine[] = [
                  { name: "ScaleAds (trial) → new plan later", days: PERIOD_DAYS, amountToday: 0 },
                ];
                setConfirmData({
                  kind: "downgrade",
                  mode: "trial",
                  endDate: trialEndDate,
                  items,
                  fromLabel,
                  fromMonthly,
                  toLabel,
                  toMonthly,
                  fromAddons,
                  toAddons,
                  firstChargeDate: toMonthly > 0 ? trialEndDate : undefined,
                  firstChargeAmount: toMonthly > 0 ? toMonthly : undefined,
                  primaryText: "Confirm plan change",
                });
              } else {
                const delta = Math.max(toMonthly - fromMonthly, 0);
                const items: ConfirmLine[] = [
                  { name: "Plan change (difference for next 30 days)", days: PERIOD_DAYS, amountToday: delta },
                ];
                setConfirmData({
                  kind: "downgrade",
                  mode: "paid",
                  endDate: nextPeriodEnd,
                  items,
                  fromLabel,
                  fromMonthly,
                  toLabel,
                  toMonthly,
                  fromAddons,
                  toAddons,
                  primaryText: "Confirm plan change",
                });
              }
            } else {
              // Hiçbiri seçilmediyse tam iptal
              const items: ConfirmLine[] = [
                { name: saIsTrial ? "ScaleAds Self Service (Trial)" : "ScaleAds Self Service", days: PERIOD_DAYS, amountToday: saIsTrial ? 0 : PRICES.scaleads },
              ];
              setConfirmData({ kind: "cancel", mode: saIsTrial ? "trial" : "paid", endDate: saIsTrial ? trialEndDate : nextPeriodEnd, items });
            }
            setStep(2);
          }
        }}
      />
    </>
  );

  // ===== 3) SCALEADS + DEDICATED =====
  const [dedIsTrial, setDedIsTrial] = useState<boolean>(true);
  const [selDedicated, setSelDedicated] = useState<"" | "continue" | "scaleads-without-dedicated" | "not-interested">("");

  const [dedKeepContinue, setDedKeepContinue] = useState<boolean>(true);
  const [dedKeepScaleAdsOnly, setDedKeepScaleAdsOnly] = useState<boolean>(true);
  const [niConsiderGrowth, setNiConsiderGrowth] = useState<boolean>(false);
  const [niKeepReimb, setNiKeepReimb] = useState<boolean>(true);

  const dedEnabled = ["continue", "scaleads-without-dedicated", "not-interested"].includes(selDedicated);
  const dedCta = selDedicated === "continue" ? "Finish" : "Next";
  const notInterestedRate = niConsiderGrowth ? 9 : 15;

  const DedicatedFlow = () => (
    <>
      <Pills items={["ScaleAds Self Service", "Dedicated Specialist", "FBA Reimbursement"]} />
      <Box title={dedIsTrial ? "We’re sorry to see you go" : "Exclusive Offer"}>
        {dedIsTrial && (
          <p className="text-sm text-slate-200 mb-3">
            You are currently on a free period of <b>ScaleAds with Dedicated Specialist</b> until <b>{trialEndDate}</b>. There are no charges during this period.
          </p>
        )}

        <RadioGroup value={selDedicated} onValueChange={(v) => {
          setSelDedicated(v as typeof selDedicated);
          if (v === "continue") setDedKeepContinue(true);
          if (v === "scaleads-without-dedicated") setDedKeepScaleAdsOnly(true);
          if (v === "not-interested") { setNiConsiderGrowth(false); setNiKeepReimb(true); }
        }}>

          {dedIsTrial && (
            <div className="flex items-start gap-3 mb-3">
              <RadioGroupItem className={radioItemCls} value="continue" id="sd0" />
              <div>
                <Label htmlFor="sd0" className="cursor-pointer text-slate-100">Continue trial</Label>
                {selDedicated === "continue" && (
                  <label className="mt-2 flex items-center gap-2 text-slate-200">
                    <Checkbox className={checkItemCls} checked={dedKeepContinue} onCheckedChange={(v) => setDedKeepContinue(!!v)} />
                    <span>Keep reimbursement with <b>9% commission rate</b></span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* DOWNGRADE → remove Dedicated */}
          <div className="flex items-start gap-3 mb-3">
            <RadioGroupItem className={radioItemCls} value="scaleads-without-dedicated" id="sd1" />
            <div className="w-full">
              <Label htmlFor="sd1" className="cursor-pointer text-slate-100">Consider <b>ScaleAds without Dedicated</b></Label>
              <p className="text-xs text-slate-400">Keep ScaleAds automation active while removing the Dedicated Specialist add-on.</p>
              {selDedicated === "scaleads-without-dedicated" && (
                <label className="mt-2 flex items-center gap-2 text-slate-200">
                  <Checkbox className={checkItemCls} checked={dedKeepScaleAdsOnly} onCheckedChange={(v) => setDedKeepScaleAdsOnly(!!v)} />
                  <span>Keep reimbursement with <b>9% commission rate</b></span>
                </label>
              )}
            </div>
          </div>

          {/* NOT INTERESTED */}
          <div className="flex items-start gap-3 mb-1">
            <RadioGroupItem className={radioItemCls} value="not-interested" id="sd2" />
            <div className="w-full">
              <Label htmlFor="sd2" className="cursor-pointer text-slate-100">Not interested</Label>
              {selDedicated === "not-interested" && (
                <div className="mt-3 ml-1 pl-7 border-l border-slate-700">
                  <label className="flex items-center gap-2 text-slate-200 mb-2">
                    <Checkbox className={checkItemCls} checked={niConsiderGrowth} onCheckedChange={(v) => setNiConsiderGrowth(!!v)} />
                    <span>Consider the <b>Growth Plan</b> for <b>$49/month</b></span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-200">
                    <Checkbox className={checkItemCls} checked={niKeepReimb} onCheckedChange={(v) => setNiKeepReimb(!!v)} />
                    <span>Keep reimbursement with <b>{notInterestedRate}% commission rate</b></span>
                  </label>
                  <p className="text-xs text-slate-400 mt-1">(9% if you also choose the Growth Plan, otherwise 15%)</p>
                </div>
              )}
            </div>
          </div>
        </RadioGroup>
      </Box>

      <Footer
        enabled={dedEnabled}
        ctaText={dedCta}
        onNext={() => {
          if (selDedicated === "continue") {
            alert("Continuing current plan — demo");
            return;
          }

          if (selDedicated === "scaleads-without-dedicated") {
            // compare'da reimbursement göster
            const fromAddons = ["FBA Reimbursement — 9% commission"]; // current: ScaleAds aktifken 9%
            const toAddons = dedKeepScaleAdsOnly ? ["FBA Reimbursement — 9% commission"] : [];

            if (dedIsTrial) {
              const items: ConfirmLine[] = [
                { name: "ScaleAds w/o Dedicated (starts after trial)", days: PERIOD_DAYS, amountToday: 0 },
              ];
              setConfirmData({
                kind: "downgrade",
                mode: "trial",
                endDate: trialEndDate,
                items,
                fromLabel: "ScaleAds + Dedicated",
                fromMonthly: PRICES.scaleads + PRICES.dedicated,
                toLabel: "ScaleAds Self Service",
                toMonthly: PRICES.scaleads,
                fromAddons,
                toAddons,
                firstChargeDate: trialEndDate,
                firstChargeAmount: PRICES.scaleads,
                primaryText: "Confirm plan change",
              });
            } else {
              const delta = Math.max(PRICES.scaleads - (PRICES.scaleads + PRICES.dedicated), 0);
              const items: ConfirmLine[] = [
                { name: "Plan change (difference for next 30 days)", days: PERIOD_DAYS, amountToday: delta },
              ];
              setConfirmData({
                kind: "downgrade",
                mode: "paid",
                endDate: nextPeriodEnd,
                items,
                fromLabel: "ScaleAds + Dedicated",
                fromMonthly: PRICES.scaleads + PRICES.dedicated,
                toLabel: "ScaleAds Self Service",
                toMonthly: PRICES.scaleads,
                fromAddons,
                toAddons,
                primaryText: "Confirm plan change",
              });
            }
            setStep(2);
            return;
          }

          if (selDedicated === "not-interested") {
            const someSelected = niConsiderGrowth || niKeepReimb;

            if (someSelected) {
              const fromLabel = "ScaleAds + Dedicated Specialist";
              const fromMonthly = PRICES.scaleads + PRICES.dedicated;
              const toLabel = niConsiderGrowth ? "Growth Plan" : "No subscription";
              const toMonthly = niConsiderGrowth ? PRICES.growth : 0;

              // current add-on: 9% (ScaleAds varken)
              const fromAddons = ["FBA Reimbursement — 9% commission"];
              const toAddons = niKeepReimb ? [`FBA Reimbursement — ${niConsiderGrowth ? 9 : 15}% commission`] : [];

              if (dedIsTrial) {
                const items: ConfirmLine[] = [
                  { name: "Current plan (trial) → new plan later", days: PERIOD_DAYS, amountToday: 0 },
                ];
                setConfirmData({
                  kind: "downgrade",
                  mode: "trial",
                  endDate: trialEndDate,
                  items,
                  fromLabel,
                  fromMonthly,
                  toLabel,
                  toMonthly,
                  fromAddons,
                  toAddons,
                  firstChargeDate: toMonthly > 0 ? trialEndDate : undefined,
                  firstChargeAmount: toMonthly > 0 ? toMonthly : undefined,
                  primaryText: "Confirm plan change",
                });
              } else {
                const delta = Math.max(toMonthly - fromMonthly, 0);
                const items: ConfirmLine[] = [
                  { name: "Plan change (difference for next 30 days)", days: PERIOD_DAYS, amountToday: delta },
                ];
                setConfirmData({
                  kind: "downgrade",
                  mode: "paid",
                  endDate: nextPeriodEnd,
                  items,
                  fromLabel,
                  fromMonthly,
                  toLabel,
                  toMonthly,
                  fromAddons,
                  toAddons,
                  primaryText: "Confirm plan change",
                });
              }
            } else {
              // Hiçbiri seçilmediyse tam iptal
              const items: ConfirmLine[] = [
                { name: dedIsTrial ? "ScaleAds Self Service (Trial)" : "ScaleAds Self Service", days: PERIOD_DAYS, amountToday: dedIsTrial ? 0 : PRICES.scaleads },
                { name: dedIsTrial ? "Dedicated Specialist (Trial)" : "Dedicated Specialist", days: PERIOD_DAYS, amountToday: dedIsTrial ? 0 : PRICES.dedicated },
              ];
              setConfirmData({ kind: "cancel", mode: dedIsTrial ? "trial" : "paid", endDate: dedIsTrial ? trialEndDate : nextPeriodEnd, items });
            }
            setStep(2);
          }
        }}
      />
    </>
  );

  // ---------- Confirmation state ----------
  const [confirmData, setConfirmData] = useState<{
    kind: ConfirmKind;
    mode: Mode;
    endDate: string;
    items: ConfirmLine[];
    fromLabel?: string;
    fromMonthly?: number;
    toLabel?: string;
    toMonthly?: number;
    fromAddons?: string[];
    toAddons?: string[];
    firstChargeDate?: string;
    firstChargeAmount?: number;
    primaryText?: string;
  } | null>(null);

  // ===== Header (Scenario & Trial toggles dışarıda) =====
  const Header = () => (
    <header className="w-full max-w-2xl mx-auto mb-4">
      <div className="flex gap-2 justify-center">
        <button
          className={toggleBtn(scenario === "growth")}
          onClick={() => { setScenario("growth"); setStep(1); }}
        >
          Growth
        </button>
        <button
          className={toggleBtn(scenario === "scaleads")}
          onClick={() => { setScenario("scaleads"); setStep(1); }}
        >
          ScaleAds
        </button>
        <button
          className={toggleBtn(scenario === "scaleads+dedicated")}
          onClick={() => { setScenario("scaleads+dedicated"); setStep(1); }}
        >
          ScaleAds + Dedicated
        </button>
      </div>

      {/* Trial / Without Trial toggles (green border on active) */}
      {scenario === "scaleads" && (
        <div className="flex gap-2 justify-center mt-3">
          <button
            className={toggleBtn(saIsTrial)}
            onClick={() => { setSaIsTrial(true); setSelSA(""); setKeepSA(true); setSaNiConsiderGrowth(false); setStep(1); }}
          >
            Trial
          </button>
          <button
            className={toggleBtn(!saIsTrial)}
            onClick={() => { setSaIsTrial(false); setSelSA(""); setKeepSA(true); setSaNiConsiderGrowth(false); setStep(1); }}
          >
            Without Trial
          </button>
        </div>
      )}

      {scenario === "scaleads+dedicated" && (
        <div className="flex gap-2 justify-center mt-3">
          <button
            className={toggleBtn(dedIsTrial)}
            onClick={() => {
              setDedIsTrial(true);
              setSelDedicated("");
              setDedKeepContinue(true);
              setDedKeepScaleAdsOnly(true);
              setNiConsiderGrowth(false);
              setNiKeepReimb(true);
              setStep(1);
            }}
          >
            Trial
          </button>
          <button
            className={toggleBtn(!dedIsTrial)}
            onClick={() => {
              setDedIsTrial(false);
              setSelDedicated("");
              setDedKeepScaleAdsOnly(true);
              setNiConsiderGrowth(false);
              setNiKeepReimb(true);
              setStep(1);
            }}
          >
            Without Trial
          </button>
        </div>
      )}
    </header>
  );

  // ===== Render =====
  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <Header />
      <Panel>
        {step === 1 && (
          <>
            <h2 className="text-center text-xl font-semibold mb-6">Your Current Plan(s)</h2>
            {scenario === "growth" && <GrowthFlow />}
            {scenario === "scaleads" && <ScaleAdsFlow />}
            {scenario === "scaleads+dedicated" && <DedicatedFlow />}
          </>
        )}

        {step === 2 && confirmData && (
          <CancellationConfirm
            {...confirmData}
            onStay={() => setStep(1)}
            onConfirm={() =>
              alert(
                confirmData.kind === "cancel"
                  ? "Cancellation confirmed — demo"
                  : confirmData.kind === "switch"
                  ? "Free month started — demo"
                  : "Plan changed — demo"
              )
            }
          />
        )}
      </Panel>
    </main>
  );
}
