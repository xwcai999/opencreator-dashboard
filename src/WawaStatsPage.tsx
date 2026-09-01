import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DashboardDataSource,
  WawaBookMetrics,
  WawaMetricsDays,
  WawaMetricsView,
  WawaStatsMetricKey
} from "./contracts";

const rangeOptions: Array<{ value: WawaMetricsDays; label: string }> = [
  { value: "all", label: "累计" },
  { value: 1, label: "1 天" },
  { value: 3, label: "3 天" },
  { value: 7, label: "7 天" },
  { value: 30, label: "30 天" },
  { value: 90, label: "90 天" }
];

type TrendMetricKey = Exclude<WawaStatsMetricKey, "bookCount">;

const metricKeys: TrendMetricKey[] = [
  "chapterCount",
  "wordCount",
  "revenue",
  "dailyRevenue",
  "followers",
  "followDelta"
];

const metricLabels: Record<WawaStatsMetricKey, string> = {
  bookCount: "作品数",
  chapterCount: "章节数",
  wordCount: "字数",
  revenue: "累计收益",
  dailyRevenue: "日收益",
  followers: "追读人数",
  followDelta: "追读日增"
};

const metricCardKeys: WawaStatsMetricKey[] = [
  "bookCount",
  "chapterCount",
  "wordCount",
  "revenue",
  "dailyRevenue",
  "followers",
  "followDelta"
];

type CompletionFilter = "all" | "finished" | "ongoing" | "unknown";

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatValue(key: WawaStatsMetricKey, value: number | null | undefined) {
  if (!isNumber(value)) return "—";
  const money = key === "revenue" || key === "dailyRevenue";
  return `${new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: money ? 2 : 0,
    maximumFractionDigits: money ? 2 : 0
  }).format(value)}${money ? " 元" : ""}`;
}

function formatTime(value?: string) {
  if (!value) return "尚未同步";
  return value.replace("T", " ").slice(0, 16);
}

function completionLabel(book: WawaBookMetrics) {
  if (book.isFinished === true) return "已完结";
  if (book.isFinished === false) return "连载中";
  return "状态未知";
}

function aggregateSeries(view: WawaMetricsView, includedBookKeys: Set<string>) {
  const byDate = new Map<string, Record<TrendMetricKey, number | null>>();
  for (const point of view.series) {
    if (!includedBookKeys.has(point.bookKey)) continue;
    const row = byDate.get(point.date) ?? {
      chapterCount: null,
      wordCount: null,
      revenue: null,
      dailyRevenue: null,
      followers: null,
      followDelta: null
    };
    for (const key of metricKeys) {
      const value = point[key];
      if (isNumber(value)) row[key] = (row[key] ?? 0) + value;
    }
    byDate.set(point.date, row);
  }
  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, values]) => ({ date, ...values }));
}

function TrendChart({
  series,
  visibleMetrics,
  onToggle
}: {
  series: Array<{ date: string } & Record<TrendMetricKey, number | null>>;
  visibleMetrics: TrendMetricKey[];
  onToggle: (key: TrendMetricKey) => void;
}) {
  return <section className="panel" aria-labelledby="wawa-trend-title">
    <div className="panel-heading song-heading">
      <div><span className="eyebrow">BOOK SIGNALS</span><h2 id="wawa-trend-title">作品趋势</h2><p>筛选会影响趋势与作品表；至少保留一条指标线。</p></div>
      <fieldset className="filter-label" aria-label="趋势指标显示">
        <legend>显示指标</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {metricKeys.map((key) => {
            const checked = visibleMetrics.includes(key);
            return <label key={key} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <input
                type="checkbox"
                checked={checked}
                disabled={checked && visibleMetrics.length === 1}
                onChange={() => onToggle(key)}
              />
              {metricLabels[key]}
            </label>;
          })}
        </div>
      </fieldset>
    </div>
    {!series.length ? <div className="wawa-trend-empty" role="status"><strong>当前筛选下暂无趋势数据</strong><span>可调整作品、频道或完结状态后重试。</span></div> : <div className="wawa-trend-chart" aria-label="蛙蛙作品趋势图">
      {visibleMetrics.map((key) => {
        const values = series.map((point) => point[key]).filter(isNumber);
        const max = Math.max(...values, 1);
        return <div className="wawa-trend-row" key={key}>
          <span className="wawa-trend-label">{metricLabels[key]}</span>
          <div className="wawa-trend-bars">
            {series.map((point) => {
              const value = point[key];
              return <span
                className={`wawa-trend-bar ${isNumber(value) ? `wawa-trend-bar-${key}` : "wawa-trend-bar-empty"}`}
                key={`${key}-${point.date}`}
                style={{ height: isNumber(value) ? `${Math.max(4, (value / max) * 100)}%` : "0%" }}
                title={`${point.date} · ${metricLabels[key]}：${formatValue(key, value)}`}
              />;
            })}
          </div>
          <strong className="wawa-trend-latest">{formatValue(key, series.at(-1)?.[key])}</strong>
        </div>;
      })}
      <div className="wawa-trend-dates" aria-hidden="true"><span /><div>{series.map((point) => <small key={point.date}>{point.date}</small>)}</div><span /></div>
    </div>}
  </section>;
}

export function WawaStatsPage({ source }: { source: DashboardDataSource }) {
  const [days, setDays] = useState<WawaMetricsDays>("all");
  const [view, setView] = useState<WawaMetricsView | null>(null);
  const [selectedBook, setSelectedBook] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [completion, setCompletion] = useState<CompletionFilter>("all");
  const [visibleMetrics, setVisibleMetrics] = useState<TrendMetricKey[]>(["revenue", "dailyRevenue", "followers"]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<string>();
  const requestId = useRef(0);

  const load = useCallback(async (nextDays: WawaMetricsDays) => {
    const currentRequest = ++requestId.current;
    if (!source.getWawaMetrics) {
      if (currentRequest === requestId.current) {
        setView(null);
        setNotice("当前数据源未提供蛙蛙统计能力。");
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const nextView = await source.getWawaMetrics(nextDays);
      if (currentRequest === requestId.current) {
        setView(nextView);
        setNotice(nextView.message);
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        setView(null);
        setNotice(error instanceof Error ? error.message : "蛙蛙统计暂时无法读取。");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [source]);

  useEffect(() => { void load(days); }, [days, load]);

  const channels = useMemo(() => [...new Set(view?.books.map((book) => book.channel).filter((value): value is string => Boolean(value)))].sort(), [view]);
  const filteredBooks = useMemo(() => (view?.books ?? []).filter((book) => {
    if (selectedBook !== "all" && book.bookKey !== selectedBook) return false;
    if (selectedChannel !== "all" && book.channel !== selectedChannel) return false;
    if (completion === "finished") return book.isFinished === true;
    if (completion === "ongoing") return book.isFinished === false;
    if (completion === "unknown") return book.isFinished === null || book.isFinished === undefined;
    return true;
  }), [completion, selectedBook, selectedChannel, view]);
  const includedBookKeys = useMemo(() => new Set(filteredBooks.map((book) => book.bookKey)), [filteredBooks]);
  const highlights = useMemo(() => {
    const highest = (key: "dailyRevenue" | "revenue" | "followers") => filteredBooks.reduce<WawaBookMetrics | undefined>((best, book) => {
      if (!best) return book;
      return (book.latest[key] ?? -Infinity) > (best.latest[key] ?? -Infinity) ? book : best;
    }, undefined);
    return [
      { label: "日收益最高", key: "dailyRevenue" as const, book: highest("dailyRevenue") },
      { label: "累计收益最高", key: "revenue" as const, book: highest("revenue") },
      { label: "追读最多", key: "followers" as const, book: highest("followers") }
    ];
  }, [filteredBooks]);
  const series = useMemo(() => view ? aggregateSeries(view, includedBookKeys) : [], [includedBookKeys, view]);
  const availableMetricSet = useMemo(() => new Set(view?.availableMetrics ?? []), [view]);
  const shownMetrics = useMemo(() => visibleMetrics.filter((key) => availableMetricSet.size === 0 || availableMetricSet.has(key) || series.some((point) => isNumber(point[key]))), [availableMetricSet, series, visibleMetrics]);
  const effectiveVisibleMetrics: TrendMetricKey[] = shownMetrics.length ? shownMetrics : ["revenue"];
  const canSync = Boolean(source.capabilities?.wawaMetricsSync && source.syncWawaMetrics);

  const toggleMetric = (key: TrendMetricKey) => {
    setVisibleMetrics((current) => {
      if (current.includes(key)) return current.length === 1 ? current : current.filter((item) => item !== key);
      return [...current, key];
    });
  };

  const sync = async () => {
    if (!canSync || !source.syncWawaMetrics) return;
    setSyncing(true);
    try {
      const result = await source.syncWawaMetrics();
      setNotice(result.message);
      await load(days);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "同步失败，请稍后重试。");
    } finally {
      setSyncing(false);
    }
  };

  return <main className="page-content" aria-busy={loading}>
    <section className="hero" style={{ paddingBottom: 22 }}>
      <div><span className="eyebrow">WAWA SIGNAL / BOOK METRICS</span><h1 style={{ fontSize: "clamp(34px, 4vw, 52px)" }}>蛙蛙数据</h1><p>按作品查看收益、追读与创作进度。页面只通过数据源读取，默认不会自行发起网络请求。</p></div>
      <div className="hero-stamp"><span>{view?.summary.mode === "period" ? "PERIOD" : "ALL TIME"}</span><strong>{days === "all" ? "累计" : `${days} 天`}</strong><small>更新于 {formatTime(view?.updatedAt)}</small></div>
    </section>

    <section className="panel" aria-label="蛙蛙数据筛选条件" style={{ marginBottom: 12, padding: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", justifyContent: "space-between", gap: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} aria-label="统计范围">
          {rangeOptions.map((option) => <button
            className="refresh-button"
            key={String(option.value)}
            aria-pressed={days === option.value}
            onClick={() => setDays(option.value)}
            disabled={loading && days === option.value}
            style={days === option.value ? { background: "var(--teal)", borderColor: "var(--teal)", color: "#fff" } : { color: "var(--ink)" }}
          >{option.label}</button>)}
        </div>
        <button className="refresh-button" onClick={() => void sync()} disabled={!canSync || syncing} title={canSync ? "从已配置的数据源同步" : "当前数据源未开启同步权限"} style={{ color: "var(--ink)" }}>
          {syncing ? "同步中…" : "手动同步"}
        </button>
      </div>
      {!canSync && <p className="wawa-message wawa-message-stale" style={{ margin: "12px 0 0" }}>当前数据源未开启同步权限；仍可查看已提供的统计快照。</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
        <label className="filter-label">作品<select aria-label="按作品筛选" value={selectedBook} onChange={(event) => setSelectedBook(event.target.value)}><option value="all">全部作品</option>{view?.books.map((book) => <option key={book.bookKey} value={book.bookKey}>{book.title}</option>)}</select></label>
        <label className="filter-label">频道<select aria-label="按频道筛选" value={selectedChannel} onChange={(event) => setSelectedChannel(event.target.value)}><option value="all">全部频道</option>{channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}</select></label>
        <label className="filter-label">完结状态<select aria-label="按完结状态筛选" value={completion} onChange={(event) => setCompletion(event.target.value as CompletionFilter)}><option value="all">全部状态</option><option value="ongoing">连载中</option><option value="finished">已完结</option><option value="unknown">状态未知</option></select></label>
      </div>
    </section>

    {notice && <p className="wawa-message wawa-message-success" role="status">{notice}</p>}
    {loading && !view ? <div className="wawa-trend-empty" role="status"><strong>正在载入蛙蛙数据…</strong></div> : view ? <>
      <section className="wawa-highlight-grid" aria-label="蛙蛙领先作品">
        {highlights.map(({ label, key, book }) => <article className="wawa-highlight-card" key={label}><span>{label}</span><strong>{book?.title || "—"}</strong><small>{book ? formatValue(key, book.latest[key]) : "当前筛选无作品"}</small></article>)}
      </section>
      <section className="wawa-kpi-grid" aria-label="蛙蛙指标卡" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", marginLeft: 0, marginRight: 0 }}>
        {metricCardKeys.map((key) => <article className="wawa-kpi-card tone-blue" key={key}>
          <div><span>{metricLabels[key]}</span><strong>{formatValue(key, view.summary[key])}</strong></div>
        </article>)}
      </section>
      <p className="wawa-account-summary-note">以上指标卡为当前时间范围的账户汇总，不受下方作品明细筛选影响；领先作品、趋势和明细按当前筛选更新。</p>
      <TrendChart series={series} visibleMetrics={effectiveVisibleMetrics} onToggle={toggleMetric} />
      <section className="panel song-panel" aria-labelledby="wawa-books-title" style={{ marginTop: 12 }}>
        <div className="panel-heading"><div><span className="eyebrow">BOOK BREAKDOWN</span><h2 id="wawa-books-title">作品明细</h2><p>共 {filteredBooks.length} 本符合当前筛选。</p></div><span className="wawa-readonly-note">范围汇总：{view.summary.mode === "period" ? "期间" : "累计"}</span></div>
        <div className="table-wrap"><table><thead><tr><th>作品</th><th>频道 / 状态</th><th>章节</th><th>字数</th><th>累计收益</th><th>日收益</th><th>追读</th><th>更新时间</th></tr></thead><tbody>
          {filteredBooks.map((book) => <tr key={book.bookKey}><td><strong>{book.title}</strong><small className="cell-subtitle">{book.categories?.join(" / ") || "未分类"}</small></td><td><span>{book.channel || "未标注"}</span><small className="cell-subtitle">{completionLabel(book)}</small></td><td>{formatValue("chapterCount", book.latest.chapterCount)}</td><td>{formatValue("wordCount", book.latest.wordCount)}</td><td>{formatValue("revenue", book.latest.revenue)}</td><td>{formatValue("dailyRevenue", book.latest.dailyRevenue)}</td><td>{formatValue("followers", book.latest.followers)}</td><td>{formatTime(book.updatedAt)}</td></tr>)}
          {!filteredBooks.length && <tr><td className="empty-row" colSpan={8}>没有符合当前筛选条件的作品。</td></tr>}
        </tbody></table></div>
      </section>
    </> : <div className="wawa-trend-empty" role="status"><strong>蛙蛙数据暂不可用</strong><span>{notice || "请确认数据源已配置。"}</span></div>}
  </main>;
}
