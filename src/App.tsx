import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type {
  DashboardDataSource,
  DashboardSnapshot,
  PublishStage,
  PublishingSnapshot,
  RunStatus,
  SongRecord,
  WawaStatsMetricKey,
  WawaStatsSnapshot,
  WawaStatsStatus
} from "./contracts";
import { mockDataSource } from "./mock-data";
import "./styles.css";

type Filter = "all" | RunStatus;

const statusLabels: Record<RunStatus, string> = {
  success: "成功",
  failed: "失败",
  running: "运行中",
  interrupted: "已中断"
};

const publishStageLabels: Record<PublishStage, string> = {
  discovered: "已发现",
  eligible: "已校验",
  claimed: "已认领",
  preparing: "准备中",
  awaiting_confirmation: "等待人工确认",
  submitted: "已提交",
  verified: "已验证",
  archived: "已归档",
  blocked: "已阻断",
  failed: "失败",
  cancelled: "已取消"
};

const publishStageOrder: PublishStage[] = [
  "discovered", "eligible", "claimed", "preparing", "awaiting_confirmation",
  "submitted", "verified", "archived", "blocked", "failed", "cancelled"
];

const roleLabels: Record<string, string> = {
  "A&R trend planner": "趋势策划",
  "Narrative lyricist": "叙事词作",
  "Genre producer": "风格制作",
  "Dance producer": "律动制作"
};

const wawaStatusLabels: Record<WawaStatsStatus, string> = {
  success: "数据完整",
  partial: "部分可用",
  stale: "数据已过期",
  unavailable: "暂不可用"
};

const wawaMetricLabels: Record<WawaStatsMetricKey, string> = {
  bookCount: "作品数",
  chapterCount: "章节数",
  wordCount: "字数",
  revenue: "累计收益",
  dailyRevenue: "日收益",
  followers: "追读人数",
  followDelta: "追读增量"
};

function Icon({ kind }: { kind: "spark" | "activity" | "check" | "alert" | "audio" | "cover" | "refresh" | "book" | "coins" | "users" | "trend" }) {
  const paths = {
    spark: <><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
    activity: <><path d="M3 12h3l2-7 4 14 2-7h7"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    alert: <><path d="M12 4 3.5 19h17L12 4Z"/><path d="M12 10v4M12 17h.01"/></>,
    audio: <><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
    cover: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.4"/><path d="m4 17 5-5 3 3 2-2 6 5"/></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14-4L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14 4l2-2"/><path d="M20 20v-5h-5"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 5.5v16M8 7h8M8 11h8"/></>,
    coins: <><circle cx="8" cy="8" r="4"/><path d="M8 6v4M6.5 8h3"/><path d="M11 11a4 4 0 1 0 5-5"/><path d="M15 10v4M13.5 12h3"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.5a3 3 0 0 1 0 6M18 20a5 5 0 0 0-2.5-4.3"/></>,
    trend: <><path d="M3 17 9 11l4 4 8-9"/><path d="M16 6h5v5"/></>
  };
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}

function StatusPill({ status }: { status: RunStatus }) {
  return <span className={`status-pill status-${status}`}><i aria-hidden="true" />{statusLabels[status]}</span>;
}

function PublishStagePill({ stage }: { stage: PublishStage }) {
  return <span className={"publish-stage-pill publish-stage-" + stage}><i aria-hidden="true" />{publishStageLabels[stage]}</span>;
}

function PublishingOverview({ publishing }: { publishing: PublishingSnapshot }) {
  return <section className="panel publishing-panel" aria-labelledby="publishing-title">
    <div className="panel-heading"><div><span className="eyebrow">PUBLISHER SNAPSHOT</span><h2 id="publishing-title">四平台发布状态</h2><p>供应商无关的只读快照，不包含登录、上传或提交控制。</p></div><span className="contract-badge">CONTRACT {publishing.contractVersion}</span></div>
    <div className="publishing-totals" aria-label="发布总计">
      <div><span>候选</span><strong>{publishing.totals.candidates}</strong></div>
      <div><span>已认领</span><strong>{publishing.totals.claimed}</strong></div>
      <div><span>已准备</span><strong>{publishing.totals.prepared}</strong></div>
      <div><span>已阻断</span><strong className={publishing.totals.blocked ? "total-blocked" : ""}>{publishing.totals.blocked}</strong></div>
    </div>
    <div className="platform-grid">
      {publishing.platforms.map((platform) => <article className={"platform-card stage-" + platform.stage} key={platform.platform}>
        <div className="platform-card-head"><div><span className="platform-id">{platform.platform.toUpperCase()}</span><h3>{platform.displayName}</h3></div><PublishStagePill stage={platform.stage} /></div>
        <div className="platform-metrics"><div><span>候选</span><strong>{platform.candidateCount}</strong></div><div><span>认领</span><strong>{platform.claimedCount}</strong></div><div><span>准备</span><strong>{platform.preparedCount}</strong></div></div>
        <div className="platform-meta">{platform.manualActionRequired ? <span className="manual-badge">需要人工确认</span> : <span className="readonly-badge">只读快照</span>}<small>{platform.updatedAt.slice(11, 16)} 更新</small></div>
        {platform.blockerCodes.length > 0 && <div className="blocker-list" aria-label={platform.displayName + " 阻断错误码"}><span>阻断码</span>{platform.blockerCodes.map((code) => <code key={code}>{code}</code>)}</div>}
      </article>)}
    </div>
    <div className="publish-stage-legend" aria-label="发布状态契约"><span className="legend-label">阶段契约</span>{publishStageOrder.map((stage) => <span className={"publish-legend-item publish-stage-" + stage} key={stage}><i aria-hidden="true" />{publishStageLabels[stage]}</span>)}</div>
  </section>;
}

const wawaTrendMetricKeys: WawaStatsMetricKey[] = [
  "chapterCount",
  "wordCount",
  "revenue",
  "dailyRevenue",
  "followers",
  "followDelta"
];

const wawaMetricIcons: Record<WawaStatsMetricKey, Parameters<typeof Icon>[0]["kind"]> = {
  bookCount: "book",
  chapterCount: "book",
  wordCount: "activity",
  revenue: "coins",
  dailyRevenue: "coins",
  followers: "users",
  followDelta: "trend"
};

const wawaMetricTones: Record<WawaStatsMetricKey, string> = {
  bookCount: "blue",
  chapterCount: "blue",
  wordCount: "green",
  revenue: "amber",
  dailyRevenue: "amber",
  followers: "red",
  followDelta: "blue"
};

function formatWawaValue(key: WawaStatsMetricKey, value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const isMoney = key === "revenue" || key === "dailyRevenue";
  return `${new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: isMoney ? 2 : 0,
    maximumFractionDigits: isMoney ? 2 : 0
  }).format(value)}${isMoney ? " 元" : ""}`;
}

function WawaStatusPill({ status }: { status: WawaStatsStatus }) {
  return <span className={`wawa-status-pill wawa-status-${status}`}><i aria-hidden="true" />{wawaStatusLabels[status]}</span>;
}

function WawaTrendChart({ stats }: { stats: WawaStatsSnapshot }) {
  const points = stats.trend;
  const metrics = wawaTrendMetricKeys.filter((key) =>
    stats.availableMetrics.includes(key) || points.some((point) => typeof point[key] === "number")
  );

  if (stats.status === "unavailable" || !points.length || !metrics.length) {
    return <div className="wawa-trend-empty" role="status"><Icon kind="trend" /><strong>当前暂无趋势数据</strong><span>快照不可用或尚未提供可展示的指标。</span></div>;
  }

  return <div className="wawa-trend-chart" aria-label="蛙蛙统计趋势图">
    {metrics.map((key) => {
      const values = points.map((point) => point[key]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
      const maxValue = Math.max(...values, 1);
      const latest = points.at(-1)?.[key];
      return <div className="wawa-trend-row" key={key}>
        <span className="wawa-trend-label">{wawaMetricLabels[key]}</span>
        <div className="wawa-trend-bars">
          {points.map((point) => {
            const value = point[key];
            const numericValue = typeof value === "number" && Number.isFinite(value) ? value : null;
            return <span
              className={`wawa-trend-bar ${numericValue === null ? "wawa-trend-bar-empty" : "wawa-trend-bar-" + key}`}
              key={`${key}-${point.date}`}
              style={{ height: numericValue === null ? "0%" : `${Math.max((numericValue / maxValue) * 100, 4)}%` }}
              title={`${point.date} · ${wawaMetricLabels[key]}：${formatWawaValue(key, numericValue)}`}
            />;
          })}
        </div>
        <strong className="wawa-trend-latest">{formatWawaValue(key, latest)}</strong>
      </div>;
    })}
    <div className="wawa-trend-dates" aria-hidden="true"><span /><div>{points.map((point) => <small key={point.date}>{point.date}</small>)}</div><span /></div>
  </div>;
}

function WawaStatsOverview({ stats }: { stats: WawaStatsSnapshot }) {
  const cards: WawaStatsMetricKey[] = ["bookCount", "chapterCount", "wordCount", "revenue", "dailyRevenue", "followers", "followDelta"];
  const snapshotTime = stats.generatedAt.includes("T") ? stats.generatedAt.slice(11, 16) : stats.generatedAt;
  return <section className="panel wawa-panel" aria-labelledby="wawa-title">
    <div className="panel-heading"><div><span className="eyebrow">WAWA SIGNAL / AGGREGATE ONLY</span><h2 id="wawa-title">蛙蛙统计</h2><p>只读脱敏聚合快照，不含作品名称、远端标识、账号信息或操作权限。</p></div><span className="contract-badge">WAWA CONTRACT {stats.contractVersion}</span></div>
    <div className="wawa-status-strip" aria-label="蛙蛙统计快照状态">
      <WawaStatusPill status={stats.status} />
      <span>快照时间 {snapshotTime}</span>
      <span>观察窗口 {stats.range.days} 天</span>
    </div>
    <div className="wawa-kpi-grid" aria-label="蛙蛙聚合指标">
      {cards.map((key) => <article className={`wawa-kpi-card tone-${wawaMetricTones[key]}`} key={key}>
        <div className="wawa-kpi-icon"><Icon kind={wawaMetricIcons[key]} /></div>
        <div><span>{wawaMetricLabels[key]}</span><strong>{formatWawaValue(key, stats.totals[key])}</strong></div>
      </article>)}
    </div>
    <div className="wawa-trend-heading"><div><span className="eyebrow">DAILY SIGNAL / {stats.range.days} DAYS</span><h3>指标趋势</h3></div><span className="wawa-readonly-note">只读趋势</span></div>
    <WawaTrendChart stats={stats} />
    {stats.message && <p className={`wawa-message wawa-message-${stats.status}`}>{stats.message}</p>}
  </section>;
}

function Kpi({ label, value, hint, tone, icon }: { label: string; value: string | number; hint: string; tone: string; icon: Parameters<typeof Icon>[0]["kind"] }) {
  return <article className="kpi-card">
    <div className={`kpi-icon ${tone}`}><Icon kind={icon} /></div>
    <div className="kpi-copy"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>
  </article>;
}

function TrendChart({ snapshot }: { snapshot: DashboardSnapshot }) {
  const maxValue = Math.max(...snapshot.daily.map((point) => point.success + point.failed + point.interrupted), 1);
  return <div className="trend-chart" aria-label="每日流水线运行趋势">
    {snapshot.daily.map((point) => {
      const total = point.success + point.failed + point.interrupted;
      return <div className="trend-day" key={point.date}>
        <div className="trend-bars" title={`${point.date}：${total} 次运行`}>
          <span className="bar-success" style={{ height: `${(point.success / maxValue) * 100}%` }} />
          <span className="bar-failed" style={{ height: `${(point.failed / maxValue) * 100}%` }} />
          <span className="bar-interrupted" style={{ height: `${(point.interrupted / maxValue) * 100}%` }} />
        </div>
        <small>{point.date}</small>
      </div>;
    })}
  </div>;
}

function Pipeline({ snapshot }: { snapshot: DashboardSnapshot }) {
  const pipeline = snapshot.activePipeline;
  return <section className="panel pipeline-panel" aria-labelledby="pipeline-title">
    <div className="panel-heading"><div><span className="eyebrow">LIVE PIPELINE</span><h2 id="pipeline-title">当前生产链</h2><p>{pipeline.title} · 最近更新 {pipeline.updatedAt.slice(11, 16)}</p></div><StatusPill status={pipeline.status} /></div>
    <div className="pipeline-track">
      {pipeline.nodes.map((node, index) => <div className="pipeline-step" key={node.id}>
        <div className={`pipeline-node node-${node.status}`}><span>{index + 1}</span></div>
        <strong>{node.label}</strong>
        <small>{node.detail}</small>
        {index < pipeline.nodes.length - 1 && <span className={`pipeline-link ${node.status === "success" ? "link-ready" : ""}`} aria-hidden="true" />}
      </div>)}
    </div>
  </section>;
}

function SongTable({ songs, filter, onFilter }: { songs: SongRecord[]; filter: Filter; onFilter: (next: Filter) => void }) {
  const filtered = useMemo(() => filter === "all" ? songs : songs.filter((song) => song.status === filter), [filter, songs]);
  return <section className="panel song-panel" aria-labelledby="songs-title">
    <div className="panel-heading song-heading"><div><span className="eyebrow">RECENT OUTPUTS</span><h2 id="songs-title">最近作品</h2><p>演示数据仅用于展示界面，不代表真实作品或发行库存。</p></div><label className="filter-label">状态<select aria-label="按状态筛选" value={filter} onChange={(event) => onFilter(event.target.value as Filter)}><option value="all">全部</option><option value="success">成功</option><option value="running">运行中</option><option value="failed">失败</option><option value="interrupted">已中断</option></select></label></div>
    <div className="table-wrap"><table><thead><tr><th>作品</th><th>状态</th><th>角色</th><th>语言 / 风格</th><th>质量分</th><th>媒体</th></tr></thead><tbody>
      {filtered.map((song) => <tr key={song.runId}>
        <td><div className="song-name"><span className="cover-mark"><Icon kind="cover" /></span><div><strong>{song.title}</strong><small>{song.theme}</small></div></div></td>
        <td><StatusPill status={song.status} /></td>
        <td>{roleLabels[song.agentRole] || song.agentRole}</td>
        <td><span>{song.language}</span><small className="cell-subtitle">{song.style}</small></td>
        <td>{song.qualityScore ? <strong className="score">{song.qualityScore}</strong> : <span className="muted">—</span>}</td>
        <td><div className="media-state"><span className={song.hasAudio ? "ready" : "muted"} title={song.hasAudio ? "音频已就绪" : "暂无音频"}><Icon kind="audio" /></span><span className={song.hasCover ? "ready" : "muted"} title={song.hasCover ? "封面已就绪" : "暂无封面"}><Icon kind="cover" /></span></div></td>
      </tr>)}
      {!filtered.length && <tr><td className="empty-row" colSpan={6}>没有符合当前筛选条件的演示作品。</td></tr>}
    </tbody></table></div>
  </section>;
}

export function DashboardApp({ source = mockDataSource }: { source?: DashboardDataSource }) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try { setSnapshot(await source.getSnapshot()); } finally { setRefreshing(false); }
  };

  useEffect(() => { void load(); }, [source]);

  if (!snapshot) return <main className="loading-screen"><Icon kind="spark" /><p>正在载入演示数据…</p></main>;

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Icon kind="spark" /></span><div><strong>OpenCreator</strong><small>CONTENT PIPELINE DASHBOARD</small></div></div><div className="topbar-meta"><span className="mock-badge">MOCK DATA</span><button className="refresh-button" onClick={() => void load()} disabled={refreshing}><Icon kind="refresh" />{refreshing ? "刷新中" : "刷新"}</button></div></header>
    <main className="page-content">
      <section className="hero"><div><span className="eyebrow">CREATIVE OPERATIONS / MUSIC</span><h1>把创作过程变成<br /><em>可读的信号链</em></h1><p>一个轻量、可替换数据源的创作流水线观察台。先用 mock 开始，再接入你自己的系统。</p></div><div className="hero-stamp"><span>SNAPSHOT</span><strong>7 DAYS</strong><small>更新时间 {snapshot.generatedAt.slice(11, 16)}</small></div></section>
      <section className="kpi-grid" aria-label="关键指标">
        <Kpi label="总运行" value={snapshot.totals.runs} hint="演示窗口累计" tone="blue" icon="activity" />
        <Kpi label="成功率" value={`${snapshot.totals.successRate}%`} hint={`${snapshot.totals.success} 次完成`} tone="green" icon="check" />
        <Kpi label="异常运行" value={snapshot.totals.failed} hint={`当前运行 ${snapshot.totals.running} 次`} tone="red" icon="alert" />
        <Kpi label="媒体就绪" value={`${snapshot.totals.audioReadyRate}%`} hint={`封面就绪 ${snapshot.totals.coverReadyRate}%`} tone="amber" icon="audio" />
      </section>
      <div className="dashboard-grid"><section className="panel trend-panel" aria-labelledby="trend-title"><div className="panel-heading"><div><span className="eyebrow">RUN HISTORY</span><h2 id="trend-title">每日运行趋势</h2><p>成功、失败与中断的演示分布</p></div><div className="legend"><span><i className="legend-success" />成功</span><span><i className="legend-failed" />失败</span><span><i className="legend-interrupted" />中断</span></div></div><TrendChart snapshot={snapshot} /></section><section className="panel quality-panel" aria-labelledby="quality-title"><div className="panel-heading"><div><span className="eyebrow">QUALITY SIGNALS</span><h2 id="quality-title">质量信号</h2><p>面向适配器的最小指标集</p></div></div><div className="quality-ring" style={{ "--quality": `${snapshot.totals.successRate * 3.6}deg` } as CSSProperties}><div><strong>{snapshot.totals.successRate}%</strong><span>通过率</span></div></div><div className="quality-list"><div><span>音频可用</span><strong>{snapshot.totals.audioReadyRate}%</strong></div><div><span>封面可用</span><strong>{snapshot.totals.coverReadyRate}%</strong></div><div><span>活跃任务</span><strong>{snapshot.totals.running}</strong></div></div></section></div>
      <Pipeline snapshot={snapshot} />
      <PublishingOverview publishing={snapshot.publishing} />
      {snapshot.wawaStats && <WawaStatsOverview stats={snapshot.wawaStats} />}
      <SongTable songs={snapshot.songs} filter={filter} onFilter={setFilter} />
      <footer className="page-footer"><span>OpenCreator Dashboard · Apache-2.0</span><span>数据源：本地 mock fixture · 不会读取外部文件或服务</span></footer>
    </main>
  </div>;
}
