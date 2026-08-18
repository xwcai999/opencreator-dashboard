import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardApp } from "../src/App";
import { mockSnapshot } from "../src/mock-data";

describe("OpenCreator dashboard", () => {
  it("renders the mock-first overview without requesting external data", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<DashboardApp />);

    expect(await screen.findByRole("heading", { name: /把创作过程变成/ })).toBeInTheDocument();
    expect(screen.getByText("MOCK DATA")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "当前生产链" })).toBeInTheDocument();
    expect(screen.getByText("Turn the Page")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("accepts a contract-compatible data source and filters rows by status", async () => {
    const source = { getSnapshot: vi.fn(async () => structuredClone(mockSnapshot)) };
    render(<DashboardApp source={source} />);
    await waitFor(() => expect(source.getSnapshot).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByRole("combobox", { name: "按状态筛选" }), { target: { value: "failed" } });
    expect(screen.getByText("再走一拍")).toBeInTheDocument();
    expect(screen.queryByText("Turn the Page")).not.toBeInTheDocument();
  });

  it("exposes accessible media state and a refresh action", async () => {
    render(<DashboardApp />);
    expect((await screen.findAllByTitle("音频已就绪")).length).toBeGreaterThan(0);
    expect(screen.getByTitle("暂无封面")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /刷新/ })).toBeEnabled();
  });
  it("renders the four-platform publishing snapshot without submit controls", async () => {
    render(<DashboardApp />);

    expect(await screen.findByRole("heading", { name: "四平台发布状态" })).toBeInTheDocument();
    expect(screen.getByText("CONTRACT 1.0.0")).toBeInTheDocument();
    expect(screen.getByText("番茄音乐")).toBeInTheDocument();
    expect(screen.getByText("汽水音乐")).toBeInTheDocument();
    expect(screen.getByText("网易云音乐")).toBeInTheDocument();
    expect(screen.getByText("腾讯音乐")).toBeInTheDocument();
    expect(screen.getAllByText("等待人工确认").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已阻断").length).toBeGreaterThan(0);
    expect(screen.getByText("GENRE_NOT_SUPPORTED")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /提交|发布/ })).not.toBeInTheDocument();
  });

  it("renders the optional aggregate-only Wawa snapshot without fetch or sync controls", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<DashboardApp />);

    expect(await screen.findByRole("heading", { name: "蛙蛙统计" })).toBeInTheDocument();
    expect(screen.getByText("WAWA CONTRACT 1.0.0")).toBeInTheDocument();
    expect(screen.getByText("数据完整")).toBeInTheDocument();
    expect(screen.getByText("作品数")).toBeInTheDocument();
    expect(screen.getAllByText("章节数").length).toBeGreaterThan(0);
    expect(screen.getAllByText("累计收益").length).toBeGreaterThan(0);
    expect(screen.getAllByText("追读增量").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("蛙蛙统计趋势图")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /同步|抓取|采集/ })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it.each([
    ["partial", "部分可用"],
    ["stale", "数据已过期"],
    ["unavailable", "暂不可用"]
  ] as const)("renders the Wawa %s snapshot state", async (status, label) => {
    const stats = structuredClone(mockSnapshot.wawaStats!);
    stats.status = status;
    if (status === "unavailable") {
      stats.totals = {
        bookCount: null,
        chapterCount: null,
        wordCount: null,
        revenue: null,
        dailyRevenue: null,
        followers: null,
        followDelta: null
      };
      stats.trend = [];
    }
    const source = { getSnapshot: vi.fn(async () => ({ ...structuredClone(mockSnapshot), wawaStats: stats })) };
    render(<DashboardApp source={source} />);

    expect(await screen.findByRole("heading", { name: "蛙蛙统计" })).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /同步|抓取|采集/ })).not.toBeInTheDocument();
  });
});
