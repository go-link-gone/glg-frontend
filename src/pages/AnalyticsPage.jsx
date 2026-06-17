import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
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
const PALETTE = {
  light: {
    grid: '#e9eef4',
    axisText: '#64748b',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2e8f0',
    tooltipText: '#0f172a',
    pieStroke: '#ffffff',
    track: '#eef2f7',
    total: '#2563eb',
    newVisitors: '#64748b',
    uniqueVisitors: '#0d9488',
    device: { PHONE: '#2563eb', DESKTOP: '#7c3aed', TABLET: '#0d9488', UNKNOWN: '#94a3b8' },
  },
  dark: {
    grid: '#222836',
    axisText: '#8a94a6',
    tooltipBg: '#161a22',
    tooltipBorder: '#2a3140',
    tooltipText: '#e9ecf2',
    pieStroke: '#0e1117',
    track: '#1b212b',
    total: '#60a5fa',
    newVisitors: '#94a3b8',
    uniqueVisitors: '#2dd4bf',
    device: { PHONE: '#60a5fa', DESKTOP: '#a78bfa', TABLET: '#2dd4bf', UNKNOWN: '#64748b' },
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

// Backend buckets in the user's timezone and emits ISO strings with `Z` whose digits
// match wall-clock-in-tz. Parsing as UTC and formatting with `timeZone: 'UTC'` below
// reproduces the user's local label without further conversion.
//
// `uniqueVisitors` is COUNT(DISTINCT visitor_hash) for the bucket on dynamic
// ranges, and null on the All-Time monthly view (link_stats_monthly doesn't
// carry distinct-hash data). The Unique Visitors series is conditionally
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
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const p = PALETTE[theme === 'dark' ? 'dark' : 'light'];
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
  // Unique Visitors series is hidden on the All-Time monthly view — the backing
  // table (link_stats_monthly) holds no per-month distinct-hash data.
  const showUnique = !isAllTime;
  const link = state?.link;
  const shortUrl = link?.shortUrl ?? `/${shortKey}`;
  const displayShortUrl = shortUrl.replace(/^https?:\/\//, '');

  const copyShortUrl = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      pushToast({ type: 'error', title: 'Copy failed' });
    }
  };

  return (
    <div className="animate-fade-in flex min-h-screen flex-col bg-background">
      <TopNav />

      <main className="mx-auto w-full max-w-max-width flex-1 px-gutter py-margin md:py-lg">
        {/* Header */}
        <button
          onClick={() => navigate('/links')}
          className="mb-5 inline-flex items-center gap-1 text-body-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_back
          </span>
          Back to My Links
        </button>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="text-label-caps uppercase text-secondary">Link analytics</div>
            <div className="mt-1.5 flex items-center gap-2">
              <h1 className="min-w-0 truncate text-headline-lg-mobile md:text-headline-lg">
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono font-bold text-primary hover:underline"
                  title={shortUrl}
                >
                  {displayShortUrl}
                </a>
              </h1>
              <button
                type="button"
                onClick={copyShortUrl}
                aria-label="Copy short link"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
            {link?.originalUrl && (
              <p className="mt-1.5 truncate text-body-sm text-on-surface-variant" title={link.originalUrl}>
                Redirects to {link.originalUrl}
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
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
          <div className="mt-6 grid place-items-center rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl shadow-soft">
            <Spinner size={22} color="rgb(37 99 235)" label="Loading analytics…" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-error/30 bg-error-container/40 p-md text-on-error-container">
            <div className="flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined">error</span>
              Could not load analytics
            </div>
            <p className="mt-1 text-body-sm">{error}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="rounded-lg border border-error/30 bg-surface-container-lowest px-3 py-1.5 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
              >
                Retry
              </button>
              <Link
                to="/links"
                className="rounded-lg px-3 py-1.5 text-body-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
              >
                Back to My Links
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-12 md:items-start">
            <Stat
              className="md:col-span-6"
              label="Total clicks"
              value={totalClicks}
              icon="ads_click"
              tone={p.total}
            />
            <Stat
              className="md:col-span-6"
              label="New visitors"
              value={newVisitors}
              icon="person_add"
              tone={p.uniqueVisitors}
            />

            <Card className="md:col-span-12">
              <CardHeader title="Traffic overview" subtitle="Clicks and visitors over the selected range">
                <div className="flex flex-wrap items-center gap-3">
                  <Legend showUnique={showUnique} p={p} />
                  <TimezoneBadge tz={userTz} />
                </div>
              </CardHeader>
              <div className="h-72 w-full">
                {series.length === 0 ? (
                  <EmptyChart message="No clicks yet for this range." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={series} margin={{ top: 12, right: 8, bottom: 0, left: -12 }}>
                      <defs>
                        <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={p.total} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={p.total} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={p.grid} vertical={false} />
                      <XAxis
                        dataKey="ts"
                        stroke={p.grid}
                        tick={{ fontSize: 12, fill: p.axisText }}
                        tickFormatter={(v) => formatTick(v, granularity)}
                        tickLine={false}
                        axisLine={{ stroke: p.grid }}
                        dy={6}
                        minTickGap={24}
                      />
                      <YAxis
                        stroke={p.grid}
                        tick={{ fontSize: 12, fill: p.axisText }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={44}
                      />
                      <Tooltip
                        cursor={{ stroke: p.axisText, strokeOpacity: 0.25, strokeWidth: 1 }}
                        content={<MetricTooltip granularity={granularity} p={p} />}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total clicks"
                        stroke={p.total}
                        strokeWidth={2.5}
                        fill="url(#fillTotal)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: p.tooltipBg }}
                      />
                      <Line
                        type="monotone"
                        dataKey="newVisitors"
                        name="New visitors"
                        stroke={p.newVisitors}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: p.tooltipBg }}
                      />
                      {showUnique && (
                        <Line
                          type="monotone"
                          dataKey="uniqueVisitors"
                          name="Unique visitors"
                          stroke={p.uniqueVisitors}
                          strokeWidth={2}
                          strokeDasharray="3 4"
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 2, stroke: p.tooltipBg }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="md:col-span-6">
              <CardHeader title="Top countries" />
              <RowChart
                items={(data?.topCountries ?? []).map((c) => ({
                  label: countryName(c.country),
                  total: Number(c.total ?? 0),
                  newVisitors: Number(c.newVisitors ?? 0),
                }))}
                accent={p.total}
                track={p.track}
                emptyText="No country data yet."
              />
            </Card>

            <Card className="md:col-span-6">
              <CardHeader title="Top cities" />
              <RowChart
                items={(data?.topCities ?? []).map((c) => ({
                  label: c.city || 'Unknown',
                  sub: countryName(c.country),
                  total: Number(c.total ?? 0),
                  newVisitors: Number(c.newVisitors ?? 0),
                }))}
                accent={p.uniqueVisitors}
                track={p.track}
                emptyText="No city data yet."
              />
            </Card>

            <Card className="md:col-span-12">
              <CardHeader title="Device breakdown" />
              <DeviceBreakdown devices={data?.deviceBreakdown ?? []} p={p} />
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
      className="flex w-full rounded-lg border border-outline-variant bg-surface-container-low p-1 md:inline-flex md:w-auto"
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
              'flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-body-sm transition-all md:flex-initial ' +
              (active
                ? 'bg-surface-container-lowest font-semibold text-on-surface shadow-soft'
                : disabled
                  ? 'cursor-not-allowed text-secondary opacity-60'
                  : 'font-medium text-on-surface-variant hover:text-on-surface')
            }
          >
            <span className="inline-flex items-center gap-1.5">
              {opt.label}
              {opt.comingSoon && (
                <span className="rounded-full bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
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
        'rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-soft ' +
        className
      }
    >
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-headline-md text-on-surface">{title}</h2>
        {subtitle && <p className="mt-0.5 text-body-sm text-on-surface-variant">{subtitle}</p>}
      </div>
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

function Legend({ showUnique = true, p }) {
  return (
    <div className="hidden gap-4 text-body-sm text-on-surface-variant sm:flex">
      <LegendDot color={p.total} label="Total clicks" />
      <LegendDot color={p.newVisitors} label="New visitors" />
      {showUnique && <LegendDot color={p.uniqueVisitors} label="Unique visitors" />}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Stat({ label, value, icon, tone, className = '' }) {
  return (
    <div
      className={
        'relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-soft ' +
        className
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-label-caps uppercase text-secondary">{label}</span>
        <span
          className="grid h-9 w-9 place-items-center rounded-lg"
          style={{ background: `${tone}1f`, color: tone }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
        </span>
      </div>
      <div className="tnum mt-3 text-[40px] font-extrabold leading-none tracking-tight text-on-surface">
        {Number(value).toLocaleString()}
      </div>
    </div>
  );
}

function RowChart({ items, accent, track, emptyText }) {
  if (!items || items.length === 0) {
    return <EmptyChart message={emptyText} />;
  }
  const max = Math.max(...items.map((i) => i.total)) || 1;
  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item, idx) => {
        const pct = (item.total / max) * 100;
        const opacity = Math.max(0.45, 1 - idx * 0.1);
        return (
          <li key={`${item.label}-${idx}`} className="group">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 text-body-sm text-on-surface sm:w-[150px] sm:flex-shrink-0">
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
                  className="relative h-2.5 flex-1 overflow-hidden rounded-full"
                  style={{ background: track }}
                  title={`${item.total.toLocaleString()} clicks · ${item.newVisitors.toLocaleString()} new`}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: accent, opacity }}
                  />
                </div>
                <div className="tnum w-14 text-right text-body-sm font-semibold text-on-surface sm:w-20">
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

function DeviceBreakdown({ devices, p }) {
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
    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
      <div className="relative h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: p.tooltipBg,
                border: `1px solid ${p.tooltipBorder}`,
                borderRadius: 12,
                fontSize: 12,
                color: p.tooltipText,
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)',
              }}
              labelStyle={{ color: p.tooltipText }}
              itemStyle={{ color: p.tooltipText }}
              formatter={(value, name, item) => {
                const pct = item?.payload?.pct ?? 0;
                return [`${pct.toFixed(1)}% (${Number(value).toLocaleString()})`, titleCase(name)];
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke={p.pieStroke}
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={p.device[entry.name] ?? p.device.UNKNOWN} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tnum text-headline-md font-extrabold text-on-surface">
            {total.toLocaleString()}
          </span>
          <span className="text-label-caps uppercase text-secondary">Clicks</span>
        </div>
      </div>
      <ul className="space-y-2">
        {data.map((d) => (
          <li
            key={d.name}
            className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-2.5"
          >
            <span className="flex items-center gap-2.5 text-body-sm text-on-surface">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: p.device[d.name] ?? p.device.UNKNOWN }}
              />
              {titleCase(d.name)}
            </span>
            <span className="tnum text-body-sm font-semibold text-on-surface">
              {d.pct.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function titleCase(s) {
  if (!s) return '';
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function EmptyChart({ message }) {
  return (
    <div className="grid h-full min-h-[160px] place-items-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-8 text-body-sm text-secondary">
      {message}
    </div>
  );
}

// Custom tooltip — iterates Recharts' payload directly. payload contains one
// entry per series currently rendered, so we get 3 rows on dynamic ranges and
// 2 on All-Time without any in-tooltip conditionals.
function MetricTooltip({ active, payload, label, granularity, p }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: p.tooltipBg,
        border: `1px solid ${p.tooltipBorder}`,
        borderRadius: 12,
        color: p.tooltipText,
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)',
        padding: '10px 12px',
        fontSize: 12,
        minWidth: 184,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 3 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: 'inline-block' }} />
        {label}
      </span>
      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}
