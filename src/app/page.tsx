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
  days: number;        // policy: remaining days
  amountToday: number; // charged today (trial flows = 0)
};

// ---------- Pricing & Policy ----------
const PRICES = {
  growth: 49,
  scaleads: 299,
  dedicated: 200,
};
const PERIOD_DAYS = 30;

// NOTE: In a real app, remaining days should be computed from the user's billing cycle.
const getRemainingDays = () => PERIOD_DAYS;

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

const prorate = (amount: number, remainingDays: number) =>
  Math.max(0, amount) * (remainingDays / PERIOD_DAYS);

// ---------- Component ----------
export default function Page() {
  const [scenario, setScenario] = useState<Scenario>("scaleads+dedicated");
  const [step, setStep] = useState<Step>(1);

  // --- Styles ---
  const radioItemCls =
    "border-slate-400 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-600";
  const checkItemCls =
    "border-slate-400 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-600";

  // Dates (demo: today + 30 days)
  const today = new Date();
  const trialEndDate = fmtDate(addDays(today, PERIOD_DAYS));
  const nextPeriodEnd = fmtDate(addDays(today, PERIOD_DAYS));
  const remainingDays = getRemainingDays();

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
  // ---------- Step 2: Confirmation (STANDARDIZED) ----------
const CancellationConfirm: React.FC<{
  // 3 durum: cancel | downgrade | switch
  kind: "cancel" | "downgrade" | "switch";
  // trial vs paid
  mode: "trial" | "paid";
  // dönem/trial bitiş tarihi
  endDate: string;
  // "Charged today" kalemleri (yalnız total>0 iken gösterilecek)
  items: { name: string; days: number; amountToday: number }[];

  // Compare kartı için (platform→platform geçişte dolu gelir; reimbursement-only için toLabel undefined olmalı)
  fromLabel?: string;
  fromMonthly?: number;
  toLabel?: string;          // compare'ı gizlemek için UNDEFINED bırak
  toMonthly?: number;
  fromAddons?: string[];
  toAddons?: string[];

  // Trial akışları için ilk tahsil bilgisi
  firstChargeDate?: string;
  firstChargeAmount?: number;

  // Buton metni override (opsiyonel)
  primaryText?: string;

  // Cancel + reimbursement-only gibi ek bilgilendirme
  auxMessage?: string;

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
  auxMessage,
  onStay,
  onConfirm,
}) => {
  const [ack, setAck] = useState(false);
  const totalToday = useMemo(
    () => items.reduce((s, it) => s + (it.amountToday || 0), 0),
    [items]
  );

  // Başlık (Step-2 Title)
  const title =
  kind === "cancel"
    ? "Are you sure?"
    : (mode === "paid" && toLabel)
    ? `Switch to ${toLabel}`
    : "Confirm your plan change";


  // Üst kopya (Step-2 top copy)
  const topCopy = (() => {
    // 1) CANCEL PLATFORM
    if (kind === "cancel") {
      if (mode === "trial") {
        return `You’re on a free period. If you cancel now, you won’t be charged. Your free period remains active until ${endDate}, after which your subscription will end automatically.`;
      }
      // paid cancel — NOT: “next 30 days” YOK; tam ay metni + bitiş tarihi
      return `When you cancel, your subscription stays active for 30 days from today. You’ll be charged one full month now, and your plan will remain active until ${endDate}.`;
    }

    // 2) SWITCH (TRIAL) — her zaman compare görünür, $0 today
    if (kind === "switch" && mode === "trial") {
      const planName = toLabel ?? "your new plan";
      return `You’re moving to ${planName} with a free month. You’ll pay $0.00 today. Your free period runs until ${endDate}.`;
    }

// 3) DOWNGRADE/SWITCH (PAID) — explicit "You're switching to X" + prorated / no charge
if ((kind === "downgrade" || kind === "switch") && mode === "paid") {
  const planName = toLabel ?? "your new plan";
  const tail = totalToday > 0
    ? "You’ll be charged the prorated difference for the remaining days of your current period."
    : "You won’t be charged today. Your new plan starts immediately.";
  return `You’re switching to ${planName}. ${tail}`;
}


    // 4) DOWNGRADE (TRIAL) — trial bitişinde geçiş
    if (kind === "downgrade" && mode === "trial") {
      const planName = toLabel ?? "your new plan";
      return `You’re on a free period now. Your plan will switch to ${planName} when the free period ends on ${endDate}. You’ll pay $0.00 today.`;
    }

    return "";
  })();

  return (
    <div>
      <h2 className="text-center text-2xl font-semibold mb-3">{title}</h2>

      {/* Compare: yalnız platform→platform geçişlerde; reimbursement-only için toLabel UNDEFINED bırakılmalı */}
      {kind !== "cancel" &&
        fromLabel &&
        toLabel !== undefined &&
        typeof fromMonthly === "number" &&
        typeof toMonthly === "number" && (
          <PriceCompare
            fromLabel={fromLabel}
            fromMonthly={fromMonthly}
            toLabel={toLabel}
            toMonthly={toMonthly}
            fromAddons={fromAddons}
            toAddons={toAddons}
          />
        )}

      {/* Üst kopya */}
      <p className="text-sm text-slate-300">{topCopy}</p>

      {/* Trial akışları için ilk tahsil bilgisi (switch veya downgrade trial) */}
      {mode === "trial" &&
        (kind === "switch" || kind === "downgrade") &&
        firstChargeDate &&
        typeof firstChargeAmount === "number" && (
          <p className="text-sm text-slate-300 mt-3">
            {kind === "switch"
              ? `Starting on ${firstChargeDate}, you’ll be charged ${money(firstChargeAmount)}/month unless you cancel.`
              : `First charge on ${firstChargeDate}: ${money(firstChargeAmount)}/month.`}
          </p>
        )}

      {/* Ek bilgi: platform iptal + yalnız reimbursement kalıyorsa (örn. %15) */}
      {auxMessage && <p className="text-sm text-slate-300 mt-3">{auxMessage}</p>}

      {/* Charged today: SADECE total>0 iken görünür (delta=0 ise komple gizli) */}
      {totalToday > 0 && (
        <div className="mt-5">
          <div className="text-center text-sm text-slate-400 mb-2">Will be charged today</div>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-md bg-slate-800 border border-slate-700 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-slate-700 px-2 py-1 text-xs">{it.name}</div>
                  <div className="text-xs text-slate-400">
                    ×{it.days} {it.days === 1 ? "day" : "days"}
                  </div>
                </div>
                <div className="text-sm font-medium">{money(it.amountToday)}</div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-md bg-slate-900 border border-slate-700 px-3 py-2">
              <div className="text-sm text-slate-300">Total today</div>
              <div className="text-sm font-semibold">
                {money(items.reduce((s, it) => s + it.amountToday, 0))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* T&C + Actions */}
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

      <div className="flex items-center gap-2 mt-5">
        <Button className="cursor-pointer" variant="secondary" onClick={onStay}>
          Go back
        </Button>
        <Button
          className="cursor-pointer bg-blue-600 hover:bg-blue-500"
          disabled={!ack}
          onClick={onConfirm}
        >
          Confirm
        </Button>
      </div>

      <div className="text-xs text-slate-400 mt-4">
      If you have any questions before canceling, let us assist you. Book a session with our Customer Success{" "}
        <a href="https://eva.guru/booking/customer-feedback/" className="underline" target="_blank">here</a>.
      </div>
    </div>
  );
};


  // ---------- Step 1 Common Footer ----------
  const Footer = React.memo(function Footer({ 
    enabled, 
    ctaText = "Next", 
    onNext 
  }: {
    enabled: boolean;
    ctaText?: string;
    onNext?: () => void;
  }) {
    return (
      <div className="flex items-center justify-between mt-6 text-xs text-slate-400">
        <div className="flex flex-col gap-1 max-w-[70%]">
          <span>If you have any questions before canceling, let us assist you.</span>
          <span>Book a session with our{" "}
            <a href="https://eva.guru/booking/customer-feedback/" className="underline" target="_blank" rel="noopener noreferrer">
              Customer Success here
            </a>.
          </span>
        </div>
        <Button className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 ml-4" disabled={!enabled} onClick={onNext}>
          {ctaText}
        </Button>
      </div>
    );
  });

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
                Consider the <b>ScaleAds Self Service with Dedicated Specialist Plan</b> — first month free
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
              auxMessage: keepGrowth
                ? "Your platform package will be cancelled. After cancellation, only Reimbursement will remain active at 15% commission."
                : undefined,
            });
            setStep(2);
          } else {
            // Switch to ScaleAds — free month (COMPARE shown)
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
              primaryText: "Next",
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
  const [saNiConsiderGrowth, setSaNiConsiderGrowth] = useState<boolean>(false);
  const saEnabled = ["continue", "consider-growth", "not-interested"].includes(selSA);
  const saCta = selSA === "continue" ? "Finish" : "Next";
  const saNiRate = saNiConsiderGrowth ? 9 : 15;

  const ScaleAdsFlow = () => (
    <>
      <Pills items={["ScaleAds Self Service", "FBA Reimbursement"]} />
    <Box title={saIsTrial ? "Keep exploring, no charge" : "Exclusive Offer"}>
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
          if (v !== "not-interested") setSaNiConsiderGrowth(false);
        }}
      >
        {saIsTrial && (
          <div className="flex items-start gap-3 mb-3">
            <RadioGroupItem className={radioItemCls} value="continue" id="sa1" />
            <div><Label htmlFor="sa1" className="cursor-pointer text-slate-100">Continue Using and Reconsider to Cancel</Label></div>
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
                  <label className="flex items-center gap-2 text-slate-200">
                    <Checkbox
                      className={checkItemCls}
                      checked={keepSA}
                      onCheckedChange={(v) => setKeepSA(!!v)}
                    />
                    <span>
                      Keep reimbursement with <b>15% commission rate</b>
                    </span>
                  </label>
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
            // ScaleAds → Growth (COMPARE SHOWN)
            const fromAddons = keepSA ? ["FBA Reimbursement — 9% commission"] : ["FBA Reimbursement — 9% commission"];
            const toAddons = keepSA ? ["FBA Reimbursement — 9% commission"] : [];
            if (saIsTrial) {
              const items: ConfirmLine[] = [
                { name: "ScaleAds (Free Period) → Growth later", days: PERIOD_DAYS, amountToday: 0 },
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
              const deltaMonthly = Math.max(PRICES.growth - PRICES.scaleads, 0);
              const deltaProrated = prorate(deltaMonthly, remainingDays);
              const items: ConfirmLine[] = [
                { name: "Plan change (prorated for remaining days)", days: remainingDays, amountToday: deltaProrated },
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
            // Consider Growth and/or keep reimbursement → plan change
            const someSelected = saNiConsiderGrowth || keepSA;
            if (someSelected) {
              const fromLabel = "ScaleAds Self Service";
              const fromMonthly = PRICES.scaleads;

              if (saNiConsiderGrowth) {
                // ScaleAds → Growth (COMPARE SHOWN HERE TOO)
                const toLabel = "Growth Plan";
                const toMonthly = PRICES.growth;
                const fromAddons = ["FBA Reimbursement — 9% commission"];
                const toAddons = keepSA ? ["FBA Reimbursement — 9% commission"] : [];

                if (saIsTrial) {
                  const items: ConfirmLine[] = [
                    { name: "ScaleAds (Free Period) → Growth later", days: PERIOD_DAYS, amountToday: 0 },
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
                    firstChargeDate: trialEndDate,
                    firstChargeAmount: PRICES.growth,
                    primaryText: "Confirm plan change",
                  });
                } else {
                  const deltaMonthly = Math.max(toMonthly - fromMonthly, 0);
                  const deltaProrated = prorate(deltaMonthly, remainingDays);
                  const items: ConfirmLine[] = [
                    { name: "Plan change (prorated for remaining days)", days: remainingDays, amountToday: deltaProrated },
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
                // Full cancel with reimbursement
                if (saIsTrial) {
                  const items: ConfirmLine[] = [
                    { name: "Current plan (in free period)", days: PERIOD_DAYS, amountToday: 0 },
                  ];
                  setConfirmData({
                    kind: "cancel",
                    mode: "trial",
                    endDate: trialEndDate,
                    items,
                    auxMessage: keepSA
                      ? `Your platform package will be cancelled. After cancellation, only Reimbursement will remain active at ${saNiRate}% commission.`
                      : undefined,
                  });
                } else {
                  const items: ConfirmLine[] = [
                    { name: "ScaleAds Self Service", days: PERIOD_DAYS, amountToday: PRICES.scaleads },
                  ];
                  setConfirmData({
                    kind: "cancel",
                    mode: "paid",
                    endDate: nextPeriodEnd,
                    items,
                    auxMessage: keepSA
                      ? `Your platform package will be cancelled. After cancellation, only Reimbursement will remain active at ${saNiRate}% commission.`
                      : undefined,
                  });
                }
              }
            } else {
              // Full cancel
              if (saIsTrial) {
                const items: ConfirmLine[] = [
                  { name: "ScaleAds Self Service (Free Period)", days: PERIOD_DAYS, amountToday: 0 },
                ];
                setConfirmData({ 
                  kind: "cancel", 
                  mode: "trial", 
                  endDate: trialEndDate, 
                  items 
                });
              } else {
                const items: ConfirmLine[] = [
                  { name: "ScaleAds Self Service", days: PERIOD_DAYS, amountToday: PRICES.scaleads },
                ];
                setConfirmData({ 
                  kind: "cancel", 
                  mode: "paid", 
                  endDate: nextPeriodEnd, 
                  items,
                  auxMessage: keepSA
                    ? `Your platform package will be cancelled. After cancellation, only Reimbursement will remain active at ${saNiRate}% commission.`
                    : undefined,
                });
              }
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
      <Box title={dedIsTrial ? "Keep exploring, no charge" : "Exclusive Offer"}>
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
                <Label htmlFor="sd0" className="cursor-pointer text-slate-100">Continue Using and Reconsider to Cancel</Label>
                {selDedicated === "continue" && (
                  <label className="mt-2 flex items-center gap-2 text-slate-200">
                    <Checkbox className={checkItemCls} checked={dedKeepContinue} onCheckedChange={(v) => setDedKeepContinue(!!v)} />
                    <span>Keep reimbursement with <b>9% commission rate</b></span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* DOWNGRADE → remove Dedicated (COMPARE SHOWN) */}
          <div className="flex items-start gap-3 mb-3">
            <RadioGroupItem className={radioItemCls} value="scaleads-without-dedicated" id="sd1" />
            <div className="w-full">
              <Label htmlFor="sd1" className="cursor-pointer text-slate-100">Consider <b>ScaleAds without Dedicated Specialist</b></Label>
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
            // ScaleAds+Dedicated → ScaleAds (COMPARE SHOWN)
            const fromAddons = ["FBA Reimbursement — 9% commission"];
            const toAddons = dedKeepScaleAdsOnly ? ["FBA Reimbursement — 9% commission"] : [];

            if (dedIsTrial) {
              const items: ConfirmLine[] = [
                { name: "ScaleAds w/o Dedicated (starts after free period)", days: PERIOD_DAYS, amountToday: 0 },
              ];
              setConfirmData({
                kind: "downgrade",
                mode: "trial",
                endDate: trialEndDate,
                items,
                fromLabel: "ScaleAds Self Service + Dedicated Specialist",
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
              const deltaMonthly = Math.max(PRICES.scaleads - (PRICES.scaleads + PRICES.dedicated), 0);
              const deltaProrated = prorate(deltaMonthly, remainingDays);
              const items: ConfirmLine[] = [
                { name: "Plan change (prorated for remaining days)", days: remainingDays, amountToday: deltaProrated },
              ];
              setConfirmData({
                kind: "downgrade",
                mode: "paid",
                endDate: nextPeriodEnd,
                items,
                fromLabel: "ScaleAds Self Service + Dedicated Specialist",
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
              const fromLabel = "ScaleAds Self Service + Dedicated Specialist";
              const fromMonthly = PRICES.scaleads + PRICES.dedicated;

              if (niConsiderGrowth) {
                // ScaleAds+Dedicated → Growth (COMPARE SHOWN)
                const toLabel = "Growth Plan";
                const toMonthly = PRICES.growth;
                const fromAddons = ["FBA Reimbursement — 9% commission"];
                const toAddons = niKeepReimb ? ["FBA Reimbursement — 9% commission"] : [];

                if (dedIsTrial) {
                  const items: ConfirmLine[] = [
                    { name: "Current plan (in free period) → Growth later", days: PERIOD_DAYS, amountToday: 0 },
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
                    firstChargeDate: trialEndDate,
                    firstChargeAmount: PRICES.growth,
                    primaryText: "Confirm plan change",
                  });
                } else {
                  const deltaMonthly = Math.max(toMonthly - fromMonthly, 0);
                  const deltaProrated = prorate(deltaMonthly, remainingDays);
                  const items: ConfirmLine[] = [
                    { name: "Plan change (prorated for remaining days)", days: remainingDays, amountToday: deltaProrated },
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
                // Full cancel with reimbursement
                if (dedIsTrial) {
                  const items: ConfirmLine[] = [
                    { name: "Current plan (in free period)", days: PERIOD_DAYS, amountToday: 0 },
                  ];
                  setConfirmData({
                    kind: "cancel",
                    mode: "trial",
                    endDate: trialEndDate,
                    items,
                    auxMessage: niKeepReimb
                      ? `Your platform package will be cancelled. After cancellation, only Reimbursement will remain active at ${notInterestedRate}% commission.`
                      : undefined,
                  });
                } else {
                  const items: ConfirmLine[] = [
                    { name: "ScaleAds Self Service", days: PERIOD_DAYS, amountToday: PRICES.scaleads },
                    { name: "Dedicated Specialist", days: PERIOD_DAYS, amountToday: PRICES.dedicated },
                  ];
                  setConfirmData({
                    kind: "cancel",
                    mode: "paid",
                    endDate: nextPeriodEnd,
                    items,
                    auxMessage: niKeepReimb
                      ? `Your platform package will be cancelled. After cancellation, only Reimbursement will remain active at ${notInterestedRate}% commission.`
                      : undefined,
                  });
                }
              }
            } else {
              // Full cancel based on trial status
              const items: ConfirmLine[] = dedIsTrial
                ? [
                    { name: "ScaleAds Self Service (Free Period)", days: PERIOD_DAYS, amountToday: 0 },
                    { name: "Dedicated Specialist (Free Period)", days: PERIOD_DAYS, amountToday: 0 },
                  ]
                : [
                    { name: "ScaleAds Self Service", days: PERIOD_DAYS, amountToday: PRICES.scaleads },
                    { name: "Dedicated Specialist", days: PERIOD_DAYS, amountToday: PRICES.dedicated },
                  ];
              setConfirmData({ 
                kind: "cancel", 
                mode: dedIsTrial ? "trial" : "paid", 
                endDate: dedIsTrial ? trialEndDate : nextPeriodEnd, 
                items 
              });
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
    toLabel?: string;     // optional — hide compare when undefined
    toMonthly?: number;   // keep numeric for math
    fromAddons?: string[];
    toAddons?: string[];
    firstChargeDate?: string;
    firstChargeAmount?: number;
    primaryText?: string;
    auxMessage?: string;  // extra info text
  } | null>(null);

  // ===== Header (Scenario & Trial toggles) =====


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
          ScaleAds Self Service + Dedicated Specialist
        </button>
      </div>

      {scenario === "scaleads" && (
        <div className="flex gap-2 justify-center mt-3">
          <button
            className={toggleBtn(saIsTrial)}
            onClick={() => {
              setSaIsTrial(true);
              setSelSA("");
              setKeepSA(true);
              setSaNiConsiderGrowth(false);
              setStep(1);
            }}
          >
            Trial
          </button>
          <button
            className={toggleBtn(!saIsTrial)}
            onClick={() => {
              setSaIsTrial(false);
              setSelSA("");
              setKeepSA(true);
              setSaNiConsiderGrowth(false);
              setStep(1);
            }}
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
