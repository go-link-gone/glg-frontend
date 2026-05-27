import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import { fetchDashboard } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';

// Theme-aware palette for Recharts (it can't read CSS vars directly).
const CHART_THEME = {
  light: {
    grid: '#e6e8ea',
    axis: '#737686',
    axisText: '#505f76',
    tooltipBg: '#ffffff',
    tooltipBorder: '#c3c6d7',
    tooltipText: '#191c1e',
    pieStroke: '#ffffff',
  },
  dark: {
    grid: '#26292d',
    axis: '#8d9199',
    axisText: '#c3c6c9',
    tooltipBg: '#181c1f',
    tooltipBorder: '#43474e',
    tooltipText: '#e1e3e5',
    pieStroke: '#0f1419',
  },
};

const TIME_RANGES = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
];

// Each timeRange exposes exactly the granularity its backing query supports:
//   24h → hourly (unique_visitors_log)
//   7d  → daily  (unique_visitors_log)
//   30d → daily / weekly (weekly disabled — backend supports it but the UX is
//                          still being designed, shows a "Coming soon" badge)
//   all → monthly (link_stats_monthly; no other granularity is meaningful)
const GRANULARITY_BY_RANGE = {
  '24h': [{ value: 'hour',  label: 'Hourly' }],
  '7d':  [{ value: 'day',   label: 'Daily' }],
  '30d': [
    { value: 'day',  label: 'Daily' },
    { value: 'week', label: 'Weekly', comingSoon: true, disabled: true },
  ],
  all:   [{ value: 'month', label: 'Monthly' }],
};

function resolveUserTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const DEVICE_COLORS = {
  PHONE: '#2563eb',
  TABLET: '#10B981',
  DESKTOP: '#004ac6',
  UNKNOWN: '#737686',
};

// Backend buckets in the user's timezone and emits ISO strings with `Z` whose digits
// match wall-clock-in-tz. Parsing as UTC and formatting with `timeZone: 'UTC'` below
// reproduces the user's local label without further conversion.
//
// `uniqueVisitors` is COUNT(DISTINCT visitor_hash) for the bucket on dynamic
// ranges, and null on the All-Time monthly view (link_stats_monthly doesn't
// carry distinct-hash data). The Unique Visitors <Line> is conditionally
// rendered for that reason — no in-data fallback needed.
function toSeries(totals) {
  if (!Array.isArray(totals)) return [];
  return totals
    .filter((p) => p && p.bucket)
    .map((p) => ({
      ts: p.bucket,
      total: Number(p.total ?? 0),
      newVisitors: Number(p.newVisitors ?? 0),
      uniqueVisitors: p.uniqueVisitors != null ? Number(p.uniqueVisitors) : null,
    }));
}

// Per-metric chart colors — shared by the Line stroke, the legend dot, and the
// tooltip dot so the visual mapping is unambiguous everywhere.
const METRIC_COLORS = {
  total:           '#2563eb', // blue
  newVisitors:     '#10B981', // green
  uniqueVisitors:  '#8b5cf6', // violet
};

// Browser-native ISO alpha-2 → full country name. Falls back to the raw code
// for anything Intl can't resolve (e.g. our "UNKNOWN" sentinel from MaxMind).
const COUNTRY_NAMES = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
})();
function countryName(code) {
  if (!code) return 'Unknown';
  try {
    const name = COUNTRY_NAMES?.of(code);
    return name && name !== code ? name : code;
  } catch {
    return code;
  }
}

const DAY_OPTS = { day: 'numeric', month: 'short', timeZone: 'UTC' };
const HOUR_OPTS = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' };
const MONTH_OPTS = { month: 'short', year: 'numeric', timeZone: 'UTC' };
const MONTH_LONG_OPTS = { month: 'long', year: 'numeric', timeZone: 'UTC' };

function formatTick(ts, granularity) {
  const d = new Date(ts);
  if (granularity === 'hour') {
    return d.toLocaleTimeString('en-GB', HOUR_OPTS);
  }
  if (granularity === 'week') {
    const end = new Date(d);
    end.setUTCDate(end.getUTCDate() + 6);
    return `${d.toLocaleDateString('en-GB', DAY_OPTS)}-${end.toLocaleDateString('en-GB', DAY_OPTS)}`;
  }
  if (granularity === 'month') {
    return d.toLocaleDateString('en-GB', MONTH_OPTS);
  }
  return d.toLocaleDateString('en-GB', DAY_OPTS);
}

function formatTooltipLabel(ts, granularity) {
  const d = new Date(ts);
  if (granularity === 'hour') {
    return `${d.toLocaleDateString('en-GB', DAY_OPTS)}, ${d.toLocaleTimeString('en-GB', HOUR_OPTS)}`;
  }
  if (granularity === 'week') {
    const end = new Date(d);
    end.setUTCDate(end.getUTCDate() + 6);
    return `${d.toLocaleDateString('en-GB', DAY_OPTS)} - ${end.toLocaleDateString('en-GB', DAY_OPTS)}`;
  }
  if (granularity === 'month') {
    return d.toLocaleDateString('en-GB', MONTH_LONG_OPTS);
  }
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function AnalyticsPage() {
  const { shortKey } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [timeRange, setTimeRange] = useState('24h');
  const [granularity, setGranularity] = useState('hour');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { theme } = useTheme();
  const chartC = CHART_THEME[theme === 'dark' ? 'dark' : 'light'];
  const userTz = useMemo(resolveUserTz, []);

  useEffect(() => {
    const opts = GRANULARITY_BY_RANGE[timeRange];
    if (!opts.find((o) => o.value === granularity)) {
      setGranularity(opts[0].value);
    }
  }, [timeRange, granularity]);

  useEffect(() => {
    // Skip fetch when granularity hasn't yet been normalized for the new timeRange.
    // Otherwise switching timeRange triggers a wasted fetch with the stale granularity
    // before the normalize effect above runs.
    const opts = GRANULARITY_BY_RANGE[timeRange] ?? [];
    if (!opts.find((o) => o.value === granularity)) return undefined;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchDashboard(shortKey, timeRange, granularity, userTz);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          pushToast({ type: 'error', title: 'Could not load analytics', message: err.message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shortKey, timeRange, granularity, userTz, refreshKey, pushToast]);

  const series = useMemo(() => toSeries(data?.totals ?? []), [data]);

  const totalClicks = data?.totalClicks ?? 0;
  const newVisitors = data?.newVisitors ?? 0;
  const isAllTime = timeRange === 'all';
  // Unique Visitors line is hidden on the All-Time monthly view — the backing
  // table (link_stats_monthly) holds no per-month distinct-hash data.
  const showUnique = !isAllTime;
  const link = state?.link;
  const shortUrl = link?.shortUrl ?? `/${shortKey}`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav />

      <main className="mx-auto w-full max-w-max-width flex-1 px-gutter py-margin md:py-xl">
        {/* Header */}
        <button
          onClick={() => navigate('/links')}
          className="mb-md inline-flex items-center gap-1 text-body-sm text-secondary hover:text-primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_back
          </span>
          Back to My Links
        </button>

        <div className="flex flex-col gap-md md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="text-label-caps uppercase text-secondary">Link Analytics</div>
            <h1 className="mt-1 truncate text-headline-lg-mobile font-semibold text-on-surface md:text-headline-lg">
              {shortUrl}
            </h1>
            {link?.originalUrl && (
              <p className="mt-1 truncate text-body-sm text-on-surface-variant" title={link.originalUrl}>
                Redirects to {link.originalUrl}
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:flex-wrap">
            <SegmentedControl
              options={TIME_RANGES}
              value={timeRange}
              onChange={setTimeRange}
              ariaLabel="Time range"
            />
            <SegmentedControl
              options={GRANULARITY_BY_RANGE[timeRange]}
              value={granularity}
              onChange={setGranularity}
              ariaLabel="Granularity"
            />
          </div>
        </div>

        {loading && !data ? (
          <div className="mt-margin grid place-items-center rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl shadow-soft">
            <Spinner size={24} color="#2563eb" label="Loading analytics…" />
          </div>
        ) : error ? (
          <div className="mt-margin rounded-2xl border border-error/30 bg-error-container/40 p-md text-on-error-container">
            <div className="flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined">error</span>
              Could not load analytics
            </div>
            <p className="mt-1 text-body-sm">{error}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="rounded-lg border border-error/30 bg-surface-container-lowest px-3 py-1.5 text-body-sm font-medium text-on-surface hover:bg-surface-container"
              >
                Retry
              </button>
              <Link
                to="/links"
                className="rounded-lg px-3 py-1.5 text-body-sm font-medium text-secondary hover:text-primary"
              >
                Back to My Links
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-md grid grid-cols-1 gap-md md:grid-cols-12">
            <SummaryCard
              className="md:col-span-6"
              label="Total Clicks"
              value={totalClicks}
              accent="text-primary-container"
              icon="ads_click"
            />
            <SummaryCard
              className="md:col-span-6"
              label="New Visitors"
              value={newVisitors}
              accent="text-tertiary-container"
              icon="group"
            />

            <Card className="md:col-span-12">
              <CardHeader title="Traffic Overview">
                <div className="flex items-center gap-md">
                  <Legend2 showUnique={showUnique} />
                  <TimezoneBadge tz={userTz} />
                </div>
              </CardHeader>
              <div className="h-72 w-full">
                {series.length === 0 ? (
                  <EmptyChart message="No clicks yet for this range." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke={chartC.grid} vertical={false} />
                      <XAxis
                        dataKey="ts"
                        stroke={chartC.axis}
                        tick={{ fontSize: 12, fill: chartC.axisText }}
                        tickFormatter={(v) => formatTick(v, granularity)}
                        tickLine={false}
                        axisLine={{ stroke: chartC.grid }}
                      />
                      <YAxis
                        stroke={chartC.axis}
                        tick={{ fontSize: 12, fill: chartC.axisText }}
                        tickLine={false}
                        axisLine={{ stroke: chartC.grid }}
                        allowDecimals={false}
                        width={36}
                      />
                      <Tooltip
                        content={<MetricTooltip granularity={granularity} chartC={chartC} />}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total Clicks"
                        stroke={METRIC_COLORS.total}
                        strokeWidth={2.25}
                        dot={{ r: 3, fill: METRIC_COLORS.total, stroke: '#fff', strokeWidth: 1.5 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="newVisitors"
                        name="New Visitors"
                        stroke={METRIC_COLORS.newVisitors}
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: METRIC_COLORS.newVisitors, stroke: '#fff', strokeWidth: 1.5 }}
                        activeDot={{ r: 5 }}
                      />
                      {showUnique && (
                        <Line
                          type="monotone"
                          dataKey="uniqueVisitors"
                          name="Unique Visitors"
                          stroke={METRIC_COLORS.uniqueVisitors}
                          strokeWidth={2}
                          strokeDasharray="2 4"
                          dot={{ r: 3, fill: METRIC_COLORS.uniqueVisitors, stroke: '#fff', strokeWidth: 1.5 }}
                          activeDot={{ r: 5 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="md:col-span-6">
              <CardHeader title="Top Countries" />
              <RowChart
                items={(data?.topCountries ?? []).map((c) => ({
                  label: countryName(c.country),
                  total: Number(c.total ?? 0),
                  newVisitors: Number(c.newVisitors ?? 0),
                }))}
                accent="#2563eb"
                emptyText="No country data yet."
              />
            </Card>

            <Card className="md:col-span-6">
              <CardHeader title="Top Cities" />
              <RowChart
                items={(data?.topCities ?? []).map((c) => ({
                  label: c.city || 'Unknown',
                  sub: countryName(c.country),
                  total: Number(c.total ?? 0),
                  newVisitors: Number(c.newVisitors ?? 0),
                }))}
                accent="#007d55"
                emptyText="No city data yet."
              />
            </Card>

            <Card className="md:col-span-12">
              <CardHeader title="Device Breakdown" />
              <DeviceBreakdown devices={data?.deviceBreakdown ?? []} chartC={chartC} />
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function SegmentedControl({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-1 shadow-soft md:inline-flex md:w-auto"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const disabled = !!opt.disabled;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => !disabled && onChange(opt.value)}
            title={disabled && opt.comingSoon ? 'Coming soon' : undefined}
            className={
              'flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-body-sm transition-colors md:flex-initial ' +
              (active
                ? 'bg-primary-container text-on-primary font-semibold shadow-soft'
                : disabled
                  ? 'cursor-not-allowed text-secondary opacity-60'
                  : 'text-secondary hover:text-primary')
            }
          >
            <span className="inline-flex items-center gap-1.5">
              {opt.label}
              {opt.comingSoon && (
                <span className="rounded-full bg-tertiary-container px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-on-tertiary-container">
                  Soon
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Card({ className = '', children }) {
  return (
    <div
      className={
        'rounded-2xl border border-outline-variant bg-surface-container-lowest p-md shadow-soft ' +
        className
      }
    >
      {children}
    </div>
  );
}

function CardHeader({ title, children }) {
  return (
    <div className="mb-md flex items-center justify-between">
      <h2 className="text-headline-md font-semibold text-on-surface">{title}</h2>
      {children}
    </div>
  );
}

function TimezoneBadge({ tz }) {
  return (
    <span
      title={`Times shown in ${tz}`}
      className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container px-2 py-0.5 text-label-caps uppercase text-secondary"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        schedule
      </span>
      {tz}
    </span>
  );
}

function Legend2({ showUnique = true }) {
  return (
    <div className="hidden gap-md text-body-sm text-secondary sm:flex">
      <LegendDot color={METRIC_COLORS.total} label="Total Clicks" />
      <LegendDot color={METRIC_COLORS.newVisitors} label="New Visitors" />
      {showUnique && <LegendDot color={METRIC_COLORS.uniqueVisitors} label="Unique Visitors" />}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function SummaryCard({ label, value, accent, icon, className = '' }) {
  return (
    <div
      className={
        'rounded-2xl border border-outline-variant bg-surface-container-lowest p-md shadow-soft ' +
        className
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-label-caps uppercase text-secondary">{label}</div>
          <div className={`mt-1 text-display-lg font-bold leading-none ${accent}`}>
            {Number(value).toLocaleString()}
          </div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary-container text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function RowChart({ items, accent, emptyText }) {
  if (!items || items.length === 0) {
    return <EmptyChart message={emptyText} />;
  }
  const max = Math.max(...items.map((i) => i.total)) || 1;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, idx) => {
        const pct = (item.total / max) * 100;
        const opacity = 1 - idx * 0.12;
        return (
          <li key={`${item.label}-${idx}`} className="group">
            {/* Mobile: stack label on top, bar + count below — gives the bar full row width.
                sm+ : single horizontal row with fixed-width label column. */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 text-body-sm text-on-surface sm:w-[140px] sm:flex-shrink-0">
                <div className="truncate font-medium" title={item.label}>
                  {item.label}
                </div>
                {item.sub && (
                  <div className="truncate text-label-caps uppercase text-secondary">
                    {item.sub}
                  </div>
                )}
              </div>
              <div className="flex flex-1 items-center gap-3">
                <div
                  className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface-container-high"
                  title={`${item.total.toLocaleString()} clicks · ${item.newVisitors.toLocaleString()} unique`}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: accent,
                      opacity: Math.max(0.35, opacity),
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 hidden items-center justify-end pr-2 text-[11px] font-semibold text-on-surface group-hover:flex">
                    {item.total.toLocaleString()}
                  </div>
                </div>
                <div className="w-14 text-right text-body-sm font-medium text-on-surface sm:w-20">
                  {item.total.toLocaleString()}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DeviceBreakdown({ devices, chartC }) {
  const total = devices.reduce((s, d) => s + Number(d.total ?? 0), 0);
  if (!devices.length || total === 0) {
    return <EmptyChart message="No device data yet." />;
  }
  const data = devices.map((d) => ({
    name: d.device || 'UNKNOWN',
    value: Number(d.total ?? 0),
    pct: Number(d.percentage ?? (d.total / total) * 100),
  }));

  return (
    <div className="grid grid-cols-1 items-center gap-md md:grid-cols-2">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: chartC.tooltipBg,
                border: `1px solid ${chartC.tooltipBorder}`,
                borderRadius: 12,
                fontSize: 12,
                color: chartC.tooltipText,
                boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
              }}
              labelStyle={{ color: chartC.tooltipText }}
              itemStyle={{ color: chartC.tooltipText }}
              formatter={(value, name, item) => {
                const pct = item?.payload?.pct ?? 0;
                return [`${pct.toFixed(1)}% (${Number(value).toLocaleString()})`, name];
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              stroke={chartC.pieStroke}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={DEVICE_COLORS[entry.name] ?? '#737686'} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value) => (
                <span className="text-body-sm text-on-surface-variant">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2">
        {data.map((d) => (
          <li
            key={d.name}
            className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface px-3 py-2"
          >
            <span className="flex items-center gap-2 text-body-sm text-on-surface">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: DEVICE_COLORS[d.name] ?? '#737686' }}
              />
              {d.name.charAt(0) + d.name.slice(1).toLowerCase()}
            </span>
            <span className="text-body-sm font-semibold text-on-surface">
              {d.pct.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="grid h-full min-h-[180px] place-items-center rounded-xl border border-dashed border-outline-variant bg-surface text-body-sm text-secondary">
      {message}
    </div>
  );
}

// Custom tooltip — iterates Recharts' payload directly. payload contains one
// entry per <Line> currently rendered, so we get 3 rows on dynamic ranges and
// 2 on All-Time without any in-tooltip conditionals.
function MetricTooltip({ active, payload, label, granularity, chartC }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: chartC.tooltipBg,
        border: `1px solid ${chartC.tooltipBorder}`,
        borderRadius: 12,
        color: chartC.tooltipText,
        boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
        padding: '8px 12px',
        fontSize: 12,
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {formatTooltipLabel(label, granularity)}
      </div>
      {payload.map((entry) => (
        <TooltipRow
          key={entry.dataKey}
          color={entry.color || entry.stroke}
          label={entry.name}
          value={Number(entry.value ?? 0).toLocaleString()}
        />
      ))}
    </div>
  );
}

function TooltipRow({ color, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 2 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: 'inline-block' }} />
        {label}
      </span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
