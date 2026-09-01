import type {
  DashboardDataSource,
  DashboardSnapshot,
  WawaActionResult,
  WawaBookMetrics,
  WawaBookTrendPoint,
  WawaMetricsDays,
  WawaMetricsView,
  WawaStatsMetricKey,
  WawaStatsTotals,
  WawaSubmissionActionRequest,
  WawaSubmissionPackageView,
  WawaSubmissionRunView,
  WawaSubmissionView
} from "./contracts";
import { mockDataSource } from "./mock-data";

export interface HttpDashboardDataSourceOptions {
  /** Real sync and submission operations are unavailable unless this is true. */
  enableWawaActions?: boolean;
}

const safeRequestFailure = "本地服务暂时不可用，请稍后重试。";
const safeInvalidResponse = "本地服务返回的数据格式无效，请稍后重试。";
const allowedMetricKeys = new Set<WawaStatsMetricKey>([
  "bookCount", "chapterCount", "wordCount", "revenue", "dailyRevenue", "followers", "followDelta"
]);

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function numberValue(value: unknown, fallback = 0): number {
  return numberOrNull(value) ?? fallback;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.flatMap((item) => {
    const record = asRecord(item);
    return record ? [record] : [];
  }) : [];
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (/^\/(?!\/)/.test(trimmed)) return trimmed.replace(/\/$/, "");
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("unsupported protocol");
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error("本地服务地址无效。");
  }
}

function metricValue(record: JsonRecord | null, key: keyof WawaStatsTotals): number | null {
  return numberOrNull(record?.[key]);
}

function normalizeMetrics(raw: unknown, requestedDays: WawaMetricsDays): WawaMetricsView {
  const payload = asRecord(raw);
  if (!payload) throw new Error(safeInvalidResponse);
  const rawBooks = records(payload.books);
  const books: WawaBookMetrics[] = rawBooks.map((item) => {
    const latest = asRecord(item.latest);
    return {
      bookKey: stringValue(item.bookKey),
      title: stringValue(item.title),
      status: stringValue(item.status) || undefined,
      shelfStatus: stringValue(item.shelfStatus) || undefined,
      channel: stringValue(item.channel) || undefined,
      categories: stringList(item.categories),
      isFinished: typeof item.isFinished === "boolean" ? item.isFinished : null,
      latest: {
        chapterCount: metricValue(latest, "chapterCount"),
        wordCount: metricValue(latest, "wordCount"),
        revenue: metricValue(latest, "revenue"),
        dailyRevenue: metricValue(latest, "dailyRevenue"),
        followers: metricValue(latest, "followers"),
        followDelta: metricValue(latest, "followDelta")
      },
      updatedAt: stringValue(item.updatedAt) || undefined
    };
  });
  const rawSummary = asRecord(payload.summary);
  const cumulative = requestedDays === "all";
  const totalLatest = (key: Exclude<keyof WawaStatsTotals, "bookCount">): number | null => {
    const values = books.map((book) => book.latest[key]).filter((value): value is number => value !== null);
    return values.length === books.length ? values.reduce((sum, value) => sum + value, 0) : null;
  };
  const summary: WawaStatsTotals & { mode: "cumulative" | "period" } = {
    bookCount: metricValue(rawSummary, "bookCount") ?? books.length,
    chapterCount: metricValue(rawSummary, "chapterCount"),
    wordCount: metricValue(rawSummary, "wordCount"),
    revenue: metricValue(rawSummary, "revenue"),
    dailyRevenue: metricValue(rawSummary, "dailyRevenue") ?? (cumulative ? totalLatest("dailyRevenue") : null),
    followers: metricValue(rawSummary, "followers"),
    followDelta: metricValue(rawSummary, "followDelta") ?? (cumulative ? totalLatest("followDelta") : null),
    mode: rawSummary?.mode === "period" ? "period" : "cumulative"
  };
  const range = asRecord(payload.range);
  const series: WawaBookTrendPoint[] = records(payload.series ?? payload.trend ?? payload.points).map((item) => ({
    date: stringValue(item.date),
    bookKey: stringValue(item.bookKey),
    chapterCount: numberOrNull(item.chapterCount),
    wordCount: numberOrNull(item.wordCount),
    revenue: numberOrNull(item.revenue),
    dailyRevenue: numberOrNull(item.dailyRevenue),
    followers: numberOrNull(item.followers),
    followDelta: numberOrNull(item.followDelta)
  }));
  const availableMetrics = stringList(payload.availableMetrics).filter((key): key is WawaStatsMetricKey => allowedMetricKeys.has(key as WawaStatsMetricKey));
  const latestRun = asRecord(payload.latestRun);
  return {
    available: payload.available === true,
    stale: payload.stale === true,
    range: {
      days: requestedDays,
      from: stringValue(range?.from) || undefined,
      to: stringValue(range?.to) || undefined
    },
    summary,
    books,
    series,
    availableMetrics,
    updatedAt: stringValue(payload.updatedAt) || stringValue(latestRun?.finishedAt) || stringValue(latestRun?.startedAt) || undefined,
    message: stringValue(payload.message) || undefined
  };
}

function normalizeFile(value: unknown, fallbackWordCount?: number): { fileName: string; sizeBytes: number; wordCount?: number } {
  const file = asRecord(value);
  const wordCount = numberOrNull(file?.wordCount) ?? fallbackWordCount;
  return {
    fileName: stringValue(file?.fileName),
    sizeBytes: numberValue(file?.sizeBytes),
    ...(wordCount !== undefined && wordCount !== null ? { wordCount } : {})
  };
}

function normalizePackage(value: JsonRecord): WawaSubmissionPackageView {
  const preflight = asRecord(value.preflight);
  const preflightWordCount = numberValue(preflight?.wordCount);
  return {
    bookKey: stringValue(value.bookKey),
    createdAt: stringValue(value.createdAt),
    title: stringValue(value.title),
    penName: stringValue(value.penName),
    summary: stringValue(value.summary),
    channel: stringValue(value.channel),
    status: stringValue(value.status),
    categories: stringList(value.categories),
    tags: [...stringList(value.tags), ...stringList(value.customTags)],
    manuscript: normalizeFile(value.manuscript, preflightWordCount),
    cover: normalizeFile(value.cover),
    preflight: {
      ok: preflight?.ok === true,
      errors: stringList(preflight?.errors),
      blockers: stringList(preflight?.blockers),
      warnings: stringList(preflight?.warnings),
      wordCount: preflightWordCount
    },
    canPrepare: value.canPrepare === true,
    submitted: value.submitted === true,
    submittedAt: stringValue(value.submittedAt) || undefined
  };
}

function normalizeRun(value: JsonRecord): WawaSubmissionRunView {
  const items = records(value.items);
  const titles = items.map((item) => stringValue(item.title)).filter(Boolean);
  const rawAction = stringValue(value.action);
  return {
    runId: stringValue(value.runId),
    action: rawAction === "prepare" || rawAction === "login" || rawAction === "cancel" ? rawAction : "dry-run",
    status: stringValue(value.status),
    createdAt: stringValue(value.createdAt),
    updatedAt: stringValue(value.updatedAt),
    bookKeys: stringList(value.bookKeys),
    title: titles.join("、") || "未命名投稿批次",
    message: stringValue(value.message),
    blockers: stringList(value.blockers),
    warnings: stringList(value.warnings),
    canCancel: value.canCancel === true
  };
}

function activeCampaign(value: unknown): { code?: string; name?: string } {
  const payload = asRecord(value);
  const candidates = records(payload?.items ?? payload?.campaigns ?? payload?.campaign);
  const selected = candidates.find((item) => item.active !== false) || candidates[0];
  return selected ? {
    code: stringValue(selected.code) || undefined,
    name: stringValue(selected.name) || undefined
  } : {};
}

function normalizeActionResult(value: unknown, action: WawaSubmissionActionRequest["action"]): WawaActionResult {
  const payload = asRecord(value);
  return {
    status: stringValue(payload?.status) || undefined,
    runId: stringValue(payload?.runId) || undefined,
    message: stringValue(payload?.message) || (action === "confirm" ? "已标记为已投稿。" : action === "unconfirm" ? "已撤销投稿标记。" : "操作已提交。")
  };
}

function requireValue(value: string | undefined, label: string): string {
  if (!value?.trim()) throw new Error(`${label}不能为空。`);
  return value;
}

/**
 * An opt-in bridge from the public dashboard to a separately running local
 * admin service. The regular dashboard snapshot intentionally remains mock
 * data because its legacy local endpoint has a different contract.
 */
export function createHttpDashboardDataSource(baseUrl: string, options: HttpDashboardDataSourceOptions = {}): DashboardDataSource {
  const serviceUrl = normalizeBaseUrl(baseUrl);
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    let response: Response;
    try {
      response = await fetch(`${serviceUrl}${path}`, {
        ...init,
        headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers }
      });
    } catch {
      throw new Error(safeRequestFailure);
    }
    if (!response.ok) throw new Error(safeRequestFailure);
    try {
      return await response.json() as T;
    } catch {
      throw new Error(safeInvalidResponse);
    }
  };

  const getSnapshot = (): Promise<DashboardSnapshot> => mockDataSource.getSnapshot();
  const source: DashboardDataSource = {
    capabilities: {
      mode: "http",
      wawaMetricsSync: options.enableWawaActions === true,
      wawaSubmissionActions: options.enableWawaActions === true
    },
    getSnapshot,
    async getWawaMetrics(days) {
      const query = new URLSearchParams({ days: String(days) });
      return normalizeMetrics(await request<unknown>(`/api/novels/wawa-metrics?${query}`), days);
    },
    async getWawaSubmission(page, pageSize) {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const [packagesRaw, runsRaw, campaignsRaw] = await Promise.all([
        request<unknown>(`/api/novels/wawa-submission?${query}`),
        request<unknown>("/api/novels/wawa-submission/runs"),
        request<unknown>("/api/novels/wawa-submission/campaigns/active")
      ]);
      const packages = asRecord(packagesRaw);
      const runs = asRecord(runsRaw);
      if (!packages || !runs) throw new Error(safeInvalidResponse);
      const campaign = activeCampaign(campaignsRaw);
      return {
        items: records(packages.items ?? packages.packages).map(normalizePackage),
        runs: records(runs.items).map(normalizeRun),
        total: numberValue(packages.total),
        page: numberValue(packages.page, page),
        pageSize: numberValue(packages.pageSize, pageSize),
        totalPages: numberValue(packages.totalPages, 1),
        campaignCode: campaign.code,
        campaignName: campaign.name
      };
    }
  };

  if (options.enableWawaActions === true) {
    source.syncWawaMetrics = async () => normalizeActionResult(await request<unknown>("/api/novels/wawa-metrics/sync", { method: "POST" }), "prepare");
    source.runWawaSubmissionAction = async (input) => {
      let path: string;
      let body: JsonRecord = {};
      switch (input.action) {
        case "dry-run": path = "/api/novels/wawa-submission/dry-run"; body = { ...(input.bookKey ? { bookKey: input.bookKey } : {}), ...(input.campaignCode ? { campaignCode: input.campaignCode } : {}) }; break;
        case "prepare": path = "/api/novels/wawa-submission/prepare"; body = { bookKey: requireValue(input.bookKey, "作品"), ...(input.campaignCode ? { campaignCode: input.campaignCode } : {}) }; break;
        case "login": path = "/api/novels/wawa-submission/login"; break;
        case "cancel": {
          const runId = requireValue(input.runId, "运行批次");
          path = `/api/novels/wawa-submission/runs/${encodeURIComponent(runId)}/cancel`;
          body = { runId };
          break;
        }
        case "confirm": path = "/api/novels/wawa-submission/confirm"; body = { bookKey: requireValue(input.bookKey, "作品") }; break;
        case "unconfirm": path = "/api/novels/wawa-submission/unconfirm"; body = { bookKey: requireValue(input.bookKey, "作品") }; break;
      }
      return normalizeActionResult(await request<unknown>(path!, { method: "POST", body: JSON.stringify(body) }), input.action);
    };
  }
  return source;
}
