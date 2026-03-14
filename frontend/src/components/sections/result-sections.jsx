import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { Meter, ProviderBadge, SectionFrame, SkillChip, formatPercentValue } from '../ui'

export function RecommendationsSection({ isAuthenticated, activeSection, recommendations, selectedRole, setSelectedRole, onAnalyzeGap, onExportPdf, loading }) {
  if (!(isAuthenticated && activeSection === 'recommendations' && recommendations.length > 0)) {
    return null
  }

  return (
    <SectionFrame step="04" title="Career recommendations" hint="Select a role to inspect the gap and learning path.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((item, index) => {
            const active = selectedRole === item.role
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => setSelectedRole(item.role)}
                className={`rounded-3xl border p-5 text-left transition ${
                  active
                    ? 'border-cyan-400/40 bg-cyan-400/10 shadow-lg shadow-cyan-500/10'
                    : 'border-white/10 bg-slate-950/60 hover:border-cyan-400/20 hover:bg-slate-900/70'
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-50">{item.role}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{item.reason}</p>
                  </div>
                  {index === 0 ? <span className="tag-pill">Top pick</span> : null}
                </div>
                <Meter value={item.confidence} label="Confidence" />
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onAnalyzeGap} disabled={!selectedRole || loading} className="btn btn-primary">
            Analyze gap for {selectedRole || 'selected role'}
          </button>
          <button type="button" onClick={onExportPdf} className="btn btn-ghost">
            Export PDF
          </button>
        </div>
      </div>
    </SectionFrame>
  )
}

export function ExplainabilitySection({ isAuthenticated, activeSection, recommendations, explainability }) {
  if (!(isAuthenticated && activeSection === 'explainability' && recommendations.length > 0)) {
    return null
  }

  return (
    <SectionFrame step="05" title="Explainability" hint="See the skill matches and contribution by recommendation method.">
      <div className="grid gap-4 xl:grid-cols-2">
        {recommendations.map((item) => {
          const xai = explainability[item.role] || {}
          return (
            <div key={`${item.role}-xai`} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-50">{item.role}</h3>
                <span className="text-sm font-semibold tabular-nums text-cyan-200">{formatPercentValue(item.confidence)}</span>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="field-label">Matched skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(xai.matched || []).length > 0 ? (
                      (xai.matched || []).map((skill) => (
                        <SkillChip key={`${item.role}-matched-${skill}`} tone="success">{skill}</SkillChip>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No matched skills surfaced.</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="field-label">Missing skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(xai.missing || []).length > 0 ? (
                      (xai.missing || []).map((skill) => (
                        <SkillChip key={`${item.role}-missing-${skill}`} tone="danger">{skill}</SkillChip>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No missing skills surfaced.</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <Meter value={item.method_scores?.content ?? 0} label="Content model" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <Meter value={item.method_scores?.collaborative ?? 0} label="Collaborative" accentClass="from-fuchsia-400 to-rose-400" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <Meter value={item.method_scores?.bert ?? 0} label="Semantic model" accentClass="from-emerald-400 to-cyan-400" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SectionFrame>
  )
}

export function GapSection({ isAuthenticated, activeSection, gapReport, chartData }) {
  if (!(isAuthenticated && activeSection === 'gap' && gapReport.length > 0)) {
    return null
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionFrame step="06" title="Missing skills" hint="Priority gaps for the role you selected.">
        <div className="space-y-4">
          {gapReport.map((item) => (
            <div key={item.skill} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <Meter value={item.importance} label={item.skill} accentClass="from-rose-400 to-amber-400" />
            </div>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame step="07" title="Skill radar" hint="A quick visual read of missing-skill importance.">
        <div className="h-80">
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
        </div>
      </SectionFrame>
    </div>
  )
}

export function LearningSection({ isAuthenticated, activeSection, resources }) {
  if (!(isAuthenticated && activeSection === 'learning' && resources.length > 0)) {
    return null
  }

  return (
    <SectionFrame step="08" title="Learning path" hint="Resource links for each missing skill.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((item, index) => (
          <a
            key={`${item.skill}-${index}`}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-400/25 hover:bg-slate-900/70"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <ProviderBadge provider={item.provider} />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Open link</span>
            </div>
            <p className="text-base font-semibold text-slate-50">{item.title}</p>
            <p className="mt-2 text-sm capitalize text-slate-400">Skill: {item.skill}</p>
          </a>
        ))}
      </div>
    </SectionFrame>
  )
}

export function HistorySection({ isAuthenticated, activeSection, profileHistory }) {
  if (!(isAuthenticated && activeSection === 'history' && profileHistory.length > 0)) {
    return null
  }

  return (
    <SectionFrame step="09" title="Saved history" hint="Recent recommendation scores from your account.">
      <div className="space-y-3">
        {profileHistory.map((item, index) => (
          <div key={`${item.role}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 font-semibold text-cyan-200 ring-1 ring-cyan-400/20">
                {index + 1}
              </div>
              <div>
                <p className="font-semibold text-slate-100">{item.role}</p>
                <p className="text-sm text-slate-400">Recommendation score</p>
              </div>
            </div>
            <span className="tag-pill tabular-nums">{formatPercentValue(item.score)}</span>
          </div>
        ))}
      </div>
    </SectionFrame>
  )
}
