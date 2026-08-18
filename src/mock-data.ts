import type { DashboardDataSource, DashboardSnapshot, PipelineGraph, PublishingSnapshot, SongRecord, WawaStatsSnapshot } from "./contracts";

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

export const mockDataSource: DashboardDataSource = {
  async getSnapshot() {
    return structuredClone(mockSnapshot);
  }
};
