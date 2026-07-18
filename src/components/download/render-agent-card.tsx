"use client";

import { useEffect, useRef, useState } from "react";
import { Cpu, Loader2, Mic, Download, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { RenderStatus } from "@/types/scene";

type AgentSummary = {
  id: string;
  name: string;
  gpuType: string;
  online: boolean;
};

type ProjectRenderState = {
  hasVoiceover: boolean;
  renderStatus: RenderStatus;
  renderError: string | null;
  hasFinalVideo: boolean;
  assignedAgentId: string | null;
};

const STATUS_LABEL: Record<RenderStatus, string> = {
  none: "ভয়েসওভার আপলোড বাকি",
  pending: "এজেন্টের জন্য অপেক্ষা করছে",
  claimed: "রেন্ডার হচ্ছে",
  done: "রেন্ডার সম্পন্ন",
  failed: "রেন্ডার ব্যর্থ হয়েছে",
};

const POLL_MS = 5000;

async function loadRenderState(projectId: string): Promise<{
  project: ProjectRenderState | null;
  agents: AgentSummary[];
}> {
  const [projectRes, agentsRes] = await Promise.all([
    fetch(`/api/projects/${projectId}`),
    fetch("/api/agents"),
  ]);

  const project = projectRes.ok
    ? await projectRes.json().then((data) => ({
        hasVoiceover: data.project.hasVoiceover,
        renderStatus: data.project.renderStatus,
        renderError: data.project.renderError,
        hasFinalVideo: data.project.hasFinalVideo,
        assignedAgentId: data.project.assignedAgentId,
      }))
    : null;
  const agents = agentsRes.ok ? await agentsRes.json().then((data) => data.agents as AgentSummary[]) : [];

  return { project, agents };
}

export function RenderAgentCard({ projectId }: { projectId: string | null }) {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [state, setState] = useState<ProjectRenderState | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderStatus = state?.renderStatus ?? "none";

  useEffect(() => {
    if (!projectId) return;

    loadRenderState(projectId).then(({ project, agents: agentList }) => {
      setState(project);
      setAgents(agentList);
    });

    if (renderStatus !== "pending" && renderStatus !== "claimed") return;
    const interval = setInterval(() => {
      loadRenderState(projectId).then(({ project, agents: agentList }) => {
        setState(project);
        setAgents(agentList);
      });
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [projectId, renderStatus]);

  if (!projectId) {
    return null;
  }

  async function handleUpload(file: File) {
    if (!projectId) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("voiceover", file);
      await fetch(`/api/projects/${projectId}/voiceover`, { method: "POST", body: formData });
      const { project, agents: agentList } = await loadRenderState(projectId);
      setState(project);
      setAgents(agentList);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAgentPick(agentId: string) {
    if (!projectId) return;
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedAgentId: agentId || null }),
    });
    const { project, agents: agentList } = await loadRenderState(projectId);
    setState(project);
    setAgents(agentList);
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm leading-5 font-medium">ফাইনাল রেন্ডার (render agent)</p>
          <Badge
            variant="outline"
            className={
              renderStatus === "done"
                ? "border-success/30 bg-success/10 text-success"
                : renderStatus === "failed"
                  ? "border-error/30 bg-error/10 text-error"
                  : undefined
            }
          >
            {STATUS_LABEL[renderStatus]}
          </Badge>
        </div>

        {renderStatus === "failed" && state?.renderError ? (
          <div className="flex items-start gap-2 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm leading-5 text-error">
            <CircleAlert className="size-4 shrink-0" strokeWidth={1.75} />
            <span>{state.renderError}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Mic className="size-4" strokeWidth={1.75} />
            )}
            {state?.hasVoiceover ? "ভয়েসওভার বদলান" : "ভয়েসওভার আপলোড করুন"}
          </Button>

          {renderStatus === "done" ? (
            <Button size="sm" variant="outline" asChild>
              <a href={`/api/projects/${projectId}/video`}>
                <Download className="size-3.5" strokeWidth={1.75} />
                ফাইনাল ভিডিও ডাউনলোড
              </a>
            </Button>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs leading-4 text-muted-foreground">
            <Cpu className="size-3.5" strokeWidth={1.75} />
            Render agent (ঐচ্ছিক — নির্দিষ্ট একটা মেশিন বেছে না নিলে যেকোনো অনলাইন এজেন্ট কাজটা নেবে)
          </p>
          <select
            className="h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            value={state?.assignedAgentId ?? ""}
            onChange={(e) => handleAgentPick(e.target.value)}
          >
            <option value="">যেকোনো অনলাইন এজেন্ট</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id} disabled={!agent.online}>
                {agent.name} ({agent.gpuType.toUpperCase()}) — {agent.online ? "অনলাইন" : "অফলাইন"}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
