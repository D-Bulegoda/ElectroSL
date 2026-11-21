import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formattingHelpers';

/**
 * Responsive SVG Line & Area Chart for Monthly / Daily GMV and Commission Trends
 */
export function FinancialTrendChart({ data = [], height = 240 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '6px',
          color: '#64748b',
          padding: '1.5rem',
          textAlign: 'center'
        }}
      >
        <span style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📈</span>
        <strong style={{ color: '#334155', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
          No Transaction Records in Selected Range
        </strong>
        <span style={{ fontSize: '0.8rem', maxWidth: '380px' }}>
          Authoritative financial GMV and platform commission curves will automatically populate once customer payments are completed.
        </span>
      </div>
    );
  }

  const svgWidth = 640;
  const svgHeight = height;
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => Math.max(d.gmv || 0, d.commission || 0)), 100);
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  const getX = (idx) => {
    if (data.length === 1) return padding.left + innerWidth / 2;
    return padding.left + (idx / (data.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    return padding.top + innerHeight - (val / maxVal) * innerHeight;
  };

  // Generate smooth area & line paths for GMV
  const gmvPoints = data.map((d, i) => `${getX(i)},${getY(d.gmv || 0)}`).join(' ');
  const gmvAreaPath = `M ${getX(0)},${padding.top + innerHeight} L ${gmvPoints} L ${getX(data.length - 1)},${padding.top + innerHeight} Z`;
  const gmvLinePath = `M ${gmvPoints}`;

  // Line path for commission
  const commPoints = data.map((d, i) => `${getX(i)},${getY(d.commission || 0)}`).join(' ');
  const commLinePath = `M ${commPoints}`;

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', height: 'auto', display: 'block', minWidth: '460px' }}
      >
        <defs>
          <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="commGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Gridlines and Labels */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
          return (
            <g key={`ytick-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={i === 0 ? 'none' : '3,3'}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
                fontFamily="inherit"
              >
                {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* GMV Area & Line */}
        <path d={gmvAreaPath} fill="url(#gmvGradient)" />
        <path d={gmvLinePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

        {/* Commission Line */}
        <path d={commLinePath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4,3" />

        {/* Data points & X Labels */}
        {data.map((d, i) => {
          const x = getX(i);
          const yGmv = getY(d.gmv || 0);
          const yComm = getY(d.commission || 0);
          const isHovered = hoveredPoint && hoveredPoint.idx === i;

          return (
            <g key={`dp-${i}`}>
              {/* Vertical Guide Line on Hover */}
              {isHovered && (
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + innerHeight}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              )}

              {/* GMV Point */}
              <circle
                cx={x}
                cy={yGmv}
                r={isHovered ? 5.5 : 3.5}
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth={isHovered ? 2.5 : 2}
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                onMouseEnter={() => setHoveredPoint({ idx: i, x, y: yGmv, d })}
                onMouseLeave={() => setHoveredPoint(null)}
              />

              {/* Commission Point */}
              <circle
                cx={x}
                cy={yComm}
                r={isHovered ? 4.5 : 3}
                fill="#ffffff"
                stroke="#10b981"
                strokeWidth={1.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint({ idx: i, x, y: yComm, d })}
                onMouseLeave={() => setHoveredPoint(null)}
              />

              {/* X Axis Label */}
              <text
                x={x}
                y={svgHeight - 12}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontFamily="inherit"
              >
                {d.period}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / svgWidth) * 100}%`,
            top: '15px',
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            pointerEvents: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ fontWeight: 600, borderBottom: '1px solid #334155', paddingBottom: '0.25rem', marginBottom: '0.35rem' }}>
            {hoveredPoint.d.period}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
            <span>GMV: <strong>{formatCurrency(hoveredPoint.d.gmv || 0)}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Commission (15%): <strong>{formatCurrency(hoveredPoint.d.commission || 0)}</strong></span>
          </div>
        </div>
      )}

      {/* Chart Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e40af' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '3px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
          <span style={{ fontWeight: 600 }}>Total GMV</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#065f46' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '2px', backgroundColor: '#10b981', borderTop: '2px dashed #10b981' }} />
          <span style={{ fontWeight: 600 }}>15% Platform Commission</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Donut Chart for Payment Method Distribution (FullDigital vs CashSplit)
 */
export function PaymentMethodDonutChart({ paymentMethods, size = 180 }) {
  const fullDigital = paymentMethods?.fullDigitalCount || 0;
  const cashSplit = paymentMethods?.cashSplitCount || 0;
  const total = fullDigital + cashSplit;

  const fullPct = total > 0 ? (fullDigital / total) * 100 : 0;
  const cashPct = total > 0 ? (cashSplit / total) * 100 : 0;

  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const digitalOffset = circumference - (fullPct / 100) * circumference;
  const cashOffset = circumference - (cashPct / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {total === 0 ? (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
            />
          ) : (
            <>
              {/* FullDigital segment */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#2563eb"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={digitalOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              {/* CashSplit segment */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={cashOffset}
                strokeLinecap="round"
                style={{
                  transform: `rotate(${(fullPct / 100) * 360}deg)`,
                  transformOrigin: '80px 80px',
                  transition: 'stroke-dashoffset 0.5s ease'
                }}
              />
            </>
          )}
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
            {total}
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Payments
          </span>
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', backgroundColor: '#eff6ff', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#2563eb' }} />
            <span style={{ color: '#1e3a8a', fontWeight: 600 }}>FullDigital (100% Online)</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong style={{ color: '#1e3a8a' }}>{fullDigital} ({fullPct.toFixed(1)}%)</strong>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatCurrency(paymentMethods?.fullDigitalGmv || 0)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', backgroundColor: '#fffbeb', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#f59e0b' }} />
            <span style={{ color: '#92400e', fontWeight: 600 }}>CashSplit (15% Net)</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong style={{ color: '#92400e' }}>{cashSplit} ({cashPct.toFixed(1)}%)</strong>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatCurrency(paymentMethods?.cashSplitGmv || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Job Status Distribution Horizontal Progress Bars
 */
export function JobStatusDistributionChart({ jobStatuses }) {
  const total = jobStatuses?.total || 0;

  const statuses = [
    { key: 'Pending', label: 'Pending Bids/Dispatch', count: jobStatuses?.pending || 0, color: '#eab308', bg: '#fef9c3' },
    { key: 'Assigned', label: 'Assigned to Electrician', count: jobStatuses?.assigned || 0, color: '#3b82f6', bg: '#dbeafe' },
    { key: 'InProgress', label: 'In Progress / Active Work', count: jobStatuses?.inProgress || 0, color: '#8b5cf6', bg: '#ede9fe' },
    { key: 'Completed', label: 'Completed', count: jobStatuses?.completed || 0, color: '#22c55e', bg: '#dcfce7' },
    { key: 'Cancelled', label: 'Cancelled', count: jobStatuses?.cancelled || 0, color: '#64748b', bg: '#f1f5f9' },
    { key: 'Disputed', label: 'Disputed', count: jobStatuses?.disputed || 0, color: '#ef4444', bg: '#fee2e2' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {/* Visual Stacked Bar */}
      <div
        style={{
          height: '14px',
          width: '100%',
          display: 'flex',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#f1f5f9'
        }}
      >
        {total === 0 ? (
          <div style={{ width: '100%', backgroundColor: '#e2e8f0' }} />
        ) : (
          statuses.map((s) => {
            if (s.count === 0) return null;
            const pct = (s.count / total) * 100;
            return (
              <div
                key={`bar-${s.key}`}
                style={{
                  width: `${pct}%`,
                  backgroundColor: s.color,
                  transition: 'width 0.3s ease'
                }}
                title={`${s.label}: ${s.count} (${pct.toFixed(1)}%)`}
              />
            );
          })
        )}
      </div>

      {/* Breakdown Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', marginTop: '0.25rem' }}>
        {statuses.map((s) => {
          const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : '0.0';
          return (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.6rem',
                backgroundColor: s.count > 0 ? s.bg : '#f8fafc',
                borderRadius: '4px',
                border: `1px solid ${s.count > 0 ? `${s.color}30` : '#e2e8f0'}`,
                fontSize: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                <span style={{ color: '#1e293b', fontWeight: 500 }}>{s.label}</span>
              </div>
              <strong style={{ color: s.color, fontWeight: 700 }}>
                {s.count} <span style={{ color: '#64748b', fontSize: '0.6875rem' }}>({pct}%)</span>
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Monthly / Daily Job Creation Trends Bar Chart
 */
export function JobTrendChart({ data = [], height = 180 }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '6px',
          color: '#64748b',
          fontSize: '0.8rem',
          padding: '1rem',
          textAlign: 'center'
        }}
      >
        <span>📋</span>
        <span>No jobs created in the selected date window.</span>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.createdCount || 0), 5);
  const svgWidth = 500;
  const svgHeight = height;
  const padding = { top: 20, right: 20, bottom: 35, left: 40 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const barWidth = Math.min(32, Math.max(12, (innerWidth / data.length) * 0.6));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', height: 'auto', display: 'block', minWidth: '380px' }}
      >
        {/* Y Gridlines */}
        {[0, maxCount * 0.5, maxCount].map((tick, i) => {
          const y = padding.top + innerHeight - (tick / maxCount) * innerHeight;
          return (
            <g key={`ytick-job-${i}`}>
              <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#f1f5f9" />
              <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = padding.left + (i + 0.5) * (innerWidth / data.length) - barWidth / 2;
          const barHeight = (d.createdCount / maxCount) * innerHeight;
          const y = padding.top + innerHeight - barHeight;

          return (
            <g key={`job-bar-${i}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                fill="#3b82f6"
                rx="3"
                ry="3"
              >
                <title>{`${d.period}: ${d.createdCount} jobs created`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="9"
                fill="#1e40af"
                fontWeight="600"
              >
                {d.createdCount}
              </text>
              <text
                x={x + barWidth / 2}
                y={svgHeight - 10}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
              >
                {d.period}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Monthly Job Activity - Compact SVG Line Chart (Single Dashboard Graph)
 */
export function MonthlyJobActivityLineChart({ data = [], height = 160 }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '6px',
          color: '#64748b',
          fontSize: '0.8rem',
          padding: '1rem',
          textAlign: 'center'
        }}
      >
        <span style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>📊</span>
        <span>No job activity recorded yet.</span>
      </div>
    );
  }

  const svgWidth = 520;
  const svgHeight = height;
  const padding = { top: 22, right: 28, bottom: 28, left: 32 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const counts = data.map((d) => d.createdCount || 0);
  const maxVal = Math.max(...counts, 4);

  const getX = (idx) => {
    if (data.length === 1) return padding.left + innerWidth / 2;
    return padding.left + (idx / (data.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    return padding.top + innerHeight - (val / maxVal) * innerHeight;
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.createdCount || 0)}`).join(' ');
  const linePath = data.length === 1
    ? `M ${getX(0) - 25},${getY(data[0].createdCount || 0)} L ${getX(0) + 25},${getY(data[0].createdCount || 0)}`
    : `M ${points}`;

  const areaPath = data.length === 1
    ? `M ${getX(0) - 25},${padding.top + innerHeight} L ${getX(0) - 25},${getY(data[0].createdCount || 0)} L ${getX(0) + 25},${getY(data[0].createdCount || 0)} L ${getX(0) + 25},${padding.top + innerHeight} Z`
    : `M ${getX(0)},${padding.top + innerHeight} L ${points} L ${getX(data.length - 1)},${padding.top + innerHeight} Z`;

  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', height: 'auto', display: 'block', minWidth: '340px' }}
      >
        <defs>
          <linearGradient id="jobActivityAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
          return (
            <g key={`ygrid-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="#f1f5f9"
                strokeDasharray={i === 0 ? 'none' : '3,3'}
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="#94a3b8"
                fontFamily="inherit"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Gradient fill area */}
        <path d={areaPath} fill="url(#jobActivityAreaGrad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points & Labels */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.createdCount || 0);
          return (
            <g key={`point-${i}`}>
              <circle cx={cx} cy={cy} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#1e40af"
              >
                {d.createdCount}
              </text>
              <text
                x={cx}
                y={svgHeight - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontWeight="500"
              >
                {d.period}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Technician Verification & Accreditation Statistics Widget
 */
export function TechnicianStatsWidget({ techStats }) {
  const total = techStats?.total || 0;
  const approved = techStats?.approved || 0;
  const pending = techStats?.pending || 0;
  const rejected = techStats?.rejected || 0;
  const suspended = techStats?.suspendedOrInactive || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
        <div style={{ padding: '0.65rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
            Licensed & Approved
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803d', marginTop: '0.2rem' }}>
            {approved}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#166534' }}>
            {total > 0 ? `${((approved / total) * 100).toFixed(0)}% of total roster` : 'Active on platform'}
          </div>
        </div>

        <div style={{ padding: '0.65rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Review
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#b45309', marginTop: '0.2rem' }}>
            {pending}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#92400e' }}>
            Awaiting credential validation
          </div>
        </div>

        <div style={{ padding: '0.65rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>
            Rejected Submissions
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#b91c1c', marginTop: '0.2rem' }}>
            {rejected}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#991b1b' }}>
            Non-compliant dossiers
          </div>
        </div>

        <div style={{ padding: '0.65rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>
            Suspended / Inactive
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#334155', marginTop: '0.2rem' }}>
            {suspended}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Accounts restricted
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Financial Earnings Breakdown: Commission (15%) vs Electrician Earnings (85%)
 */
export function EarningsBreakdownWidget({ commission = 0, electricianEarnings = 0 }) {
  const total = commission + electricianEarnings;
  const commPct = total > 0 ? (commission / total) * 100 : 15;
  const elecPct = total > 0 ? (electricianEarnings / total) * 100 : 85;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {/* Comparative Stacked Bar */}
      <div style={{ display: 'flex', height: '14px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
        <div style={{ width: `${commPct}%`, backgroundColor: '#2563eb' }} title={`Commission: ${commPct.toFixed(1)}%`} />
        <div style={{ width: `${elecPct}%`, backgroundColor: '#10b981' }} title={`Electrician: ${elecPct.toFixed(1)}%`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>Platform Commission (15%)</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1d4ed8', margin: '0.2rem 0' }}>
            {formatCurrency(commission)}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Retained by ElectroSL</div>
        </div>

        <div style={{ padding: '0.75rem', backgroundColor: '#ecfdf5', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>Electrician Share (85%)</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#047857', margin: '0.2rem 0' }}>
            {formatCurrency(electricianEarnings)}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Disbursed / Net Cash</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Comparison Delta Badge for Prior-Period Analysis (+X.X% / -Y.Y%)
 */
export function ComparisonDeltaBadge({ delta, isInverse = false, label = 'vs prior' }) {
  if (delta === null || delta === undefined) {
    return (
      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
        <span>•</span>
        <span>No prior data</span>
      </span>
    );
  }

  const isPositive = delta > 0;
  const isZero = delta === 0;

  // For metrics like cancellations or disputes, positive delta is bad (inverse)
  const isFavorable = isInverse ? !isPositive : isPositive;

  const color = isZero ? '#64748b' : isFavorable ? '#16a34a' : '#dc2626';
  const bg = isZero ? '#f1f5f9' : isFavorable ? '#dcfce7' : '#fee2e2';
  const arrow = isZero ? '→' : isPositive ? '▲' : '▼';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '0.7rem',
        fontWeight: 600,
        color: color,
        backgroundColor: bg,
        padding: '2px 6px',
        borderRadius: '10px',
        whiteSpace: 'nowrap'
      }}
      title={`${delta > 0 ? '+' : ''}${delta}% ${label}`}
    >
      <span>{arrow}</span>
      <span>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
      {label && <span style={{ opacity: 0.8, fontWeight: 400 }}>{label}</span>}
    </span>
  );
}

/**
 * High-Impact BI Metric Stat Card with Prior-Period Delta
 */
export function BiStatCard({
  title,
  value,
  priorValue,
  delta,
  isCurrency = false,
  isInverse = false,
  note = '',
  accentColor = '#2563eb'
}) {
  const displayVal = isCurrency ? formatCurrency(value) : value.toLocaleString();
  const displayPrior = isCurrency ? formatCurrency(priorValue) : priorValue.toLocaleString();

  return (
    <div className="admin-card" style={{ padding: '1rem', borderTop: `3px solid ${accentColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {title}
          </span>
          <ComparisonDeltaBadge delta={delta} isInverse={isInverse} />
        </div>

        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0.2rem 0' }}>
          {displayVal}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b' }}>
        <span>Prior period: <strong>{displayPrior}</strong></span>
        {note && <span style={{ color: '#94a3b8' }}>{note}</span>}
      </div>
    </div>
  );
}

/**
 * Multi-Line Responsive SVG Chart for Advanced Time-Series Comparisons
 */
export function BiMultiLineChart({ data = [], lines = [], height = 240, emptyMessage = 'No historical telemetry recorded for selected window' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '6px',
          color: '#64748b',
          padding: '1.5rem',
          textAlign: 'center'
        }}
      >
        <span style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📊</span>
        <strong style={{ color: '#334155', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
          {emptyMessage}
        </strong>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Authoritative metrics will populate automatically when transactions or operations occur in this window.
        </span>
      </div>
    );
  }

  const svgWidth = 640;
  const svgHeight = height;
  const padding = { top: 25, right: 30, bottom: 40, left: 60 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Find overall max value across all configured lines
  const allValues = data.flatMap((d) => lines.map((l) => Number(d[l.key] || 0)));
  const maxVal = Math.max(...allValues, 10);
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  const getX = (idx) => {
    if (data.length === 1) return padding.left + innerWidth / 2;
    return padding.left + (idx / (data.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    return padding.top + innerHeight - (val / maxVal) * innerHeight;
  };

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '0.5rem', fontSize: '0.75rem' }}>
        {lines.map((line) => (
          <div key={line.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: line.color, borderRadius: '2px' }} />
            <span style={{ color: '#475569', fontWeight: 500 }}>{line.label}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', height: 'auto', display: 'block', minWidth: '460px' }}
      >
        {/* Y Gridlines and Labels */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
          return (
            <g key={`ytick-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={i === 0 ? 'none' : '3,3'}
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
              >
                {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* X Axis Baseline */}
        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={svgWidth - padding.right}
          y2={padding.top + innerHeight}
          stroke="#cbd5e1"
        />

        {/* Data Lines */}
        {lines.map((line) => {
          const pts = data.map((d, i) => `${getX(i)},${getY(d[line.key] || 0)}`).join(' ');
          return (
            <g key={`line-${line.key}`}>
              <polyline
                fill="none"
                stroke={line.color}
                strokeWidth={line.strokeWidth || 2}
                strokeDasharray={line.dashed ? '4,4' : 'none'}
                points={pts}
              />
              {data.map((d, i) => (
                <circle
                  key={`dot-${line.key}-${i}`}
                  cx={getX(i)}
                  cy={getY(d[line.key] || 0)}
                  r={hoveredIdx === i ? 5 : 3}
                  fill={line.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                />
              ))}
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, i) => {
          const x = getX(i);
          return (
            <text
              key={`xlabel-${i}`}
              x={x}
              y={padding.top + innerHeight + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
              fontWeight={hoveredIdx === i ? 'bold' : 'normal'}
            >
              {d.period || ''}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Top Used Equipment Horizontal Bar Widget
 */
export function TopEquipmentBarWidget({ items = [], maxItems = 6 }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
        No equipment claim usage records for this period.
      </div>
    );
  }

  const top = items.slice(0, maxItems);
  const maxUsage = Math.max(...top.map((i) => i.usageCount || 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {top.map((item, idx) => {
        const pct = Math.round(((item.usageCount || 0) / maxUsage) * 100);
        return (
          <div key={`equip-top-${idx}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                {idx + 1}. {item.itemName} <span style={{ fontWeight: 400, color: '#64748b' }}>({item.category})</span>
              </span>
              <span style={{ fontWeight: 700, color: '#2563eb' }}>
                {item.usageCount} claims | {formatCurrency(item.totalSpending || 0)}
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  backgroundColor: idx === 0 ? '#2563eb' : idx === 1 ? '#3b82f6' : '#60a5fa',
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Job Lifecycle Velocity & Telemetry Metrics Widget
 */
export function JobVelocitySummaryWidget({
  completionRate = 0,
  cancellationRate = 0,
  disputeRate = 0,
  avgAssignmentMinutes = null,
  avgCompletionHours = null
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
      <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase' }}>Completion Rate</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', margin: '0.2rem 0' }}>
          {completionRate.toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Completed vs created</div>
      </div>

      <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '4px', border: '1px solid #fecaca' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase' }}>Cancellation Rate</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', margin: '0.2rem 0' }}>
          {cancellationRate.toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Aborted before finish</div>
      </div>

      <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: '4px', border: '1px solid #fde68a' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#b45309', textTransform: 'uppercase' }}>Dispute Rate</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e', margin: '0.2rem 0' }}>
          {disputeRate.toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Requiring mediation</div>
      </div>

      <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase' }}>Avg Time to Assign</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af', margin: '0.2rem 0' }}>
          {avgAssignmentMinutes !== null ? `${avgAssignmentMinutes}m` : 'N/A'}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Dispatch latency</div>
      </div>

      <div style={{ padding: '0.75rem', backgroundColor: '#faf5ff', borderRadius: '4px', border: '1px solid #e9d5ff' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#7e22ce', textTransform: 'uppercase' }}>Avg Completion Time</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6b21a8', margin: '0.2rem 0' }}>
          {avgCompletionHours !== null ? `${avgCompletionHours}h` : 'N/A'}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Total duration</div>
      </div>
    </div>
  );
}

