import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DashboardDataSource, WawaSubmissionView } from "../src/contracts";
import { WawaSubmissionPage } from "../src/WawaSubmissionPage";

function packageView(index: number, overrides: Partial<WawaSubmissionView["items"][number]> = {}): WawaSubmissionView["items"][number] {
  return {
    bookKey: `book-${index}`,
    createdAt: `2026-09-${String(30 - index).padStart(2, "0")}T10:00:00+08:00`,
    title: `作品 ${index}`,
    penName: "测试作者",
    summary: `第 ${index} 篇投稿摘要`,
    channel: "女频",
    status: "待投稿",
    categories: ["女频", "现代言情", "都市情感"],
    tags: ["甜宠"],
    manuscript: { fileName: `作品${index}.txt`, sizeBytes: 1024 * 1024, wordCount: 60000 },
    cover: { fileName: `作品${index}.jpg`, sizeBytes: 1024 * 20 },
    preflight: { ok: true, errors: [], blockers: [], warnings: [], wordCount: 60000 },
    canPrepare: true,
    submitted: false,
    ...overrides
  };
}

function view(page: number, overrides: Partial<WawaSubmissionView> = {}): WawaSubmissionView {
  return {
    items: Array.from({ length: 10 }, (_, index) => packageView((page - 1) * 10 + index + 1)),
    runs: Array.from({ length: 12 }, (_, index) => ({
      runId: `run-${index + 1}`,
      action: "dry-run",
      status: "success",
      createdAt: `2026-09-01T${String(index).padStart(2, "0")}:00:00+08:00`,
      updatedAt: `2026-09-01T${String(index).padStart(2, "0")}:05:00+08:00`,
      bookKeys: [`book-${index + 1}`],
      title: `运行 ${index + 1}`,
      message: "预检完成",
      blockers: [],
      warnings: [],
      canCancel: index === 0
    })),
    total: 21,
    page,
    pageSize: 10,
    totalPages: 3,
    campaignCode: "demo-campaign",
    campaignName: "测试活动",
    loginStatus: "ready",
    ...overrides
  };
}

describe("WawaSubmissionPage", () => {
  it("requests server-side pages at 10 items per page and exposes pagination", async () => {
    const source: DashboardDataSource = {
      getSnapshot: vi.fn(),
      getWawaSubmission: vi.fn(async (page: number, pageSize: number) => view(page))
    };
    render(<WawaSubmissionPage source={source} />);

    expect(await screen.findByRole("heading", { name: "待投稿文件" })).toBeInTheDocument();
    expect(source.getWawaSubmission).toHaveBeenCalledWith(1, 10);
    expect(screen.getAllByRole("article")).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    await waitFor(() => expect(source.getWawaSubmission).toHaveBeenLastCalledWith(2, 10));
    expect(screen.getByText("作品 11")).toBeInTheDocument();
  });

  it("keeps only the most recent 10 execution records even when the source returns more", async () => {
    const source: DashboardDataSource = { getSnapshot: vi.fn(), getWawaSubmission: vi.fn(async () => view(1)) };
    render(<WawaSubmissionPage source={source} />);

    expect(await screen.findByRole("heading", { name: "投稿运行历史" })).toBeInTheDocument();
    expect(screen.getByText("运行 10")).toBeInTheDocument();
    expect(screen.queryByText("运行 11")).not.toBeInTheDocument();
    expect(screen.getByText("最近 10 条")).toBeInTheDocument();
  });

  it("disables real actions with a clear explanation when the local execution capability is closed", async () => {
    const source: DashboardDataSource = { getSnapshot: vi.fn(), getWawaSubmission: vi.fn(async () => view(1)) };
    render(<WawaSubmissionPage source={source} />);

    expect(await screen.findByText(/当前为展示模式/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "预检" }).every((button) => button.hasAttribute("disabled"))).toBe(true);
    expect(screen.getAllByRole("button", { name: "标记已投稿" }).every((button) => button.hasAttribute("disabled"))).toBe(true);
    expect(screen.queryByRole("button", { name: "打开登录" })).not.toBeInTheDocument();
  });

  it("runs actions through the data source and refreshes the current page", async () => {
    const runWawaSubmissionAction = vi.fn(async () => ({ message: "已保存人工投稿标记" }));
    const source: DashboardDataSource = {
      capabilities: { mode: "http", wawaMetricsSync: false, wawaSubmissionActions: true },
      getSnapshot: vi.fn(),
      getWawaSubmission: vi.fn(async () => view(1, { items: [packageView(1), packageView(2, { submitted: true, submittedAt: "2026-09-01T12:00:00+08:00" })] })),
      runWawaSubmissionAction
    };
    render(<WawaSubmissionPage source={source} />);

    await screen.findByText("作品 1");
    fireEvent.click(screen.getByRole("button", { name: "标记已投稿" }));
    await waitFor(() => expect(runWawaSubmissionAction).toHaveBeenCalledWith({ action: "confirm", bookKey: "book-1" }));
    expect(await screen.findByText("已保存人工投稿标记")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "撤销投稿标记" })).toBeEnabled();
  });

  it("shows preflight blockers and does not allow page preparation for a blocked package", async () => {
    const source: DashboardDataSource = {
      capabilities: { mode: "http", wawaMetricsSync: false, wawaSubmissionActions: true },
      getSnapshot: vi.fn(),
      getWawaSubmission: vi.fn(async () => view(1, { items: [packageView(1, { canPrepare: false, preflight: { ok: false, errors: [], blockers: ["封面缺失"], warnings: [], wordCount: 0 } })] })),
      runWawaSubmissionAction: vi.fn(async () => ({ message: "ok" }))
    };
    render(<WawaSubmissionPage source={source} />);

    expect(await screen.findByText("阻断：封面缺失")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "预填页面" })).toBeDisabled();
  });
});
