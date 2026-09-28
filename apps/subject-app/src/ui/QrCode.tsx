/** 演示用二维码图形：由种子确定性生成，不可扫描，只表达「一人一码」的视觉 */
export function QrCode({ seed, size = 220, fg = '#0b1220' }: { seed: string; size?: number; fg?: string }) {
  const n = 29;
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    return inBox(0, 0) || inBox(n - 7, 0) || inBox(0, n - 7);
  };
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const v = rnd();
      if (finder(x, y) || (x >= 12 && x < 17 && y >= 12 && y < 17)) continue;
      if (v > 0.52) cells.push({ x, y });
    }
  const c = size / n;
  const Eye = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x * c} ${y * c})`}>
      <rect width={c * 7} height={c * 7} rx={c * 2} fill={fg} />
      <rect x={c} y={c} width={c * 5} height={c * 5} rx={c * 1.5} fill="#fff" />
      <rect x={c * 2} y={c * 2} width={c * 3} height={c * 3} rx={c} fill={fg} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {cells.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x * c + c * 0.1} y={y * c + c * 0.1} width={c * 0.8} height={c * 0.8} rx={c * 0.3} fill={fg} />
      ))}
      <Eye x={0} y={0} />
      <Eye x={n - 7} y={0} />
      <Eye x={0} y={n - 7} />
      <rect x={12 * c} y={12 * c} width={5 * c} height={5 * c} rx={c * 1.4} fill="#0d877a" />
      <text x={14.5 * c} y={15.3 * c} textAnchor="middle" fontSize={c * 2.4} fontWeight={700} fill="#fff">
        伙
      </text>
    </svg>
  );
}
