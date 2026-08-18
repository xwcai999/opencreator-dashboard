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

/**
 * Sanitized, provider-specific aggregate status for the Wawa metrics view.
 *
 * The contract deliberately contains no work names, remote identifiers,
 * tenant/account identifiers, filesystem paths, credentials, or controls.
 * It is safe to pass between a local snapshot adapter and this read-only UI.
 */
export type WawaStatsStatus = "success" | "partial" | "stale" | "unavailable";

export type WawaStatsMetricKey =
  | "bookCount"
  | "chapterCount"
  | "wordCount"
  | "revenue"
  | "dailyRevenue"
  | "followers"
  | "followDelta";

export interface WawaStatsTotals {
  bookCount: number | null;
  chapterCount: number | null;
  wordCount: number | null;
  revenue: number | null;
  dailyRevenue: number | null;
  followers: number | null;
  followDelta: number | null;
}

export interface WawaStatsTrendPoint {
  date: string;
  bookCount?: number | null;
  chapterCount?: number | null;
  wordCount?: number | null;
  revenue?: number | null;
  dailyRevenue?: number | null;
  followers?: number | null;
  followDelta?: number | null;
}

export interface WawaStatsSnapshot {
  contractVersion: "1.0.0";
  status: WawaStatsStatus;
  generatedAt: string;
  range: {
    days: 7 | 30 | 90;
    from?: string;
    to?: string;
  };
  totals: WawaStatsTotals;
  trend: WawaStatsTrendPoint[];
  availableMetrics: WawaStatsMetricKey[];
  message?: string;
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
  /** Optional: old music-only snapshots remain valid without Wawa metrics. */
  wawaStats?: WawaStatsSnapshot;
}

/**
 * The dashboard only consumes this read-only contract. A future adapter may
 * implement it without changing the presentation layer.
 */
export interface DashboardDataSource {
  getSnapshot(): Promise<DashboardSnapshot>;
}
