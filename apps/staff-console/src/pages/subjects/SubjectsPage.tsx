import { useState } from 'react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../../store/StoreProvider';
import { dayDiff, md } from '../../domain/time';
import type { Subject, SubjectStatus, SubjectVisitRecord } from '../../domain/types';
import { Avatar, Badge, Card, PageHeader, Segmented, cx } from '../../ui/kit';
import { toneGradient } from '../../ui/tone';
import type { Intent } from '../../ui/tone';

const STATUS: Record<SubjectStatus, { label: string; intent: Intent }> = {
  prospect: { label: '待筛选', intent: 'neutral' },
  screening: { label: '筛选中', intent: 'info' },
  enrolled: { label: '已入组', intent: 'ok' },
  screen_failed: { label: '筛败', intent: 'bad' },
  withdrawn: { label: '已退出', intent: 'neutral' },
  completed: { label: '已完成', intent: 'violet' },
};

export function SubjectsPage() {
  const { data } = useStore();
  const [pid, setPid] = useState(data.projects[0]!.id);
  const project = data.projects.find((p) => p.id === pid)!;
  const subjects = data.subjects.filter((s) => s.projectId === pid);

  return (
    <div className="animate-[rise_.35s_ease]">
      <PageHeader
        title="项目与受试者"
        sub="跨访视看每个人走到哪里、窗口还剩几天"
        right={<Segmented value={pid} onChange={setPid} options={data.projects.map((p) => ({ value: p.id, label: p.id }))} />}
      />
      <div className="mb-5 grid grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)] gap-5" {...tourAnchor('subj-funnel')}>
        <div className={cx('relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-[0_20px_40px_-20px_rgba(15,23,42,.6)]', toneGradient[project.tone])}>
          <div className="pointer-events-none absolute -right-10 -bottom-16 size-56 rounded-full bg-white/15 blur-2xl" />
          <div className="text-[12px] opacity-80">
            {project.id} · {project.sponsor} · {project.blind === 'double' ? '双盲' : project.blind === 'single' ? '单盲' : '开放'}
          </div>
          <div className="mt-1 text-[20px] font-semibold tracking-tight">{project.name}</div>
          <div className="mt-1 text-[12.5px] opacity-85">
            试验产品：{project.product} · PI {project.pi}
          </div>
          <div className="mt-5 flex gap-2">
            {project.visitPlan.map((v) => (
              <div key={v.code} className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
                <div className="text-[13px] font-semibold">{v.code}</div>
                <div className="text-[11px] opacity-85">
                  D{v.day}
                  {v.plus ? ` ±${v.plus}` : ''} · {v.name}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Card className="grid grid-cols-3 divide-x divide-slate-100 p-0">
          {[
            ['目标例数', project.targetN, '方案要求'],
            ['已筛选', project.screenedN, `筛选成功率 ${Math.round((project.enrolledN / Math.max(1, project.screenedN)) * 100)}%`],
            ['已入组', project.enrolledN, `完成 ${Math.round((project.enrolledN / project.targetN) * 100)}%`],
          ].map(([l, v, sub]) => (
            <div key={l} className="flex flex-col justify-center p-6">
              <div className="text-[12.5px] text-slate-500">{l}</div>
              <div className="mt-1 text-[34px] font-semibold tracking-tight tabular-nums text-slate-900">{v}</div>
              <div className="text-[12px] text-slate-400">{sub}</div>
              {l === '已入组' && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={cx('h-full rounded-full bg-gradient-to-r', toneGradient[project.tone])} style={{ width: `${(project.enrolledN / project.targetN) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>

      <Card {...tourAnchor('subj-table')}>
        <div className="grid grid-cols-[minmax(200px,1fr)_100px_110px_minmax(420px,2.4fr)] gap-4 border-b border-slate-100 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          <div>受试者</div>
          <div>状态</div>
          <div>编号</div>
          <div>访视进度</div>
        </div>
        <div className="divide-y divide-slate-100">
          {subjects.map((s) => (
            <Row key={s.id} s={s} planLen={project.visitPlan.length} today={data.site.today} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function Row({ s, planLen, today }: { s: Subject; planLen: number; today: string }) {
  const visits: SubjectVisitRecord[] = Array.from({ length: planLen }, (_, i) => s.visits[i] ?? { code: `V${i + 1}`, state: 'planned' });
  return (
    <div className="grid grid-cols-[minmax(200px,1fr)_100px_110px_minmax(420px,2.4fr)] items-center gap-4 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <Avatar name={s.name} hue={s.hue} size={34} />
        <div>
          <div className="text-[14px] font-medium text-slate-900">{s.name}</div>
          <div className="text-[11.5px] text-slate-500">
            {s.gender} · {s.age} · {s.skinType}
          </div>
        </div>
      </div>
      <div>
        <Badge intent={STATUS[s.status].intent} dot>
          {STATUS[s.status].label}
        </Badge>
      </div>
      <div className="font-mono text-[12px] text-slate-600">
        <div>{s.sc}</div>
        {s.rd && <div className="text-teal-700">{s.rd}</div>}
      </div>
      <div className="flex items-center">
        {visits.map((v, i) => (
          <div key={v.code} className="flex flex-1 items-center">
            <VisitNode v={v} today={today} />
            {i < visits.length - 1 && <div className={cx('mx-1 h-[2px] flex-1 rounded-full', v.state === 'done' ? 'bg-emerald-300' : 'bg-slate-200')} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function VisitNode({ v, today }: { v: SubjectVisitRecord; today: string }) {
  const edge = v.windowEnd && v.state !== 'done' && dayDiff(today, v.windowEnd) <= 1 && dayDiff(today, v.windowEnd) >= 0;
  const cls =
    v.state === 'done'
      ? 'bg-emerald-500 text-white ring-emerald-500'
      : v.state === 'today'
        ? 'bg-teal-600 text-white ring-4 ring-teal-500/20'
        : v.state === 'missed'
          ? 'bg-rose-500 text-white ring-rose-500'
          : v.state === 'skipped'
            ? 'bg-slate-100 text-slate-300 ring-slate-200'
            : edge
              ? 'bg-amber-50 text-amber-700 ring-amber-300'
              : 'bg-white text-slate-500 ring-slate-200';
  return (
    <div className="flex min-w-[88px] flex-col items-center">
      <div className={cx('grid size-9 place-items-center rounded-full text-[12px] font-semibold ring-1', cls)}>{v.code}</div>
      <div className="mt-1 text-center text-[11px] leading-tight text-slate-500">
        {v.date ? md(v.date) : v.state === 'skipped' ? '—' : '未约'}
        {v.state === 'today' && <span className="ml-1 text-teal-700">今天</span>}
        {v.state === 'missed' && <span className="ml-1 text-rose-600">缺席</span>}
      </div>
      {v.windowStart && v.windowEnd && v.state !== 'done' && (
        <div className={cx('text-[10.5px] tabular-nums', edge ? 'text-amber-600' : 'text-slate-400')}>
          窗 {md(v.windowStart)}–{md(v.windowEnd)}
        </div>
      )}
    </div>
  );
}
