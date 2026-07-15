"use client";

type WeekBucket = {
  weekStart: Date;
  count: number;
};

function buildWeeklyBuckets(completedDates: number[], weeks: number): WeekBucket[] {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setHours(0, 0, 0, 0);
  startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());

  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => {
    const weekStart = new Date(startOfThisWeek);
    weekStart.setDate(weekStart.getDate() - (weeks - 1 - i) * 7);
    return { weekStart, count: 0 };
  });

  for (const ts of completedDates) {
    const d = new Date(ts);
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (d >= buckets[i].weekStart) {
        buckets[i].count += 1;
        break;
      }
    }
  }

  return buckets;
}

const WIDTH = 640;
const HEIGHT = 140;
const PADDING_BOTTOM = 20;
const PADDING_TOP = 20;
const BAR_GAP = 6;

export function WeeklyCompletedChart({ completedDates }: { completedDates: number[] }) {
  const buckets = buildWeeklyBuckets(completedDates, 8);
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const barWidth = (WIDTH - BAR_GAP * (buckets.length - 1)) / buckets.length;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full min-w-[480px]" role="img" aria-label="সাপ্তাহিক সম্পন্ন ভিডিও">
        <line
          x1={0}
          y1={HEIGHT - PADDING_BOTTOM}
          x2={WIDTH}
          y2={HEIGHT - PADDING_BOTTOM}
          className="stroke-border"
          strokeWidth={1}
        />
        {buckets.map((b, i) => {
          const barHeight = b.count === 0 ? 0 : Math.max(4, (b.count / max) * plotHeight);
          const x = i * (barWidth + BAR_GAP);
          const y = HEIGHT - PADDING_BOTTOM - barHeight;
          const label = b.weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" });

          return (
            <g key={i}>
              <title>
                {label}: {b.count}টা সম্পন্ন
              </title>
              {b.count > 0 && (
                <rect x={x} y={y} width={barWidth} height={barHeight} rx={4} className="fill-primary" />
              )}
              {b.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {b.count}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={HEIGHT - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[8px]"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
