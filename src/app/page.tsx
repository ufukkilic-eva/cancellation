"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

type Scenario = "growth" | "scaleads-trial" | "scaleads+dedicated";

export default function App() {
  const [scenario, setScenario] = useState<Scenario>("scaleads+dedicated");

  // Growth selections
  const [selGrowth, setSelGrowth] =
    useState<"" | "switch-to-scaleads" | "not-interested">("");
  const [keepGrowth, setKeepGrowth] = useState(false);

  // Trial selections
  const [selTrial, setSelTrial] =
    useState<"" | "continue-trial" | "switch-to-growth" | "cancel">("");
  const [keepTrial, setKeepTrial] = useState(false);

  // Dedicated selections (requested special logic)
  const [selDedicated, setSelDedicated] =
    useState<"" | "scaleads-without-dedicated" | "not-interested">("");
  const [dedicatedKeepScaleAdsOnly, setDedicatedKeepScaleAdsOnly] =
    useState(false); // for "Consider ScaleAds without Dedicated"
  const [niConsiderGrowth, setNiConsiderGrowth] = useState(false); // sub-option under Not interested
  const [niKeepReimb, setNiKeepReimb] = useState(false); // reimbursement under Not interested

  const nextEnabled =
    (scenario === "growth" &&
      (selGrowth === "switch-to-scaleads" || selGrowth === "not-interested")) ||
    (scenario === "scaleads-trial" &&
      ["continue-trial", "switch-to-growth", "cancel"].includes(selTrial)) ||
    (scenario === "scaleads+dedicated" &&
      (selDedicated === "scaleads-without-dedicated" ||
        selDedicated === "not-interested"));

  // Styled pieces
  const radioItemCls =
    "border-slate-400 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-600";
  const checkItemCls =
    "border-slate-400 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-600";

  const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-full max-w-lg mx-auto rounded-lg bg-slate-900/90 border border-slate-700 p-6 text-slate-100 shadow">
      {children}
    </div>
  );

  const Pills: React.FC<{ items: string[] }> = ({ items }) => (
    <div className="flex flex-col gap-2 items-center">
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

  const Footer: React.FC = () => (
    <div className="flex items-center justify-between mt-6 text-xs text-slate-400">
      <span>
        If you have a problem, before cancellation{" "}
        <a href="#" className="underline">
          let us contact you
        </a>
        .
      </span>
      <Button
        className="bg-blue-600 hover:bg-blue-500 text-white px-6"
        disabled={!nextEnabled}
      >
        Next
      </Button>
    </div>
  );

  // === Flows ===
  const GrowthFlow = () => (
    <>
      <Pills items={["Growth", "FBA Reimbursement"]} />
      <Box title="Exclusive Offer">
        <RadioGroup
          value={selGrowth}
          onValueChange={(v) => {
            setSelGrowth(v as typeof selGrowth);
            setKeepGrowth(false);
          }}
        >
          {/* Switch to ScaleAds (first month free) → below checkbox 9% */}
          <div className="flex items-start gap-3 mb-3">
            <RadioGroupItem
              className={radioItemCls}
              value="switch-to-scaleads"
              id="gr1"
            />
            <div>
              <Label htmlFor="gr1" className="cursor-pointer text-slate-100">
                Consider the ScaleAds Self Service Plan— <b>first month free</b>
              </Label>
              <p className="text-xs text-slate-400">
                Experience AI-powered PPC automation with no charges for the
                first month.
              </p>

              {selGrowth === "switch-to-scaleads" && (
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

          {/* Not interested → below checkbox 15% */}
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
      <Footer />
    </>
  );

  const TrialFlow = () => (
    <>
      <Pills items={["ScaleAds Self Service", "FBA Reimbursement"]} />
      <Box title="Exclusive Reminder">
        <p className="text-sm text-slate-200">
          You are currently on a free trial of ScaleAds Self Service until{" "}
          <b>09-28-2025</b>. There are no charges during this period.
        </p>

        <div className="mt-4">
          <RadioGroup
            value={selTrial}
            onValueChange={(v) => {
              setSelTrial(v as typeof selTrial);
              setKeepTrial(false);
            }}
          >
            {/* Continue trial → 9% */}
            <div className="flex items-start gap-3 mb-3">
              <RadioGroupItem
                className={radioItemCls}
                value="continue-trial"
                id="tr1"
              />
              <div>
                <Label htmlFor="tr1" className="cursor-pointer text-slate-100">
                  Continue trial
                </Label>

                {selTrial === "continue-trial" && (
                  <label className="mt-2 flex items-center gap-2 text-slate-200">
                    <Checkbox
                      className={checkItemCls}
                      checked={keepTrial}
                      onCheckedChange={(v) => setKeepTrial(!!v)}
                    />
                    <span>
                      Keep reimbursement with <b>9% commission rate</b>
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Switch to Growth → 9% */}
            <div className="flex items-start gap-3 mb-3">
              <RadioGroupItem
                className={radioItemCls}
                value="switch-to-growth"
                id="tr2"
              />
              <div>
                <Label htmlFor="tr2" className="cursor-pointer text-slate-100">
                  Consider Growth plan for <b>$49/month</b>
                </Label>
                <p className="text-xs text-slate-400">
                  Experience the robust features of the Growth Plan prior to considering cancellation.
                </p>

                {selTrial === "switch-to-growth" && (
                  <label className="mt-2 flex items-center gap-2 text-slate-200">
                    <Checkbox
                      className={checkItemCls}
                      checked={keepTrial}
                      onCheckedChange={(v) => setKeepTrial(!!v)}
                    />
                    <span>
                      Keep reimbursement with <b>9% commission rate</b>
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Cancel → 15% */}
            <div className="flex items-start gap-3 mb-1">
              <RadioGroupItem
                className={radioItemCls}
                value="cancel"
                id="tr3"
              />
              <div>
                <Label htmlFor="tr3" className="cursor-pointer text-slate-100">
                  Cancel subscription
                </Label>

                {selTrial === "cancel" && (
                  <label className="mt-2 flex items-center gap-2 text-slate-200">
                    <Checkbox
                      className={checkItemCls}
                      checked={keepTrial}
                      onCheckedChange={(v) => setKeepTrial(!!v)}
                    />
                    <span>
                      Keep reimbursement with <b>15% commission rate</b>
                    </span>
                  </label>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>
      </Box>
      <Footer />
    </>
  );

  // REQUESTED: ScaleAds + Dedicated special rules
  const DedicatedFlow = () => {
    const notInterestedRate = niConsiderGrowth ? 9 : 15;

    return (
      <>
        <Pills
          items={[
            "ScaleAds Self Service",
            "Dedicated Specialist",
            "FBA Reimbursement",
          ]}
        />
        <Box title="Manage Your Subscription">
          <RadioGroup
            value={selDedicated}
            onValueChange={(v) => {
              setSelDedicated(v as typeof selDedicated);
              // reset sub-options when switching
              setDedicatedKeepScaleAdsOnly(false);
              setNiConsiderGrowth(false);
              setNiKeepReimb(false);
            }}
          >
            {/* 1) Consider ScaleAds without Dedicated → 9% under it */}
            <div className="flex items-start gap-3 mb-3">
              <RadioGroupItem
                className={radioItemCls}
                value="scaleads-without-dedicated"
                id="sd1"
              />
              <div className="w-full">
                <Label htmlFor="sd1" className="cursor-pointer text-slate-100">
                  Consider ScaleAds without Dedicated
                </Label>

                {selDedicated === "scaleads-without-dedicated" && (
                  <label className="mt-2 flex items-center gap-2 text-slate-200">
                    <Checkbox
                      className={checkItemCls}
                      checked={dedicatedKeepScaleAdsOnly}
                      onCheckedChange={(v) =>
                        setDedicatedKeepScaleAdsOnly(!!v)
                      }
                    />
                    <span>
                      Keep reimbursement with <b>9% commission rate</b>
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* 2) Not interested → show Consider Growth + Keep reimbursement under it;
                  rate = 9% if Consider Growth is checked, else 15% */}
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
                      <span>Consider Growth</span>
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
                    <p className="text-xs text-slate-400 mt-1">
                      (9% if you also choose Consider Growth, otherwise 15%)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        </Box>
        <Footer />
      </>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Panel>
        {/* Demo: scenario selector */}
        <div className="flex gap-2 justify-center mb-4 text-xs">
          <Button
            variant={scenario === "growth" ? "default" : "secondary"}
            onClick={() => setScenario("growth")}
          >
            Growth cancel
          </Button>
          <Button
            variant={scenario === "scaleads-trial" ? "default" : "secondary"}
            onClick={() => setScenario("scaleads-trial")}
          >
            ScaleAds (trial) cancel
          </Button>
          <Button
            variant={
              scenario === "scaleads+dedicated" ? "default" : "secondary"
            }
            onClick={() => setScenario("scaleads+dedicated")}
          >
            ScaleAds + Dedicated
          </Button>
        </div>

        <h2 className="text-center text-xl font-semibold mb-6">See Your Plan</h2>

        {scenario === "growth" && <GrowthFlow />}
        {scenario === "scaleads-trial" && <TrialFlow />}
        {scenario === "scaleads+dedicated" && <DedicatedFlow />}
      </Panel>
    </main>
  );
}
