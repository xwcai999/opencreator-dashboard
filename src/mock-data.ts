import type { DashboardDataSource, DashboardSnapshot, PipelineGraph, SongRecord } from "./contracts";

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
  activePipeline
};

export const mockDataSource: DashboardDataSource = {
  async getSnapshot() {
    return structuredClone(mockSnapshot);
  }
};
