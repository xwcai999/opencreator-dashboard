import { useEffect, useMemo, useState } from "react";
import type {
  DashboardDataSource,
  WawaActionResult,
  WawaSubmissionAction,
  WawaSubmissionActionRequest,
  WawaSubmissionPackageView,
  WawaSubmissionRunView,
  WawaSubmissionView
} from "./contracts";

const PAGE_SIZE = 10;

const actionLabels: Record<WawaSubmissionAction, string> = {
  "dry-run": "预检",
  prepare: "预填页面",
  login: "打开登录",
  cancel: "结束运行",
  confirm: "标记已投稿",
  unconfirm: "撤销投稿标记"
};

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(parsed);
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function PackageStatus({ item }: { item: WawaSubmissionPackageView }) {
  if (item.submitted) return <span className="wawa-submission-status submitted">已人工标记投稿</span>;
  if (item.preflight.ok) return <span className="wawa-submission-status ready">预检通过</span>;
  return <span className="wawa-submission-status blocked">存在阻断项</span>;
}

function PreflightSummary({ item }: { item: WawaSubmissionPackageView }) {
  const notes = [
    ...item.preflight.blockers.map((value) => ({ tone: "blocked", label: `阻断：${value}` })),
    ...item.preflight.errors.map((value) => ({ tone: "blocked", label: `错误：${value}` })),
    ...item.preflight.warnings.map((value) => ({ tone: "warning", label: `提示：${value}` }))
  ];

  if (!notes.length) return <p className="wawa-submission-preflight ready">预检无阻断项，可继续人工确认后预填页面。</p>;
  return <ul className="wawa-submission-notes" aria-label={`${item.title} 的预检结果`}>
    {notes.map((note, index) => <li className={note.tone} key={`${note.label}-${index}`}>{note.label}</li>)}
  </ul>;
}

function PackageDetails({ item }: { item: WawaSubmissionPackageView }) {
  return <details className="wawa-submission-details">
    <summary>查看投稿材料与分类</summary>
    <dl>
      <div><dt>笔名</dt><dd>{item.penName || "待确认"}</dd></div>
      <div><dt>频道</dt><dd>{item.channel || "待确认"}</dd></div>
      <div><dt>分类</dt><dd>{item.categories.join(" / ") || "待确认"}</dd></div>
      <div><dt>标签</dt><dd>{item.tags.join("、") || "未设置"}</dd></div>
      <div><dt>正文</dt><dd>{item.manuscript.fileName} · {formatBytes(item.manuscript.sizeBytes)}{item.manuscript.wordCount ? ` · ${item.manuscript.wordCount.toLocaleString("zh-CN")} 字` : ""}</dd></div>
      <div><dt>封面</dt><dd>{item.cover.fileName} · {formatBytes(item.cover.sizeBytes)}</dd></div>
      <div><dt>本地预检字数</dt><dd>{item.preflight.wordCount.toLocaleString("zh-CN")} 字</dd></div>
    </dl>
  </details>;
}

interface PackageCardProps {
  item: WawaSubmissionPackageView;
  campaignCode?: string;
  actionsEnabled: boolean;
  runningAction?: string;
  onAction: (request: WawaSubmissionActionRequest) => void;
}

function PackageCard({ item, campaignCode, actionsEnabled, runningAction, onAction }: PackageCardProps) {
  const actionPending = Boolean(runningAction);
  const disabled = !actionsEnabled || actionPending;
  const requestFor = (action: "dry-run" | "prepare"): WawaSubmissionActionRequest => campaignCode
    ? { action, bookKey: item.bookKey, campaignCode }
    : { action, bookKey: item.bookKey };

  return <article className="wawa-submission-card" aria-labelledby={`wawa-package-${item.bookKey}`}>
    <div className="wawa-submission-card-heading">
      <div>
        <span className="eyebrow">创建于 {formatDateTime(item.createdAt)}</span>
        <h3 id={`wawa-package-${item.bookKey}`}>{item.title}</h3>
        <p>{item.summary}</p>
      </div>
      <PackageStatus item={item} />
    </div>
    <div className="wawa-submission-card-meta">
      <span>{item.status || "待投稿"}</span>
      {item.submittedAt && <span>标记时间 {formatDateTime(item.submittedAt)}</span>}
    </div>
    <PreflightSummary item={item} />
    <PackageDetails item={item} />
    <div className="wawa-submission-actions" aria-label={`${item.title} 的操作`}>
      <button type="button" onClick={() => onAction(requestFor("dry-run"))} disabled={disabled}>
        {runningAction === "dry-run" ? "预检中…" : "预检"}
      </button>
      <button type="button" onClick={() => onAction(requestFor("prepare"))} disabled={disabled || !item.canPrepare || item.submitted}>
        {runningAction === "prepare" ? "预填中…" : "预填页面"}
      </button>
      {item.submitted ? (
        <button type="button" className="secondary" onClick={() => onAction({ action: "unconfirm", bookKey: item.bookKey })} disabled={disabled}>
          {runningAction === "unconfirm" ? "处理中…" : "撤销投稿标记"}
        </button>
      ) : (
        <button type="button" className="secondary" onClick={() => onAction({ action: "confirm", bookKey: item.bookKey })} disabled={disabled}>
          {runningAction === "confirm" ? "处理中…" : "标记已投稿"}
        </button>
      )}
    </div>
  </article>;
}

interface RunHistoryProps {
  runs: WawaSubmissionRunView[];
  actionsEnabled: boolean;
  runningAction?: string;
  onAction: (request: WawaSubmissionActionRequest) => void;
}

function RunHistory({ runs, actionsEnabled, runningAction, onAction }: RunHistoryProps) {
  const recentRuns = useMemo(() => runs.slice(0, 10), [runs]);
  return <section className="panel wawa-submission-history" aria-labelledby="wawa-submission-history-title">
    <div className="panel-heading"><div><span className="eyebrow">RECENT EXECUTION HISTORY</span><h2 id="wawa-submission-history-title">投稿运行历史</h2><p>仅保留最近 10 条记录；最终提交仍需在蛙蛙页面人工完成。</p></div><span className="contract-badge">最近 {recentRuns.length} 条</span></div>
    {!recentRuns.length ? <p className="wawa-submission-empty">暂无投稿运行记录。</p> : <ol className="wawa-submission-run-list">
      {recentRuns.map((run) => <li key={run.runId}>
        <div><strong>{run.title || actionLabels[run.action]}</strong><span>{actionLabels[run.action]} · {run.status} · {formatDateTime(run.updatedAt || run.createdAt)}</span><p>{run.message}</p>{run.blockers.length > 0 && <small>阻断：{run.blockers.join("；")}</small>}{run.warnings.length > 0 && <small>提示：{run.warnings.join("；")}</small>}</div>
        {run.canCancel && <button type="button" className="secondary" disabled={!actionsEnabled || Boolean(runningAction)} onClick={() => onAction({ action: "cancel", runId: run.runId })}>{runningAction === "cancel" ? "结束中…" : "结束运行"}</button>}
      </li>)}
    </ol>}
  </section>;
}

export function WawaSubmissionPage({ source }: { source: DashboardDataSource }) {
  const [view, setView] = useState<WawaSubmissionView | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<WawaSubmissionAction | undefined>();
  const canLoad = Boolean(source.getWawaSubmission);
  const actionsEnabled = Boolean(source.capabilities?.wawaSubmissionActions && source.runWawaSubmissionAction);

  const load = async (requestedPage: number) => {
    if (!source.getWawaSubmission) {
      setLoading(false);
      setError("当前数据源未配置蛙蛙投稿读取能力。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nextView = await source.getWawaSubmission(requestedPage, PAGE_SIZE);
      setView(nextView);
      setPage(nextView.page);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "蛙蛙投稿数据暂时无法读取。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(1); }, [source]);

  const runAction = async (request: WawaSubmissionActionRequest) => {
    if (!source.runWawaSubmissionAction || !actionsEnabled) return;
    setRunningAction(request.action);
    setNotice(null);
    setError(null);
    try {
      const result: WawaActionResult = await source.runWawaSubmissionAction(request);
      setNotice(result.message || `${actionLabels[request.action]}已完成。`);
      await load(page);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `${actionLabels[request.action]}失败，请稍后重试。`);
    } finally {
      setRunningAction(undefined);
    }
  };

  if (!canLoad && !loading) return <section className="panel wawa-submission-panel"><h1>蛙蛙投稿</h1><p role="alert">{error}</p></section>;

  return <section className="wawa-submission-page" aria-labelledby="wawa-submission-title">
    <div className="wawa-submission-page-heading">
      <div><span className="eyebrow">WAWA WRITER / HUMAN CONFIRMATION REQUIRED</span><h1 id="wawa-submission-title">蛙蛙投稿</h1><p>按创建时间倒序查看待投稿材料。预填仅到最终提交前，最终投稿必须由你在蛙蛙页面亲自完成。</p></div>
      <button type="button" onClick={() => void load(page)} disabled={loading} aria-label="刷新蛙蛙投稿队列">{loading ? "刷新中…" : "刷新队列"}</button>
    </div>
    {!actionsEnabled && <p className="wawa-submission-capability-note" role="status">当前为展示模式；需启用本地执行器后，才能预检、登录、预填、结束运行或修改人工投稿标记。</p>}
    {actionsEnabled && <div className="wawa-submission-global-actions"><button type="button" onClick={() => void runAction({ action: "login" })} disabled={Boolean(runningAction)}>{runningAction === "login" ? "打开中…" : "打开登录"}</button>{view?.campaignName && <span>当前活动：{view.campaignName}{view.campaignCode ? `（${view.campaignCode}）` : ""}</span>}</div>}
    {notice && <p className="wawa-submission-notice" role="status">{notice}</p>}
    {error && <p className="wawa-submission-error" role="alert">{error}</p>}
    <section className="panel wawa-submission-queue" aria-labelledby="wawa-submission-queue-title">
      <div className="panel-heading"><div><span className="eyebrow">SUBMISSION QUEUE / {PAGE_SIZE} PER PAGE</span><h2 id="wawa-submission-queue-title">待投稿文件</h2><p>{view ? `共 ${view.total} 篇，按创建时间倒序。` : "正在读取投稿材料…"}</p></div>{view && <span className="contract-badge">第 {view.page} / {view.totalPages || 1} 页</span>}</div>
      {loading && !view ? <p className="wawa-submission-empty" role="status">正在读取投稿材料…</p> : null}
      {!loading && view?.items.length === 0 ? <p className="wawa-submission-empty">当前没有待展示的投稿材料。</p> : null}
      {view?.items.map((item) => <PackageCard item={item} key={item.bookKey} campaignCode={view.campaignCode} actionsEnabled={actionsEnabled} runningAction={runningAction} onAction={(request) => void runAction(request)} />)}
      {view && view.totalPages > 1 && <nav className="wawa-submission-pagination" aria-label="待投稿文件分页"><button type="button" onClick={() => void load(page - 1)} disabled={loading || page <= 1}>上一页</button><span>第 {page} / {view.totalPages} 页</span><button type="button" onClick={() => void load(page + 1)} disabled={loading || page >= view.totalPages}>下一页</button></nav>}
    </section>
    <RunHistory runs={view?.runs ?? []} actionsEnabled={actionsEnabled} runningAction={runningAction} onAction={(request) => void runAction(request)} />
  </section>;
}
