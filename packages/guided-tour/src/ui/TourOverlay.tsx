import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { ActiveTour } from '../core/machine';
import { inflate, placePopover, sameRect, type Rect, type Size } from '../core/geometry';
import type { TourLabels } from '../core/types';
import type { TargetResolver } from '../adapters/targetResolver';

interface Props {
  active: ActiveTour;
  resolver: TargetResolver;
  root: HTMLElement;
  scoped: boolean;
  labels: TourLabels;
  onNext(): void;
  onPrev(): void;
  onSkip(): void;
}

/** 把 **加粗** 渲染成 <strong> */
function rich(text: string): ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>));
}

export function TourOverlay({ active, resolver, root, scoped, labels, onNext, onPrev, onSkip }: Props) {
  const { step, tour, index, total, isFirst, isLast } = active;
  const clickThrough = step.advanceOn === 'targetClick';

  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [resolving, setResolving] = useState(Boolean(step.target));
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [popSize, setPopSize] = useState<Size>({ width: 360, height: 200 });
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setTarget(null);
    setRect(null);
    if (!step.target) {
      setResolving(false);
      return;
    }
    setResolving(true);
    resolver.waitFor(step.target, { root: scoped ? root : document }).then((el) => {
      if (cancelled) return;
      setResolving(false);
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        setTarget(el);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [step.id, step.target, resolver, root, scoped]);

  // 每帧测量：兼容滚动、动画、布局变化与容器缩放
  useLayoutEffect(() => {
    let raf = 0;
    const tick = () => {
      let baseTop = 0;
      let baseLeft = 0;
      let scale = 1;
      let vp: Size = { width: window.innerWidth, height: window.innerHeight };
      if (scoped) {
        const b = root.getBoundingClientRect();
        scale = root.offsetWidth ? b.width / root.offsetWidth : 1;
        baseTop = b.top;
        baseLeft = b.left;
        vp = { width: root.offsetWidth, height: root.offsetHeight };
      }
      setViewport((p) => (p.width === vp.width && p.height === vp.height ? p : vp));
      if (target && target.isConnected) {
        const r = target.getBoundingClientRect();
        const next: Rect | null =
          r.width === 0 && r.height === 0
            ? null
            : {
                top: (r.top - baseTop) / scale,
                left: (r.left - baseLeft) / scale,
                width: r.width / scale,
                height: r.height / scale,
              };
        setRect((p) => (sameRect(p, next) ? p : next));
      }
      const el = popRef.current;
      if (el) {
        const s = { width: el.offsetWidth, height: el.offsetHeight };
        setPopSize((p) => (p.width === s.width && p.height === s.height ? p : s));
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [target, root, scoped]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
      else if (e.key === 'ArrowRight' && !clickThrough) onNext();
      else if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onPrev, onSkip, clickThrough]);

  useEffect(() => {
    if (!clickThrough || !target) return;
    const handler = () => window.setTimeout(onNext, 0);
    target.addEventListener('click', handler, { once: true });
    return () => target.removeEventListener('click', handler);
  }, [clickThrough, target, onNext]);

  const hole = rect ? inflate(rect, step.padding ?? 8) : null;
  const pos = placePopover(hole, popSize, viewport, hole ? (step.placement ?? 'bottom') : 'center');
  const paragraphs = step.body.split('\n').filter(Boolean);

  return (
    <div className={scoped ? 'gt-root gt-root--scoped' : 'gt-root'}>
      {hole ? (
        <>
          <div className="gt-hole" style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }} />
          <div className="gt-block" style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
          <div className="gt-block" style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div className="gt-block" style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
          <div className="gt-block" style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          {!clickThrough && (
            <div className="gt-block" style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }} />
          )}
        </>
      ) : (
        <div className="gt-backdrop" />
      )}

      <div
        ref={popRef}
        key={step.id}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className={`gt-pop gt-pop--${pos.placement}`}
        style={{ top: pos.top, left: pos.left, visibility: resolving ? 'hidden' : 'visible' }}
      >
        <div className="gt-pop__bar" />
        <div className="gt-pop__head">
          <span className="gt-pop__tour">{tour.title}</span>
          <span className="gt-pop__count">{labels.stepOf(index + 1, total)}</span>
          <button type="button" className="gt-pop__close" aria-label={labels.skip} onClick={onSkip}>
            ×
          </button>
        </div>
        <h3 className="gt-pop__title">{step.title}</h3>
        <div className="gt-pop__body">
          {paragraphs.map((p, i) => (
            <p key={i}>{rich(p)}</p>
          ))}
        </div>
        {step.hint && <div className="gt-pop__hint">{rich(step.hint)}</div>}
        <div className="gt-pop__foot">
          <div className="gt-dots" aria-hidden>
            {tour.steps.map((s, i) => (
              <span key={s.id} className={i === index ? 'gt-dot gt-dot--on' : i < index ? 'gt-dot gt-dot--past' : 'gt-dot'} />
            ))}
          </div>
          <div className="gt-pop__actions">
            {!isFirst && (
              <button type="button" className="gt-btn gt-btn--ghost" onClick={onPrev}>
                {labels.prev}
              </button>
            )}
            {clickThrough ? (
              <span className="gt-pop__click">{labels.clickHint}</span>
            ) : (
              <button type="button" className="gt-btn gt-btn--primary" autoFocus onClick={onNext}>
                {isLast ? labels.done : labels.next}
              </button>
            )}
          </div>
        </div>
        {!isLast && (
          <button type="button" className="gt-pop__skip" onClick={onSkip}>
            {labels.skip}
          </button>
        )}
      </div>
    </div>
  );
}
