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

export type WawaMetricsDays = "all" | 1 | 3 | 7 | 30 | 90;

export interface WawaBookMetrics {
  bookKey: string;
  title: string;
  status?: string;
  shelfStatus?: string;
  channel?: string;
  categories?: string[];
  isFinished?: boolean | null;
  latest: {
    chapterCount: number | null;
    wordCount: number | null;
    revenue: number | null;
    dailyRevenue: number | null;
    followers: number | null;
    followDelta: number | null;
  };
  updatedAt?: string;
}

export interface WawaBookTrendPoint {
  date: string;
  bookKey: string;
  chapterCount?: number | null;
  wordCount?: number | null;
  revenue?: number | null;
  dailyRevenue?: number | null;
  followers?: number | null;
  followDelta?: number | null;
}

export interface WawaMetricsView {
  available: boolean;
  stale: boolean;
  range: { days: WawaMetricsDays; from?: string; to?: string };
  summary: WawaStatsTotals & { mode: "cumulative" | "period" };
  books: WawaBookMetrics[];
  series: WawaBookTrendPoint[];
  availableMetrics: WawaStatsMetricKey[];
  updatedAt?: string;
  message?: string;
}

export interface WawaSubmissionPackageView {
  bookKey: string;
  createdAt: string;
  title: string;
  penName: string;
  summary: string;
  channel: string;
  status: string;
  categories: string[];
  tags: string[];
  manuscript: { fileName: string; sizeBytes: number; wordCount?: number };
  cover: { fileName: string; sizeBytes: number };
  preflight: { ok: boolean; errors: string[]; blockers: string[]; warnings: string[]; wordCount: number };
  canPrepare: boolean;
  submitted: boolean;
  submittedAt?: string;
}

export interface WawaSubmissionRunView {
  runId: string;
  action: "dry-run" | "prepare" | "login" | "cancel";
  status: string;
  createdAt: string;
  updatedAt: string;
  bookKeys: string[];
  title: string;
  message: string;
  blockers: string[];
  warnings: string[];
  canCancel: boolean;
}

export interface WawaSubmissionView {
  items: WawaSubmissionPackageView[];
  runs: WawaSubmissionRunView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  campaignCode?: string;
  campaignName?: string;
  loginStatus?: "ready" | "login_required" | "unknown";
}

export type WawaSubmissionAction = "dry-run" | "prepare" | "login" | "cancel" | "confirm" | "unconfirm";

export interface WawaSubmissionActionRequest {
  action: WawaSubmissionAction;
  bookKey?: string;
  runId?: string;
  campaignCode?: string;
}

export interface WawaActionResult {
  status?: string;
  message: string;
  runId?: string;
}

export interface DashboardCapabilities {
  mode: "mock" | "http";
  wawaMetricsSync: boolean;
  wawaSubmissionActions: boolean;
}

/**
 * The dashboard only consumes this read-only contract. A future adapter may
 * implement it without changing the presentation layer.
 */
export interface DashboardDataSource {
  capabilities?: DashboardCapabilities;
  getSnapshot(): Promise<DashboardSnapshot>;
  getWawaMetrics?(days: WawaMetricsDays): Promise<WawaMetricsView>;
  syncWawaMetrics?(): Promise<WawaActionResult>;
  getWawaSubmission?(page: number, pageSize: number): Promise<WawaSubmissionView>;
  runWawaSubmissionAction?(request: WawaSubmissionActionRequest): Promise<WawaActionResult>;
}
