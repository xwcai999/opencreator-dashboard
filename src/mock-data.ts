import type {
  DashboardDataSource,
  DashboardSnapshot,
  PipelineGraph,
  PublishingSnapshot,
  SongRecord,
  WawaBookMetrics,
  WawaBookTrendPoint,
  WawaMetricsDays,
  WawaMetricsView,
  WawaStatsSnapshot,
  WawaSubmissionPackageView,
  WawaSubmissionRunView
} from "./contracts";

const songs: SongRecord[] = [
  {
    runId: "demo-20260811-001",
    title: "Turn the Page",
    language: "English",
    style: "Indie pop / warm synth",
    theme: "A small decision that changes the route home",
    agentRole: "Narrative lyricist",
    status: "success",
    createdAt: "2026-08-11T09:12:00+08:00",
    hasAudio: true,
    hasCover: true,
    qualityScore: 88
  },
  {
    runId: "demo-20260811-002",
    title: "把灯留给你",
    language: "中文",
    style: "城市民谣 / clean guitar",
    theme: "把告别写成一盏留给晚归人的灯",
    agentRole: "A&R trend planner",
    status: "running",
    createdAt: "2026-08-11T08:38:00+08:00",
    hasAudio: false,
    hasCover: true,
    qualityScore: 72
  },
  {
    runId: "demo-20260810-003",
    title: "Sidewalk Signals",
    language: "English",
    style: "Future R&B / half-time drums",
    theme: "Two people finding the same rhythm in a crowded city",
    agentRole: "Genre producer",
    status: "success",
    createdAt: "2026-08-10T22:16:00+08:00",
    hasAudio: true,
    hasCover: true,
    qualityScore: 91
  },
  {
    runId: "demo-20260810-004",
    title: "再走一拍",
    language: "中文",
    style: "Dance pop / bright brass",
    theme: "朋友在低谷里用一个动作重新集合",
    agentRole: "Dance producer",
    status: "failed",
    createdAt: "2026-08-10T16:05:00+08:00",
    hasAudio: false,
    hasCover: false,
    qualityScore: 0
  },
  {
    runId: "demo-20260809-005",
    title: "Soft Landing",
    language: "English",
    style: "Lo-fi soul / brushed drums",
    theme: "Learning to accept help without losing momentum",
    agentRole: "Narrative lyricist",
    status: "interrupted",
    createdAt: "2026-08-09T11:42:00+08:00",
    hasAudio: false,
    hasCover: true,
    qualityScore: 64
  }
];

const activePipeline: PipelineGraph = {
  runId: "demo-20260811-002",
  title: "把灯留给你",
  status: "running",
  updatedAt: "2026-08-11T08:44:00+08:00",
  nodes: [
    { id: "brief", label: "创作简报", status: "success", detail: "主题与语言已确定" },
    { id: "lyrics", label: "歌词草稿", status: "success", detail: "完成 2 轮校验" },
    { id: "style", label: "制作风格", status: "running", detail: "正在整理音色弧线" },
    { id: "audio", label: "音频生成", status: "pending", detail: "等待风格确认" },
    { id: "cover", label: "封面方向", status: "pending", detail: "尚未开始" }
  ]
};

const publishing: PublishingSnapshot = {
  contractVersion: "1.0.0",
  platforms: [
    {
      platform: "fanqie",
      displayName: "番茄音乐",
      stage: "verified",
      candidateCount: 8,
      claimedCount: 8,
      preparedCount: 8,
      blockerCodes: [],
      manualActionRequired: false,
      updatedAt: "2026-08-11T09:18:00+08:00"
    },
    {
      platform: "qishui",
      displayName: "汽水音乐",
      stage: "awaiting_confirmation",
      candidateCount: 6,
      claimedCount: 6,
      preparedCount: 6,
      blockerCodes: [],
      manualActionRequired: true,
      updatedAt: "2026-08-11T09:16:00+08:00"
    },
    {
      platform: "netease",
      displayName: "网易云音乐",
      stage: "blocked",
      candidateCount: 5,
      claimedCount: 4,
      preparedCount: 0,
      blockerCodes: ["GENRE_NOT_SUPPORTED", "LANGUAGE_MISMATCH"],
      manualActionRequired: false,
      updatedAt: "2026-08-11T09:14:00+08:00"
    },
    {
      platform: "tencent",
      displayName: "腾讯音乐",
      stage: "preparing",
      candidateCount: 7,
      claimedCount: 5,
      preparedCount: 3,
      blockerCodes: [],
      manualActionRequired: false,
      updatedAt: "2026-08-11T09:11:00+08:00"
    }
  ],
  totals: {
    candidates: 26,
    claimed: 23,
    prepared: 17,
    blocked: 1
  }
};

/** Synthetic aggregate-only fixture. It intentionally has no work labels or remote identifiers. */
export const mockWawaStats: WawaStatsSnapshot = {
  contractVersion: "1.0.0",
  status: "success",
  generatedAt: "2026-08-11T09:20:00+08:00",
  range: {
    days: 7,
    from: "2026-08-05T00:00:00+08:00",
    to: "2026-08-11T23:59:59+08:00"
  },
  totals: {
    bookCount: 4,
    chapterCount: 186,
    wordCount: 482600,
    revenue: 1386.42,
    dailyRevenue: 42.8,
    followers: 12840,
    followDelta: 317
  },
  trend: [
    { date: "08-05", bookCount: 4, chapterCount: 164, wordCount: 426800, revenue: 1228.4, dailyRevenue: 31.2, followers: 11980, followDelta: 182 },
    { date: "08-06", bookCount: 4, chapterCount: 168, wordCount: 438500, revenue: 1261.8, dailyRevenue: 33.4, followers: 12120, followDelta: 140 },
    { date: "08-07", bookCount: 4, chapterCount: 171, wordCount: 445200, revenue: 1289.2, dailyRevenue: 27.4, followers: 12240, followDelta: 120 },
    { date: "08-08", bookCount: 4, chapterCount: 176, wordCount: 456900, revenue: 1317.6, dailyRevenue: 28.4, followers: 12410, followDelta: 170 },
    { date: "08-09", bookCount: 4, chapterCount: 180, wordCount: 467500, revenue: 1348.2, dailyRevenue: 30.6, followers: 12580, followDelta: 170 },
    { date: "08-10", bookCount: 4, chapterCount: 183, wordCount: 475900, revenue: 1370.1, dailyRevenue: 21.9, followers: 12690, followDelta: 110 },
    { date: "08-11", bookCount: 4, chapterCount: 186, wordCount: 482600, revenue: 1386.42, dailyRevenue: 16.32, followers: 12840, followDelta: 150 }
  ],
  availableMetrics: ["bookCount", "chapterCount", "wordCount", "revenue", "dailyRevenue", "followers", "followDelta"],
  message: "仅展示脱敏聚合指标，不包含作品标识或账号信息。"
};

export const mockSnapshot: DashboardSnapshot = {
  generatedAt: "2026-08-11T09:20:00+08:00",
  totals: {
    runs: 128,
    success: 103,
    failed: 12,
    running: 2,
    successRate: 80.5,
    audioReadyRate: 78.1,
    coverReadyRate: 84.4
  },
  daily: [
    { date: "08-05", success: 12, failed: 1, interrupted: 0 },
    { date: "08-06", success: 16, failed: 2, interrupted: 1 },
    { date: "08-07", success: 13, failed: 1, interrupted: 0 },
    { date: "08-08", success: 18, failed: 3, interrupted: 1 },
    { date: "08-09", success: 15, failed: 2, interrupted: 1 },
    { date: "08-10", success: 17, failed: 2, interrupted: 1 },
    { date: "08-11", success: 12, failed: 1, interrupted: 0 }
  ],
  songs,
  activePipeline,
  publishing,
  wawaStats: mockWawaStats
};

const mockWawaBooks: WawaBookMetrics[] = [
  { bookKey: "demo-harbor", title: "雾港来信", status: "连载", shelfStatus: "已上架", channel: "女频", categories: ["现代言情"], isFinished: false, latest: { chapterCount: 48, wordCount: 142600, revenue: 486.32, dailyRevenue: 18.4, followers: 1680, followDelta: 42 }, updatedAt: "2026-08-11T09:20:00+08:00" },
  { bookKey: "demo-clock", title: "逆时钟花店", status: "完结", shelfStatus: "已上架", channel: "女频", categories: ["幻想言情"], isFinished: true, latest: { chapterCount: 72, wordCount: 226800, revenue: 632.8, dailyRevenue: 14.2, followers: 2130, followDelta: 35 }, updatedAt: "2026-08-11T09:20:00+08:00" },
  { bookKey: "demo-mountain", title: "山海修理铺", status: "连载", shelfStatus: "审核中", channel: "男频", categories: ["都市脑洞"], isFinished: false, latest: { chapterCount: 66, wordCount: 198400, revenue: 267.3, dailyRevenue: 10.2, followers: 1540, followDelta: 28 }, updatedAt: "2026-08-11T09:20:00+08:00" },
  { bookKey: "demo-rain", title: "雨停之前", status: "完结", shelfStatus: "已下架", channel: "全频", categories: ["现实情感"], isFinished: true, latest: { chapterCount: 20, wordCount: 80800, revenue: 0, dailyRevenue: 0, followers: 420, followDelta: 4 }, updatedAt: "2026-08-11T09:20:00+08:00" }
];

const mockWawaSeries: WawaBookTrendPoint[] = Array.from({ length: 7 }, (_, day) => mockWawaBooks.map((book, index) => ({
  date: `08-${String(day + 5).padStart(2, "0")}`,
  bookKey: book.bookKey,
  chapterCount: Math.max(1, (book.latest.chapterCount || 0) - (6 - day) * (index + 1)),
  wordCount: Math.max(1, (book.latest.wordCount || 0) - (6 - day) * 2600),
  revenue: Math.max(0, Number(((book.latest.revenue || 0) - (6 - day) * (index + 3)).toFixed(2))),
  dailyRevenue: Math.max(0, Number(((book.latest.dailyRevenue || 0) - (6 - day) * .7).toFixed(2))),
  followers: Math.max(0, (book.latest.followers || 0) - (6 - day) * 20),
  followDelta: Math.max(0, (book.latest.followDelta || 0) - (6 - day) * 2)
}))).flat();

export function mockWawaMetrics(days: WawaMetricsDays = "all"): WawaMetricsView {
  const dates = [...new Set(mockWawaSeries.map((point) => point.date))].sort();
  const visibleDates = days === "all" ? dates : dates.slice(-days);
  const periodDates = days === "all" ? dates : dates.slice(-(days + 1));
  const series = mockWawaSeries.filter((point) => visibleDates.includes(point.date));
  const periodSummary = (() => {
    if (days === "all") return { ...mockWawaStats.totals, mode: "cumulative" as const };
    const totalChange = (key: "chapterCount" | "wordCount" | "revenue" | "followers") => mockWawaBooks.reduce((sum, book) => {
      const points = mockWawaSeries.filter((point) => point.bookKey === book.bookKey && periodDates.includes(point.date)).sort((left, right) => left.date.localeCompare(right.date));
      return sum + Math.max(0, (points.at(-1)?.[key] ?? 0) - (points[0]?.[key] ?? 0));
    }, 0);
    return {
      mode: "period" as const,
      bookCount: mockWawaBooks.length,
      chapterCount: totalChange("chapterCount"),
      wordCount: totalChange("wordCount"),
      revenue: totalChange("revenue"),
      dailyRevenue: mockWawaBooks.reduce((sum, book) => sum + (book.latest.dailyRevenue ?? 0), 0),
      followers: totalChange("followers"),
      followDelta: mockWawaBooks.reduce((sum, book) => sum + (book.latest.followDelta ?? 0), 0)
    };
  })();
  return {
    available: true,
    stale: false,
    range: { days, from: visibleDates[0], to: visibleDates.at(-1) },
    summary: periodSummary,
    books: structuredClone(mockWawaBooks),
    series: structuredClone(series),
    availableMetrics: [...mockWawaStats.availableMetrics],
    updatedAt: mockWawaStats.generatedAt,
    message: "当前为合成演示数据；连接本地适配器后可查看自己的作品。"
  };
}

const submissionTitles = [
  "纸船回声", "月台第七码", "把风还给海", "未寄出的春天", "城市睡眠指南", "落日维修站",
  "候鸟失物招领", "凌晨四点的灯", "云端旧相册", "北岸无声雨", "时间的备用钥匙", "最后一班慢车",
  "星光寄存处", "冬夜留声机", "回到潮汐之前", "第九次告别", "风筝线那端", "没有地址的信",
  "玻璃森林", "星期天的钟", "长街短梦", "海上旧书店", "影子的来信", "夏末的回音"
];

const mockSubmissionPackages: WawaSubmissionPackageView[] = submissionTitles.map((title, index) => ({
  bookKey: `demo-submission-${String(index + 1).padStart(2, "0")}`,
  createdAt: new Date(Date.UTC(2026, 7, 31 - index, 8)).toISOString(),
  title,
  penName: "演示作者",
  summary: `${title}的合成投稿简介，仅用于展示页面交互。`,
  channel: index % 3 === 0 ? "男频" : index % 3 === 1 ? "女频" : "全频",
  status: index % 5 === 0 ? "连载" : "完结",
  categories: [index % 2 ? "现代言情" : "现实情感"],
  tags: [index % 2 ? "治愈" : "现实"],
  manuscript: { fileName: `${title}-投稿正文.txt`, sizeBytes: 24000 + index * 37, wordCount: 7600 + index * 120 },
  cover: { fileName: `${title}-封面.png`, sizeBytes: 880000 + index * 1000 },
  preflight: { ok: index % 7 !== 0, errors: [], blockers: index % 7 === 0 ? ["DEMO_FIELD_REVIEW"] : [], warnings: [], wordCount: 7600 + index * 120 },
  canPrepare: true,
  submitted: index < 2,
  ...(index < 2 ? { submittedAt: new Date(Date.UTC(2026, 7, 31 - index, 10)).toISOString() } : {})
}));

const mockSubmissionRuns: WawaSubmissionRunView[] = Array.from({ length: 10 }, (_, index) => ({
  runId: `demo-run-${String(index + 1).padStart(2, "0")}`,
  action: index % 3 === 0 ? "prepare" : "dry-run",
  status: index % 4 === 0 ? "prepared" : "dry-run",
  createdAt: new Date(Date.UTC(2026, 7, 31, 9, 30 - index)).toISOString(),
  updatedAt: new Date(Date.UTC(2026, 7, 31, 9, 35 - index)).toISOString(),
  bookKeys: [mockSubmissionPackages[index].bookKey],
  title: mockSubmissionPackages[index].title,
  message: index % 4 === 0 ? "演示批次已停在最终提交前" : "演示预检完成",
  blockers: [],
  warnings: [],
  canCancel: index % 4 === 0
}));

export const mockDataSource: DashboardDataSource = {
  capabilities: { mode: "mock", wawaMetricsSync: false, wawaSubmissionActions: false },
  async getSnapshot() {
    return structuredClone(mockSnapshot);
  },
  async getWawaMetrics(days) {
    return mockWawaMetrics(days);
  },
  async getWawaSubmission(page, pageSize) {
    const totalPages = Math.max(1, Math.ceil(mockSubmissionPackages.length / pageSize));
    const safePage = Math.max(1, Math.min(totalPages, page));
    const start = (safePage - 1) * pageSize;
    return {
      items: structuredClone(mockSubmissionPackages.slice(start, start + pageSize)),
      runs: structuredClone(mockSubmissionRuns),
      total: mockSubmissionPackages.length,
      page: safePage,
      pageSize,
      totalPages,
      campaignCode: "demo-campaign",
      campaignName: "合成演示活动",
      loginStatus: "unknown"
    };
  }
};
