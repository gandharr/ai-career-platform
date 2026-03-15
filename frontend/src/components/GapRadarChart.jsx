import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

export function GapRadarChart({ chartData }) {
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">No skill-gap data available.</div>
  }

  if (chartData.length < 3) {
    return (
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 12, right: 18, left: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis
            dataKey="skill"
            tick={{ fontSize: 11, fill: '#334155' }}
            tickFormatter={(value) => (typeof value === 'string' && value.length > 16 ? `${value.slice(0, 16)}…` : value)}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#475569' }} />
          <Tooltip
            formatter={(value) => [`${Number(value || 0).toFixed(1)}%`, 'Importance']}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #86efac',
              background: 'rgba(255,255,255,0.96)',
              color: '#0f172a',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="importance" radius={[8, 8, 0, 0]} fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer>
      <RadarChart data={chartData} outerRadius="72%">
        <PolarGrid stroke="#94a3b8" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fontSize: 11, fill: '#1f2937', fontWeight: 600 }}
          tickFormatter={(value) => (typeof value === 'string' && value.length > 14 ? `${value.slice(0, 14)}…` : value)}
        />
        <PolarRadiusAxis domain={[0, 100]} tickCount={6} tick={{ fontSize: 10, fill: '#475569' }} />
        <Tooltip
          formatter={(value) => [`${Number(value || 0).toFixed(1)}%`, 'Importance']}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #86efac',
            background: 'rgba(255,255,255,0.96)',
            color: '#0f172a',
            fontSize: '12px',
          }}
        />
        <Radar
          name="Importance"
          dataKey="importance"
          stroke="#15803d"
          fill="#22c55e"
          fillOpacity={0.28}
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#166534', stroke: '#ffffff', strokeWidth: 1 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export default GapRadarChart
