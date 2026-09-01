import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpDashboardDataSource } from "../src/http-data-source";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => vi.unstubAllGlobals());

describe("createHttpDashboardDataSource", () => {
  it("keeps the dashboard snapshot mock while mapping sanitized Wawa metrics", async () => {
    const fetchMock = vi.fn(async () => json({
      available: true,
      stale: false,
      databasePath: "SHOULD_NOT_LEAK",
      range: { days: "all", from: "2026-08-01", to: "2026-09-01" },
      summary: { mode: "cumulative", chapterCount: 20, wordCount: 60000, revenue: 77.48, followers: 1002 },
      books: [{ bookKey: "novel-a", title: "星海示例", remoteId: "private-id", latest: { chapterCount: 20, wordCount: 60000, revenue: 77.48, dailyRevenue: 0, followers: 1002, followDelta: 144 } }],
      trend: [{ date: "2026-09-01", bookKey: "novel-a", revenue: 77.48, remoteId: "private-id" }],
      availableMetrics: ["revenue", "followers", "remoteId"],
      latestRun: { finishedAt: "2026-09-01T14:30:00+08:00" }
    }));
    vi.stubGlobal("fetch", fetchMock);

    const source = createHttpDashboardDataSource("http://127.0.0.1:17621/");
    const [snapshot, metrics] = await Promise.all([source.getSnapshot(), source.getWawaMetrics!("all")]);

    expect(snapshot.totals.runs).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:17621/api/novels/wawa-metrics?days=all", expect.any(Object));
    expect(metrics).toMatchObject({
      summary: { revenue: 77.48, followDelta: 144, mode: "cumulative" },
      books: [{ bookKey: "novel-a", latest: { dailyRevenue: 0 } }],
      series: [{ bookKey: "novel-a", revenue: 77.48 }],
      availableMetrics: ["revenue", "followers"],
      updatedAt: "2026-09-01T14:30:00+08:00"
    });
    expect(JSON.stringify(metrics)).not.toContain("SHOULD_NOT_LEAK");
    expect(JSON.stringify(metrics)).not.toContain("private-id");
  });

  it("loads the paginated packages, recent runs and active campaign from their local endpoints", async () => {
    const fetchMock = vi.fn(async (input: string) => {
      if (input.includes("/runs")) return json({ items: [{ runId: "run-1", action: "prepare", status: "prepared", createdAt: "2026-09-01", updatedAt: "2026-09-01", bookKeys: ["novel-a"], items: [{ title: "星海示例" }], message: "已预填", blockers: [], warnings: [], canCancel: true }] });
      if (input.includes("/campaigns/active")) return json({ items: [{ code: "event-1", name: "征文活动", active: true, internalPath: "SHOULD_NOT_LEAK" }] });
      return json({
        items: [{ bookKey: "novel-a", createdAt: "2026-09-01", title: "星海示例", penName: "演示作者", summary: "简介", channel: "短篇", status: "ready", categories: ["现实"], tags: ["成长"], customTags: ["治愈"], manuscript: { fileName: "正文.txt", sizeBytes: 1024, wordCount: 60000, path: "SHOULD_NOT_LEAK" }, cover: { fileName: "封面.jpg", sizeBytes: 20 }, preflight: { ok: true, errors: [], blockers: [], warnings: [], wordCount: 60000 }, canPrepare: true, submitted: false }],
        total: 21, page: 2, pageSize: 10, totalPages: 3
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createHttpDashboardDataSource("http://localhost:17621").getWawaSubmission!(2, 10);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({ total: 21, page: 2, pageSize: 10, totalPages: 3, campaignCode: "event-1", runs: [{ title: "星海示例", canCancel: true }], items: [{ tags: ["成长", "治愈"], manuscript: { fileName: "正文.txt" } }] });
    expect(JSON.stringify(result)).not.toContain("SHOULD_NOT_LEAK");
  });

  it("does not expose mutations without an explicit action switch", () => {
    const source = createHttpDashboardDataSource("http://localhost:17621");
    expect(source.capabilities).toMatchObject({ mode: "http", wawaMetricsSync: false, wawaSubmissionActions: false });
    expect(source.syncWawaMetrics).toBeUndefined();
    expect(source.runWawaSubmissionAction).toBeUndefined();
  });

  it("accepts a same-origin proxy path for local development", async () => {
    const fetchMock = vi.fn(async () => json({ available: true, books: [], series: [], summary: {}, availableMetrics: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await createHttpDashboardDataSource("/local-api/").getWawaMetrics!(7);

    expect(fetchMock).toHaveBeenCalledWith("/local-api/api/novels/wawa-metrics?days=7", expect.any(Object));
  });

  it("does not label latest daily values as period totals", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({
      available: true,
      summary: { mode: "period", revenue: 12 },
      books: [{ bookKey: "novel-a", title: "演示", latest: { dailyRevenue: 9, followDelta: 6 } }],
      series: [],
      availableMetrics: ["dailyRevenue", "followDelta"]
    })));

    const metrics = await createHttpDashboardDataSource("/local-api").getWawaMetrics!(7);

    expect(metrics.summary.dailyRevenue).toBeNull();
    expect(metrics.summary.followDelta).toBeNull();
  });

  it("routes explicitly enabled actions and does not disclose backend error messages", async () => {
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      if (input.endsWith("/sync")) return json({ status: "success", message: "同步完成", runId: "sync-1" });
      if (input.includes("/confirm")) return json({ bookKey: "novel-a", submitted: true });
      if (input.includes("/prepare")) return json({ error: "private_path: SHOULD_NOT_LEAK", message: "凭证过期" }, 500);
      expect(init?.method).toBe("POST");
      return json({});
    });
    vi.stubGlobal("fetch", fetchMock);
    const source = createHttpDashboardDataSource("http://localhost:17621", { enableWawaActions: true });

    await expect(source.syncWawaMetrics!()).resolves.toMatchObject({ runId: "sync-1", message: "同步完成" });
    await expect(source.runWawaSubmissionAction!({ action: "confirm", bookKey: "novel-a" })).resolves.toMatchObject({ message: "已标记为已投稿。" });
    await expect(source.runWawaSubmissionAction!({ action: "prepare", bookKey: "novel-a" })).rejects.toThrow("本地服务暂时不可用");
    await expect(source.runWawaSubmissionAction!({ action: "prepare", bookKey: "novel-a" })).rejects.not.toThrow("凭证过期");
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/novels/wawa-submission/confirm"))).toBe(true);
  });
});
