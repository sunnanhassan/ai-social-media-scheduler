"use client";

import React from "react";
import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const INVOICE_HISTORY = [
  { id: "INV-2026-003", date: "Sep 26, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-002", date: "Aug 26, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-001", date: "Jul 26, 2026", amount: "$49.00", status: "Paid" },
];

export function BillingInvoices() {
  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading invoice receipt for ${invoiceId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Payment Card */}
      <div className="p-4 rounded-lg border border-border/80 bg-card shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground tracking-tight">Payment Method</h4>
        </div>
        <div className="p-3 rounded-md bg-muted/30 border border-border/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-foreground font-medium">Mastercard •••• 4242</span>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">Default</Badge>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground mt-1">Expires 08/2028</p>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-xs font-mono">
          Update Payment Card
        </Button>
      </div>

      {/* Invoice Table */}
      <div className="md:col-span-2 p-4 rounded-lg border border-border/80 bg-card shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-foreground tracking-tight">Invoice History</h4>
          <span className="text-[11px] font-mono text-muted-foreground">3 invoices recorded</span>
        </div>
        <div className="divide-y divide-border/60 text-xs">
          {INVOICE_HISTORY.map((invoice) => (
            <div key={invoice.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-foreground font-medium">{invoice.id}</span>
                <span className="text-muted-foreground font-mono text-[11px]">{invoice.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-medium text-foreground">{invoice.amount}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                  {invoice.status}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => handleDownloadInvoice(invoice.id)}
                  title="Download Receipt"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
