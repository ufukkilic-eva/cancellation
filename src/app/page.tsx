"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

type Scenario = "growth" | "scaleads" | "scaleads+dedicated";

export default function App() {
  const [scenario, setScenario] = useState<Scenario>("scaleads+dedicated");

  // --- Styles ---
  const radioItemCls =
    "border-slate-400 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-600";
  const checkItemCls =
    "border-slate-400 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-600";
  const btnCls = "cursor-pointer";

  // Bugünden 30 gün sonrasını formatla
  const getTrialEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative w-full max-w-2xl mx-auto rounded-lg bg-slate-900/90 border border-slate-700 p-6 text-slate-100 shadow">
      <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div
          key={i}
          className="px-3 py-2 rounded-md text-sm font-medium bg-slate-800 border border-slate-700"
        >
          {it}
        </div>
      ))}
    </div>
  );

  const Box: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <div className="mt-6 rounded-lg border border-blue-400/40 bg-slate-900 p-4 shadow-[0_0_0_1px_rgba(56,97,251,0.15)_inset]">
      <div className="text-blue-300 font-semibold mb-2">{title}</div>
      {children}
    </div>
  );

  const Footer: React.FC<{ enabled: boolean; ctaText?: string }> = ({
    enabled,
    ctaText = "Next",
  }) => (
    <div className="flex items-center justify-between mt-6 text-xs text-slate-400">
      <span>
        If you have a problem, before cancellation{" "}
        <a href="#" className="underline">
          let us contact you
        </a>
        .
      </span>
      <Button
        className={`${btnCls} bg-blue-600 hover:bg-blue-500 text-white px-6`}
        disabled={!enabled}
      >
        {ctaText}
      </Button>
    </div>
  );

  // ===== 1) Growth =====
  const [selGrowth, setSelGrowth] =
    useState<"" | "consider-scaleads" | "not-interested">("");
  const [keepGrowth, setKeepGrowth] = useState<boolean>(true); // default checked
  const growthEnabled =
    selGrowth === "consider-scaleads" || selGrowth === "not-interested";

  const GrowthFlow = () => (
    <>
      <Pills items={["Growth", "FBA Reimbursement"]} />
      <Box title="Exclusive Offer">
        <RadioGroup
          value={selGrowth}
          onValueChange={(v) => {
            setSelGrowth(v as typeof selGrowth);
            setKeepGrowth(true); // default checked on change
          }}
        >
          {/* Consider ScaleAds Self Service Plan (first month free) → 9% */}
          <div className="flex items-start gap-3 mb-3">
            <RadioGroupItem
              className={radioItemCls}
              value="consider-scaleads"
              id="gr1"
            />
            <div>
              <Label htmlFor="gr1" className="cursor-pointer text-slate-100">
                Consider the <b>ScaleAds Self Service Plan</b> — first month
                free
              </Label>
              <p className="text-xs text-slate-400">
                Experience AI-powered PPC automation with no charges for the
                first month.
              </p>

              {selGrowth === "consider-scaleads" && (
                <label className="mt-2 flex items-center gap-2 text-slate-200">
                  <Checkbox
                    className={checkItemCls}
                    checked={keepGrowth}
                    onCheckedChange={(v) => setKeepGrowth(!!v)}
                  />
                  <span>
                    Keep reimbursement with <b>9% commission rate</b>
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Not interested → 15% */}
          <div className="flex items-start gap-3 mb-1 mt-2">
            <RadioGroupItem
              className={radioItemCls}
              value="not-interested"
              id="gr2"
            />
            <div>
              <Label htmlFor="gr2" className="cursor-pointer text-slate-100">
                Not interested
              </Label>

              {selGrowth === "not-interested" && (
                <label className="mt-2 flex items-center gap-2 text-slate-200">
                  <Checkbox
                    className={checkItemCls}
                    checked={keepGrowth}
                    onCheckedChange={(v) => setKeepGrowth(!!v)}
                  />
                  <span>
                    Keep reimbursement with <b>15% commission rate</b>
                  </span>
                </label>
              )}
            </div>
          </div>
        </RadioGroup>
      </Box>
      <Footer enabled={growthEnabled} />
    </>
  );

  // ===== 2) ScaleAds (Trial / Without Trial) =====
  const [saIsTrial, setSaIsTrial] = useState<boolean>(true);
  const [selSA, setSelSA] = useState<
    "" | "continue" | "consider-growth" | "not-interested"
  >("");
  const [keepSA, setKeepSA] = useState<boolean>(true); // default checked


  const saEnabled = ["continue", "consider-growth", "not-interested"].includes(
    selSA
  );
  const saCta = selSA === "continue" ? "Finish" : "Next";

  const ScaleAdsFlow = () => (
    <>
      <Pills items={["ScaleAds Self Service", "FBA Reimbursement"]} />

      <Box title={saIsTrial ? "Exclusive Reminder" : "Exclusive Offer"}>
        {saIsTrial ? (
          <p className="text-sm text-slate-200 mb-3">
            You are currently on a free trial of ScaleAds Self Service until{" "}
            <b>{getTrialEndDate()}</b>. There are no charges during this period.
          </p>
        ) : null}

        <RadioGroup
          value={selSA}
          onValueChange={(v) => {
            setSelSA(v as typeof selSA);
            setKeepSA(true);

          }}
        >
          {/* 1) Continue trial (only for trial version) → 9% */}
          {saIsTrial && (
            <div className="flex items-start gap-3 mb-3">
              <RadioGroupItem
                className={radioItemCls}
                value="continue"
                id="sa1"
              />
              <div>
                                  <Label htmlFor="sa1" className="cursor-pointer text-slate-100">
                    Keep Using Free
                  </Label>
              </div>
            </div>
          )}

          {/* 2) Consider Growth Plan → 9% */}
          <div className="flex items-start gap-3 mb-3">
            <RadioGroupItem
              className={radioItemCls}
              value="consider-growth"
              id="sa2"
            />
            <div>
              <Label htmlFor="sa2" className="cursor-pointer text-slate-100">
                Consider the <b>Growth Plan</b> for $49/month
              </Label>
              <p className="text-xs text-slate-400">
                Experience the robust features of the Growth Plan prior to
                considering cancellation.
              </p>

              {selSA === "consider-growth" && (
                <label className="mt-2 flex items-center gap-2 tex t-slate-200">
                  <Checkbox
                    className={checkItemCls}
                    checked={keepSA}
                    onCheckedChange={(v) => setKeepSA(!!v)}
                  />
                  <span>
                    Keep reimbursement with <b>9% commission rate</b>
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* 3) Not interested → Always show Growth downgrade + reimbursement (9% if consider growth checked, else 15%) */}
          <div className="flex items-start gap-3 mb-1">
            <RadioGroupItem
              className={radioItemCls}
              value="not-interested"
              id="sa3"
            />
            <div className="w-full">
              <Label htmlFor="sa3" className="cursor-pointer text-slate-100">
                Not interested
              </Label>

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
      <Footer enabled={saEnabled} ctaText={saCta} />
    </>
  );

  // ===== 3) ScaleAds + Dedicated (Trial / Without Trial) =====
  const [dedIsTrial, setDedIsTrial] = useState<boolean>(true);
  const [selDedicated, setSelDedicated] = useState<
    "" | "continue" | "scaleads-without-dedicated" | "not-interested"
  >("");

  // Sub-options under Dedicated
  const [dedKeepContinue, setDedKeepContinue] = useState<boolean>(true); // for Continue (trial)
  const [dedKeepScaleAdsOnly, setDedKeepScaleAdsOnly] =
    useState<boolean>(true); // for ScaleAds w/o Dedicated
  const [niConsiderGrowth, setNiConsiderGrowth] = useState<boolean>(false); // under Not interested
  const [niKeepReimb, setNiKeepReimb] = useState<boolean>(true); // under Not interested (default checked)

  const dedEnabled = [
    "continue",
    "scaleads-without-dedicated",
    "not-interested",
  ].includes(selDedicated);
  const dedCta = selDedicated === "continue" ? "Finish" : "Next";
  const notInterestedRate = niConsiderGrowth ? 9 : 15;

  const DedicatedFlow = () => (
    <>
      <Pills
        items={[
          "ScaleAds Self Service",
          "Dedicated Specialist",
          "FBA Reimbursement",
        ]}
      />

      <Box title={dedIsTrial ? "Exclusive Reminder" : "Manage Your Subscription"}>
        {dedIsTrial ? (
          <p className="text-sm text-slate-200 mb-3">
            You are currently on a free trial of{" "}
            <b>ScaleAds with Dedicated Specialist</b> until <b>{getTrialEndDate()}</b>.
            There are no charges during this period.
          </p>
        ) : null}

        <RadioGroup
          value={selDedicated}
          onValueChange={(v) => {
            setSelDedicated(v as typeof selDedicated);
            if (v === "continue") setDedKeepContinue(true);
            if (v === "scaleads-without-dedicated") setDedKeepScaleAdsOnly(true);
            if (v === "not-interested") {
              setNiConsiderGrowth(false);
              setNiKeepReimb(true);
            }
          }}
        >
          {/* Continue trial (only for trial version) → 9% */}
          {dedIsTrial && (
            <div className="flex items-start gap-3 mb-3">
              <RadioGroupItem
                className={radioItemCls}
                value="continue"
                id="sd0"
              />
              <div>
                                  <Label htmlFor="sd0" className="cursor-pointer text-slate-100">
                    Keep Using Free
                  </Label>
              </div>
            </div>
          )}

          {/* Consider ScaleAds without Dedicated → 9% */}
          <div className="flex items-start gap-3 mb-3">
            <RadioGroupItem
              className={radioItemCls}
              value="scaleads-without-dedicated"
              id="sd1"
            />
            <div className="w-full">
              <Label htmlFor="sd1" className="cursor-pointer text-slate-100">
                Consider the <b>ScaleAds without Dedicated Specialist</b>
              </Label>
              <p className="text-xs text-slate-400">
                Keep ScaleAds automation active while removing the Dedicated
                Specialist add-on.
              </p>

              {selDedicated === "scaleads-without-dedicated" && (
                <label className="mt-2 flex items-center gap-2 text-slate-200">
                  <Checkbox
                    className={checkItemCls}
                    checked={dedKeepScaleAdsOnly}
                    onCheckedChange={(v) => setDedKeepScaleAdsOnly(!!v)}
                  />
                  <span>
                    Keep reimbursement with <b>9% commission rate</b>
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Not interested → Always show Growth downgrade + reimbursement (9% if Consider Growth, else 15%) */}
          <div className="flex items-start gap-3 mb-1">
            <RadioGroupItem
              className={radioItemCls}
              value="not-interested"
              id="sd2"
            />
            <div className="w-full">
              <Label htmlFor="sd2" className="cursor-pointer text-slate-100">
                Not interested
              </Label>

              {selDedicated === "not-interested" && (
                <div className="mt-3 ml-1 pl-7 border-l border-slate-700">
                  <label className="flex items-center gap-2 text-slate-200 mb-2">
                    <Checkbox
                      className={checkItemCls}
                      checked={niConsiderGrowth}
                      onCheckedChange={(v) => setNiConsiderGrowth(!!v)}
                    />
                    <span>
                      Consider the <b>Growth Plan</b> for <b>$49/month</b>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-200">
                    <Checkbox
                      className={checkItemCls}
                      checked={niKeepReimb}
                      onCheckedChange={(v) => setNiKeepReimb(!!v)}
                    />
                    <span>
                      Keep reimbursement with{" "}
                      <b>{notInterestedRate}% commission rate</b>
                    </span>
                  </label>

                </div>
              )}
            </div>
          </div>
        </RadioGroup>
      </Box>
      <Footer enabled={dedEnabled} ctaText={dedCta} />
    </>
  );

  // ===== Header (OUTSIDE of Panel) =====
  const Header = () => (
    <header className="w-full max-w-2xl mx-auto mb-4">
      {/* Scenario selector */}
      <div className="flex gap-2 justify-center">
        <Button
          className={btnCls}
          variant={scenario === "growth" ? "default" : "secondary"}
          onClick={() => setScenario("growth")}
        >
          Growth
        </Button>
        <Button
          className={btnCls}
          variant={scenario === "scaleads" ? "default" : "secondary"}
          onClick={() => setScenario("scaleads")}
        >
          ScaleAds
        </Button>
        <Button
          className={btnCls}
          variant={scenario === "scaleads+dedicated" ? "default" : "secondary"}
          onClick={() => setScenario("scaleads+dedicated")}
        >
          ScaleAds + Dedicated
        </Button>
      </div>

      {/* Trial / Without Trial toggles (shown only for relevant scenarios) */}
      {scenario === "scaleads" && (
        <div className="flex gap-2 justify-center mt-3">
          <Button
            className={btnCls}
            variant={saIsTrial ? "default" : "secondary"}
            onClick={() => {
              setSaIsTrial(true);
              setSelSA("");
              setKeepSA(true);
              setNiConsiderGrowthSA(false);
            }}
          >
            Trial
          </Button>
          <Button
            className={btnCls}
            variant={!saIsTrial ? "default" : "secondary"}
            onClick={() => {
              setSaIsTrial(false);
              setSelSA("");
              setKeepSA(true);
              setNiConsiderGrowthSA(false);
            }}
          >
            Without Trial
          </Button>
        </div>
      )}

      {scenario === "scaleads+dedicated" && (
        <div className="flex gap-2 justify-center mt-3">
          <Button
            className={btnCls}
            variant={dedIsTrial ? "default" : "secondary"}
            onClick={() => {
              setDedIsTrial(true);
              setSelDedicated("");
              setDedKeepContinue(true);
              setDedKeepScaleAdsOnly(true);
              setNiConsiderGrowth(false);
              setNiKeepReimb(true);
            }}
          >
            Trial
          </Button>
          <Button
            className={btnCls}
            variant={!dedIsTrial ? "default" : "secondary"}
            onClick={() => {
              setDedIsTrial(false);
              setSelDedicated("");
              setDedKeepScaleAdsOnly(true);
              setNiConsiderGrowth(false);
              setNiKeepReimb(true);
            }}
          >
            Without Trial
          </Button>
        </div>
      )}
    </header>
  );

  // ===== Render =====
  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <Header />

      <Panel>
        <h2 className="text-center text-xl font-semibold mb-6">Your Current Plan(s)</h2>

        {scenario === "growth" && <GrowthFlow />}
        {scenario === "scaleads" && <ScaleAdsFlow />}
        {scenario === "scaleads+dedicated" && <DedicatedFlow />}
      </Panel>
    </main>
  );
}
