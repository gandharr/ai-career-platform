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
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis
            dataKey="skill"
            tick={{ fontSize: 11, fill: '#cbd5e1' }}
            tickFormatter={(value) => (typeof value === 'string' && value.length > 16 ? `${value.slice(0, 16)}…` : value)}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip
            formatter={(value) => [`${Number(value || 0).toFixed(1)}%`, 'Importance']}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #64748b',
              background: 'rgba(15,23,42,0.96)',
              color: '#e2e8f0',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="importance" radius={[8, 8, 0, 0]} fill="#60a5fa" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer>
      <RadarChart data={chartData} outerRadius="72%">
        <PolarGrid stroke="#64748b" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fontSize: 11, fill: '#e2e8f0', fontWeight: 600 }}
          tickFormatter={(value) => (typeof value === 'string' && value.length > 14 ? `${value.slice(0, 14)}…` : value)}
        />
        <PolarRadiusAxis domain={[0, 100]} tickCount={6} tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <Tooltip
          formatter={(value) => [`${Number(value || 0).toFixed(1)}%`, 'Importance']}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #64748b',
            background: 'rgba(15,23,42,0.96)',
            color: '#e2e8f0',
            fontSize: '12px',
          }}
        />
        <Radar
          name="Importance"
          dataKey="importance"
          stroke="#60a5fa"
          fill="#60a5fa"
          fillOpacity={0.24}
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#93c5fd', stroke: '#ffffff', strokeWidth: 1 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export default GapRadarChart
