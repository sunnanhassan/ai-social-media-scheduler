"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Copy, Check, Plus, Trash2, ExternalLink, Bot, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string | null;
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const schemaUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/v1/openapi.json`
    : "http://localhost:3000/api/v1/openapi.json";

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/user/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to generate key");
      const data = await res.json();
      setCreatedRawKey(data.rawKey);
      setNewKeyName("");
      fetchKeys();
      toast.success("API Key generated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const res = await fetch(`/api/user/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke key");
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API key revoked");
    } catch {
      toast.error("Could not revoke key");
    }
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(identifier);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* ChatGPT & OpenAPI Integration Card */}
      <Card className="border-border/80 bg-card shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                <Bot className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">ChatGPT Action & OpenAPI 3.0</CardTitle>
                <CardDescription className="text-xs">
                  Connect OmniPost to ChatGPT to schedule posts and check calendar directly in chat
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs font-mono"
              onClick={() => {
                navigator.clipboard.writeText(schemaUrl);
                setCopiedSchema(true);
                toast.success("OpenAPI Schema URL copied!");
                setTimeout(() => setCopiedSchema(false), 2000);
              }}
            >
              {copiedSchema ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              {copiedSchema ? "Schema Copied" : "Copy OpenAPI URL"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-1">
          <div className="p-3 rounded-lg bg-muted/20 border border-border/60 text-xs space-y-2">
            <p className="font-semibold text-foreground">How to Connect to ChatGPT in 3 Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open <strong>ChatGPT</strong> &rarr; Click <strong>Explore GPTs</strong> &rarr; Click <strong>Create</strong>.</li>
              <li>In the <strong>Configure</strong> tab, click <strong>Create new action</strong> &rarr; Click <strong>Import from URL</strong> &rarr; Paste your OpenAPI Schema URL.</li>
              <li>Set Authentication to <strong>API Key</strong>, select <strong>Bearer</strong>, and paste your OmniPost API key below.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card className="border-border/80 bg-card shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">API Keys</CardTitle>
              <CardDescription className="text-xs">
                Active bearer credentials used by external AI agents and ChatGPT Actions
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-3.5" />
              Generate New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-6"><Spinner /></div>
          ) : keys.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
              No API keys generated yet. Click "Generate New Key" to create your first ChatGPT Action key.
            </div>
          ) : (
            <div className="border border-border/60 rounded-md overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-mono uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Key Prefix</th>
                    <th className="p-2.5">Created</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-2.5 font-medium text-foreground">{k.name}</td>
                      <td className="p-2.5 font-mono text-muted-foreground">{k.key_prefix}...</td>
                      <td className="p-2.5 text-muted-foreground">{new Date(k.created_at).toLocaleDateString()}</td>
                      <td className="p-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevokeKey(k.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Key Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              Create API Key
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate a secure bearer token for ChatGPT Actions or external automation scripts.
            </DialogDescription>
          </DialogHeader>

          {createdRawKey ? (
            <div className="space-y-3 py-2">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-emerald-500">Copy your API key now!</p>
                <p className="text-muted-foreground">For security, this key will not be displayed again.</p>
              </div>
              <div className="flex items-center gap-2">
                <Input readOnly value={createdRawKey} className="font-mono text-xs bg-muted/40 h-9" />
                <Button
                  size="sm"
                  className="gap-1 h-9"
                  onClick={() => copyToClipboard(createdRawKey, "created_key")}
                >
                  {copiedKey === "created_key" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copiedKey === "created_key" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Key Name</label>
                <Input
                  placeholder="e.g. ChatGPT Mobile Action"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {createdRawKey ? (
              <Button onClick={() => { setIsCreateOpen(false); setCreatedRawKey(null); }}>
                Done
              </Button>
            ) : (
              <Button onClick={handleCreateKey} disabled={creating} className="text-xs">
                {creating ? <Spinner className="size-3 mr-1" /> : null}
                Generate Key
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

