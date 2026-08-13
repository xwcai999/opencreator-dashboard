export type RunStatus = "success" | "failed" | "running" | "interrupted";

export type PipelineNodeStatus = "success" | "failed" | "pending" | "running" | "skipped";

/** Provider-neutral identifiers shared with the publishers workspace. */
export type PlatformId = "fanqie" | "qishui" | "netease" | "tencent";

export type PublishStage =
  | "discovered"
  | "eligible"
  | "claimed"
  | "preparing"
  | "awaiting_confirmation"
  | "submitted"
  | "verified"
  | "archived"
  | "blocked"
  | "failed"
  | "cancelled";

export interface SongRecord {
  runId: string;
  title: string;
  language: string;
  style: string;
  theme: string;
  agentRole: string;
  status: RunStatus;
  createdAt: string;
  hasAudio: boolean;
  hasCover: boolean;
  qualityScore: number;
}

export interface DailyPoint {
  date: string;
  success: number;
  failed: number;
  interrupted: number;
}

export interface PipelineNode {
  id: string;
  label: string;
  status: PipelineNodeStatus;
  detail?: string;
}

export interface PipelineGraph {
  runId: string;
  title: string;
  status: RunStatus;
  updatedAt: string;
  nodes: PipelineNode[];
}

export interface PlatformPublishSnapshot {
  platform: PlatformId;
  displayName: string;
  stage: PublishStage;
  candidateCount: number;
  claimedCount: number;
  preparedCount: number;
  blockerCodes: string[];
  manualActionRequired: boolean;
  updatedAt: string;
}

export interface PublishingSnapshot {
  contractVersion: "1.0.0";
  platforms: PlatformPublishSnapshot[];
  totals: {
    candidates: number;
    claimed: number;
    prepared: number;
    blocked: number;
  };
}

export interface DashboardSnapshot {
  generatedAt: string;
  totals: {
    runs: number;
    success: number;
    failed: number;
    running: number;
    successRate: number;
    audioReadyRate: number;
    coverReadyRate: number;
  };
  daily: DailyPoint[];
  songs: SongRecord[];
  activePipeline: PipelineGraph;
  publishing: PublishingSnapshot;
}

/**
 * The dashboard only consumes this read-only contract. A future adapter may
 * implement it without changing the presentation layer.
 */
export interface DashboardDataSource {
  getSnapshot(): Promise<DashboardSnapshot>;
}
