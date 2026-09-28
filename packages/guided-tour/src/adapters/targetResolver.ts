/** 目标解析适配器：把 step.target 映射到真实元素。默认实现基于 data-tour 属性。 */

export const TOUR_ATTR = 'data-tour';

export interface TargetResolver {
  find(target: string, root?: ParentNode): HTMLElement | null;
  waitFor(target: string, opts?: { timeoutMs?: number; root?: ParentNode }): Promise<HTMLElement | null>;
}

/** 给业务组件打锚点：<div {...tourAnchor('kpi')} /> */
export function tourAnchor(id: string): Record<string, string> {
  return { [TOUR_ATTR]: id };
}

const selector = (target: string) => `[${TOUR_ATTR}="${CSS.escape(target)}"]`;

function find(target: string, root: ParentNode = document): HTMLElement | null {
  return root.querySelector<HTMLElement>(selector(target));
}

function waitFor(
  target: string,
  { timeoutMs = 2500, root = document }: { timeoutMs?: number; root?: ParentNode } = {},
): Promise<HTMLElement | null> {
  const hit = find(target, root);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const observeRoot: Node = root instanceof Document ? root.body : (root as Node);
    const obs = new MutationObserver(() => {
      const el = find(target, root);
      if (el) {
        cleanup();
        resolve(el);
      }
    });
    const timer = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);
    function cleanup() {
      obs.disconnect();
      window.clearTimeout(timer);
    }
    obs.observe(observeRoot, { childList: true, subtree: true, attributes: true, attributeFilter: [TOUR_ATTR] });
  });
}

export const domTargetResolver: TargetResolver = { find, waitFor };
