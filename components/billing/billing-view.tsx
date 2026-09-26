"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BillingQuotas } from "./billing-quotas";
import { BillingInvoices } from "./billing-invoices";

interface BillingTier {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  desc: string;
  features: string[];
  isCurrent?: boolean;
}

const TIERS: BillingTier[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 19,
    priceAnnual: 15,
    desc: "For individual creators starting their automated consistency pipeline.",
    features: [
      "3 Connected Channels",
      "5,000 AI Token Credits / mo",
      "30 Scheduled Posts Queue",
      "Standard Publishing Engine",
      "Community Discord Support",
    ],
    isCurrent: false,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 49,
    priceAnnual: 39,
    desc: "For high-output creators and growing brands scaling across all platforms.",
    features: [
      "All 8 Social Platforms",
      "25,000 AI Token Credits / mo",
      "Unlimited Scheduled Posts",
      "Priority Inngest Publishing Queue",
      "AI Ideas & Thread Repurposer",
      "Realtime Analytics & Performance",
    ],
    isCurrent: true,
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthly: 99,
    priceAnnual: 79,
    desc: "For agencies and multi-client teams requiring workspace isolation.",
    features: [
      "Unlimited Channels & Workspaces",
      "100,000 AI Token Credits / mo",
      "Team Member Seats (Up to 10)",
      "Multi-Account Client Dashboards",
      "Dedicated High-Speed Webhook Queue",
      "24/7 SLA Priority Support",
    ],
    isCurrent: false,
  },
];

export function BillingView() {
  const [annualBilling, setAnnualBilling] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full py-2">
      {/* Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Workspace
            </span>
            <span className="text-muted-foreground/40 font-mono text-xs">/</span>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Billing & Quotas
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-primary/25" />
              Pro Plan Active
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Auto-renews on Oct 26, 2026
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setAnnualBilling(false)}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
              !annualBilling
                ? "bg-background text-foreground shadow-2xs font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnualBilling(true)}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
              annualBilling
                ? "bg-background text-foreground shadow-2xs font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Annual</span>
            <span className="px-1 py-0.2 rounded text-[10px] bg-primary/10 text-primary font-semibold">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Quotas & Usage Data-Dense Grid */}
      <BillingQuotas />

      {/* Tier Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => {
          const price = annualBilling ? tier.priceAnnual : tier.priceMonthly;
          return (
            <Card
              key={tier.id}
              className={`flex flex-col rounded-lg transition-all border ${
                tier.isCurrent
                  ? "border-primary/80 ring-1 ring-primary/40 bg-card shadow-xs"
                  : "border-border/80 bg-card hover:border-border"
              }`}
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-sm tracking-tight text-foreground">{tier.name}</h3>
                  {tier.isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                    ${price}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">/mo</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-normal mt-1 min-h-[36px]">
                  {tier.desc}
                </p>
              </CardHeader>

              <CardContent className="p-5 pt-2 flex-1 space-y-2 text-xs">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-foreground/90">
                    <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-[12px] leading-snug">{feature}</span>
                  </div>
                ))}
              </CardContent>

              <CardFooter className="p-5 pt-3 border-t border-border/50">
                <Button
                  className="w-full text-xs h-8 font-medium cursor-pointer"
                  variant={tier.isCurrent ? "default" : "outline"}
                >
                  {tier.isCurrent ? "Manage Plan" : `Upgrade to ${tier.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Payment Method & Invoicing History */}
      <BillingInvoices />
    </div>
  );
}
