import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'

export function GapRadarChart({ chartData }) {
  return (
    <ResponsiveContainer>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
        <PolarRadiusAxis tick={{ fontSize: 10, fill: '#64748b' }} />
        <Radar
          name="Importance"
          dataKey="importance"
          stroke="#67e8f9"
          fill="#22d3ee"
          fillOpacity={0.35}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export default GapRadarChart
