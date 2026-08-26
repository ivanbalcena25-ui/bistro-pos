// ── Skeleton loading primitives ──────────────────────────────────────────
// Reusable "shimmer" placeholders shown while a page is fetching its data,
// so the UI never looks blank during a fetch.

/** Base shimmering block. Compose these into page-specific skeletons below. */
export function SkeletonBlock({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}

/** Mimics the 4-up stat-card row used on Dashboard/Tables. */
export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card" style={{ borderTopColor: 'var(--border)' }}>
          <SkeletonBlock width={48} height={48} radius={12} />
          <div className="stat-info" style={{ width: '100%' }}>
            <SkeletonBlock width="60%" height={22} style={{ marginBottom: 8 }} />
            <SkeletonBlock width="85%" height={13} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Mimics a panel with a header + N list rows (e.g. Recent Transactions). */
export function SkeletonListPanel({ rows = 5, title = true }) {
  return (
    <div className="panel">
      {title && (
        <div className="panel-header">
          <SkeletonBlock width={160} height={16} />
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '13px 0',
          borderBottom: i < rows - 1 ? '1px solid var(--green-50)' : 'none',
          gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <SkeletonBlock width="55%" height={15} style={{ marginBottom: 6 }} />
            <SkeletonBlock width="35%" height={12} />
          </div>
          <SkeletonBlock width={60} height={15} />
        </div>
      ))}
    </div>
  )
}

/** Mimics a simple chart panel (header + rectangle where the chart goes). */
export function SkeletonChartPanel({ height = 200 }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <SkeletonBlock width={180} height={16} />
      </div>
      <SkeletonBlock width="100%" height={height} radius={12} />
    </div>
  )
}

/** Grid of square-ish cards — used for Tables grid and Menu items grid. */
export function SkeletonCardGrid({ count = 8, minWidth = 175, cardHeight = 185 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
      gap: 18,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} height={cardHeight} radius={18} />
      ))}
    </div>
  )
}

/** Table-row skeleton — used for Users table and similar <table> layouts. */
export function SkeletonTableRows({ rows = 6, columns = 6 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r}>
      {Array.from({ length: columns }).map((_, c) => (
        <td key={c} style={{ padding: '14px 16px' }}>
          {c === 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SkeletonBlock width={30} height={30} radius={'50%'} />
              <SkeletonBlock width={90} height={14} />
            </div>
          ) : (
            <SkeletonBlock width={c === columns - 1 ? 130 : '70%'} height={14} />
          )}
        </td>
      ))}
    </tr>
  ))
}

export default SkeletonBlock