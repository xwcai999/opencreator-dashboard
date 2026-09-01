import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WawaStatsPage } from "../src/WawaStatsPage";
import type { DashboardDataSource, WawaMetricsView } from "../src/contracts";
import { mockWawaMetrics } from "../src/mock-data";

const view: WawaMetricsView = {
  available: true,
  stale: false,
  range: { days: "all" },
  summary: { mode: "cumulative", bookCount: 2, chapterCount: 40, wordCount: 120000, revenue: 88.5, dailyRevenue: 12.3, followers: 600, followDelta: 42 },
  availableMetrics: ["chapterCount", "wordCount", "revenue", "dailyRevenue", "followers", "followDelta"],
  updatedAt: "2026-09-01T14:30:00+08:00",
  books: [
    { bookKey: "book-a", title: "星星的口袋", channel: "女频", isFinished: false, categories: ["亲子"], updatedAt: "2026-09-01T14:30:00+08:00", latest: { chapterCount: 20, wordCount: 60000, revenue: 50, dailyRevenue: 8, followers: 400, followDelta: 30 } },
    { bookKey: "book-b", title: "晚风小站", channel: "男频", isFinished: true, categories: ["都市"], updatedAt: "2026-09-01T14:30:00+08:00", latest: { chapterCount: 20, wordCount: 60000, revenue: 38.5, dailyRevenue: 4.3, followers: 200, followDelta: 12 } }
  ],
  series: [
    { date: "2026-08-31", bookKey: "book-a", revenue: 42, dailyRevenue: 6, followers: 370 },
    { date: "2026-09-01", bookKey: "book-a", revenue: 50, dailyRevenue: 8, followers: 400 },
    { date: "2026-09-01", bookKey: "book-b", revenue: 38.5, dailyRevenue: 4.3, followers: 200 }
  ]
};

function createSource(overrides: Partial<DashboardDataSource> = {}): DashboardDataSource {
  return {
    getSnapshot: vi.fn(),
    getWawaMetrics: vi.fn(async (days) => ({ ...structuredClone(view), range: { days } })),
    capabilities: { mode: "mock", wawaMetricsSync: false, wawaSubmissionActions: false },
    ...overrides
  };
}

describe("WawaStatsPage", () => {
  it("makes mock range changes observable", () => {
    const oneDay = mockWawaMetrics(1);
    const threeDays = mockWawaMetrics(3);
    expect(new Set(oneDay.series.map((point) => point.date)).size).toBe(1);
    expect(new Set(threeDays.series.map((point) => point.date)).size).toBe(3);
    expect(oneDay.summary.revenue).not.toBe(threeDays.summary.revenue);
  });
  it("uses the injected source with cumulative default and never fetches directly", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const source = createSource();
    render(<WawaStatsPage source={source} />);

    expect(await screen.findByRole("heading", { name: "蛙蛙数据" })).toBeInTheDocument();
    expect(source.getWawaMetrics).toHaveBeenCalledWith("all");
    expect(screen.getAllByText("88.50 元").length).toBeGreaterThan(0);
    expect(screen.getByText("日收益最高")).toBeInTheDocument();
    expect(screen.getByText("累计收益最高")).toBeInTheDocument();
    expect(screen.getByText("追读最多")).toBeInTheDocument();
    expect(screen.getAllByText("星星的口袋").length).toBeGreaterThan(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("changes range through the source and filters visible works", async () => {
    const source = createSource();
    render(<WawaStatsPage source={source} />);
    await waitFor(() => expect(source.getWawaMetrics).toHaveBeenCalledWith("all"));

    fireEvent.click(screen.getByRole("button", { name: "3 天" }));
    await waitFor(() => expect(source.getWawaMetrics).toHaveBeenLastCalledWith(3));

    fireEvent.change(screen.getByRole("combobox", { name: "按频道筛选" }), { target: { value: "女频" } });
    expect(screen.getAllByText("星星的口袋").length).toBeGreaterThan(1);
    expect(screen.getAllByText("晚风小站")).toHaveLength(1);
  });

  it("ignores a slower response from an older range request", async () => {
    let resolveOne!: (value: WawaMetricsView) => void;
    let resolveNinety!: (value: WawaMetricsView) => void;
    const source = createSource({
      getWawaMetrics: vi.fn((days) => {
        if (days === 1) return new Promise<WawaMetricsView>((resolve) => { resolveOne = resolve; });
        if (days === 90) return new Promise<WawaMetricsView>((resolve) => { resolveNinety = resolve; });
        return Promise.resolve(structuredClone(view));
      })
    });
    render(<WawaStatsPage source={source} />);
    await screen.findAllByText("88.50 元");

    fireEvent.click(screen.getByRole("button", { name: "1 天" }));
    fireEvent.click(screen.getByRole("button", { name: "90 天" }));
    resolveNinety({ ...structuredClone(view), summary: { ...view.summary, revenue: 90 } });
    expect(await screen.findByText("90.00 元")).toBeInTheDocument();
    resolveOne({ ...structuredClone(view), summary: { ...view.summary, revenue: 1 } });
    await Promise.resolve();
    expect(screen.queryByText("1.00 元")).not.toBeInTheDocument();
  });

  it("keeps at least one trend metric visible", async () => {
    const source = createSource();
    render(<WawaStatsPage source={source} />);
    await screen.findByLabelText("蛙蛙作品趋势图");

    fireEvent.click(screen.getByRole("checkbox", { name: "累计收益" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "日收益" }));
    const remaining = screen.getByRole("checkbox", { name: "追读人数" });
    expect(remaining).toBeChecked();
    expect(remaining).toBeDisabled();
  });

  it("explains disabled sync and invokes enabled sync through the source", async () => {
    const blocked = createSource();
    const { unmount } = render(<WawaStatsPage source={blocked} />);
    expect(await screen.findByRole("button", { name: "手动同步" })).toBeDisabled();
    expect(screen.getByText(/未开启同步权限/)).toBeInTheDocument();
    unmount();

    const syncWawaMetrics = vi.fn(async () => ({ message: "同步完成" }));
    const enabled = createSource({ capabilities: { mode: "http", wawaMetricsSync: true, wawaSubmissionActions: false }, syncWawaMetrics });
    render(<WawaStatsPage source={enabled} />);
    const button = await screen.findByRole("button", { name: "手动同步" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() => expect(syncWawaMetrics).toHaveBeenCalledTimes(1));
  });
});
