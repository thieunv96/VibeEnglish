// Tiny inline SVG sparkline — no extra dependencies.
export function Sparkline({
  data,
  width = 320,
  height = 60,
  className,
}: {
  data: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = width / data.length;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      data-testid="sparkline"
      role="img"
      aria-label="Daily signups"
    >
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 4);
        return (
          <rect
            key={i}
            x={i * bw + 1}
            y={height - h}
            width={Math.max(1, bw - 2)}
            height={h}
            rx={1}
            fill="var(--brand)"
          >
            <title>{`${d.label}: ${d.value}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
