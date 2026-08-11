"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export interface ChartDataRow {
  label: string
  value: number
}

const PALETTE = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#ec4899", "#64748b"]

function detectNumericValue(value: unknown): number | null {
  if (typeof value === "number" && isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(String(value).replace(/[^0-9.-]/g, ""))
    if (isFinite(n)) return n
  }
  return null
}

const LABEL_KEYS = ["label", "name", "crop", "commodity", "location", "category", "group", "member", "code", "metric-name"]
const METRIC_SUBSTRINGS = [
  "totalVolumeKg", "totalValueUGX", "totalRevenueUGX", "farmerCount",
  "transactions", "attendance", "amount", "volume", "revenue", "value", "count", "balance",
]

export function buildChartRows(rows: Array<Record<string, unknown>>): ChartDataRow[] {
  const chartable = rows
    .map((row) => {
      const label = pickLabel(row)
      const value = detectValue(row)
      if (!label || value === null) return null
      return { label, value }
    })
    .filter((r): r is { label: string; value: number } => r !== null)
  return chartable.map((r) => ({ label: r.label, value: r.value }))
}

function pickLabel(row: Record<string, unknown>): string {
  for (const key of Object.keys(row)) {
    if (LABEL_KEYS.includes(key.toLowerCase())) {
      const v = row[key]
      if (typeof v === "string" && v.trim() !== "" && detectNumericValue(v) === null) return v
    }
  }
  return ""
}

function detectValue(row: Record<string, unknown>): number | null {
  const keys = Object.keys(row)
  for (const substr of METRIC_SUBSTRINGS) {
    const hit = keys.find((k) => k.toLowerCase().includes(substr))
    if (hit) {
      const n = detectNumericValue(row[hit])
      if (n !== null) return n
    }
  }
  for (let i = 0; i < keys.length; i++) {
    const n = detectNumericValue(row[keys[i]])
    if (n !== null) return n
  }
  return null
}

export function detectChartType(rows: Array<Record<string, unknown>>): "bar" | "line" | "pie" | null {
  const chartRows = buildChartRows(rows)
  if (chartRows.length === 0) return null
  if (chartRows.length <= 6) return "pie"
  return "bar"
}

export function KpiCards({ data }: { data: Array<Record<string, unknown>> }) {
  const rows = buildChartRows(data)
  const total = rows.reduce((acc, r) => acc + r.value, 0)
  if (!rows.length) return null
  const top = [...rows].sort((a, b) => b.value - a.value)[0]
  const max = Math.max(...rows.map((r) => r.value), 1)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Total Categories</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{rows.length.toLocaleString()}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Sum</p>
        <p className="mt-1 text-2xl font-bold text-green-600">{total.toLocaleString()}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Largest</p>
        <p className="mt-1 text-2xl font-bold text-blue-600">{max.toLocaleString()}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Top Group</p>
        <p className="mt-1 truncate text-sm font-semibold text-amber-600" title={top.label}>
          {top.label}
        </p>
      </div>
    </div>
  )
}

export function ReportChart({ rows }: { rows: Array<Record<string, unknown>> }) {
  const type = detectChartType(rows)
  const data = buildChartRows(rows)
  if (!type || !data.length) return null

  if (type === "pie") {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius="72%" label>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => Number(value).toLocaleString()} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === "line" ? (
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => Number(value).toLocaleString()} />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: "#f1f5f9" }} formatter={(value) => Number(value).toLocaleString()} />
            <Legend />
            <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}