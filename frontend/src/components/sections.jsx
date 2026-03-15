import { Suspense, lazy } from 'react'
import { LogoMark, Meter, ProviderBadge, SectionFrame, SkillChip, Tabs, formatPercentValue } from './ui'

const GapRadarChart = lazy(() => import('./GapRadarChart'))

export function HeroHeader({ isAuthenticated, onLogout, onOpenLogin, onOpenRegister, onGetStarted }) {
  return (
    <header className="panel overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(74,222,128,0.14),transparent_24%)]" />
      <div className="relative border-b border-white/10 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <LogoMark className="h-14 w-14 rounded-2xl shadow-lg shadow-cyan-500/10" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">CareerAI</p>
              <h1 className="text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">AI-Powered Career Intelligence Platform</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`status-pill ${isAuthenticated ? 'status-live' : 'status-idle'}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${isAuthenticated ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              {isAuthenticated ? 'Signed in' : 'Login required'}
            </span>
            {isAuthenticated ? (
              <button type="button" onClick={onLogout} className="btn btn-ghost">
                Sign out
              </button>
            ) : (
              <>
                <button type="button" onClick={onOpenLogin} className="btn btn-ghost">
                  Login
                </button>
                <button type="button" onClick={onOpenRegister} className="btn btn-primary">
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative grid gap-8 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-5">
          <div className="space-y-3">
            <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl lg:text-[2.65rem]">
              Map your next role with a cleaner look, softer branding, and readable typography.
            </h2>
            <p className="max-w-2xl text-[15px] leading-7 text-slate-300">
              Upload a resume or enter your skills manually, get ranked career matches, inspect the reasoning, and generate a polished PDF report from the same dark dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[13px] text-slate-300">
            <span className="mini-stat">AI recommendations</span>
            <span className="mini-stat">Explainable scores</span>
            <span className="mini-stat">Learning links</span>
          </div>
          {isAuthenticated ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-400 px-6 py-3 text-[15px] font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/35 active:scale-95"
              >
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="metric-card">
            <p className="metric-label">Role quality filter</p>
            <p className="metric-value">Strict</p>
            <p className="metric-note">Only evidence-backed role matches are shown from your skills and resume.</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Learning support</p>
            <p className="metric-value">3x</p>
            <p className="metric-note">Every missing skill can pull links from multiple providers.</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Export ready</p>
            <p className="metric-value">PDF</p>
            <p className="metric-note">Generate a shareable report once recommendations are ready.</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export function DashboardSectionNav({ isAuthenticated, activeSection, setActiveSection, dashboardItems }) {
  if (isAuthenticated) {
    const compactKeys = new Set(['auth', 'input', 'recommendations'])
    const compactItems = dashboardItems.filter((item) => compactKeys.has(item.key))
    const overflowItems = dashboardItems.filter((item) => !compactKeys.has(item.key))
    const overflowActiveValue = overflowItems.some((item) => item.key === activeSection) ? activeSection : ''

    return (
      <section className="relative z-20 mb-5">
        <div className="overflow-x-auto">
          <div className="flex w-full min-w-max items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/85 px-3 py-2">
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className={`rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
              activeSection === 'dashboard'
                ? 'bg-cyan-400/15 text-cyan-200'
                : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
            }`}
          >
            Dashboard
          </button>
          {compactItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => item.enabled && setActiveSection(item.key)}
              disabled={!item.enabled}
              className={`rounded-lg px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                activeSection === item.key
                  ? 'bg-cyan-400/15 text-cyan-200'
                  : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
              } ${!item.enabled ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              {item.label}
            </button>
          ))}
          {overflowItems.length > 0 ? (
            <div className="ml-auto min-w-[190px]">
              <select
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-300 outline-none transition focus:border-cyan-400/40"
                value={overflowActiveValue}
                onChange={(event) => setActiveSection(event.target.value)}
              >
                <option value="" disabled>More sections</option>
                {overflowItems.map((item) => (
                  <option key={item.key} value={item.key} disabled={!item.enabled}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-4">
      <p className="text-sm text-slate-300">Please sign in or create an account to access the platform.</p>
    </section>
  )
}

export function AuthSection({ activeSection, isAuthenticated, authTab, setAuthTab, auth, setAuth, onLogin, onRegister, loading }) {
  if (activeSection !== 'auth') {
    return null
  }

  return (
    <SectionFrame step="01" title="Authentication" hint="Create an account or sign in to keep your recommendation history.">
      <div className="space-y-5">
        <Tabs
          items={[
            { key: 'login', label: 'Sign in' },
            { key: 'register', label: 'Register' },
          ]}
          active={authTab}
          onChange={setAuthTab}
        />

        <input type="text" name="fake-username" autoComplete="username" className="hidden" tabIndex={-1} />
        <input type="password" name="fake-password" autoComplete="current-password" className="hidden" tabIndex={-1} />

        <div className={`grid gap-4 ${authTab === 'register' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {authTab === 'register' ? (
            <label className="field-wrap">
              <span className="field-label">Full name</span>
              <input
                className="field-input"
                autoComplete="off"
                name="careerai_name"
                placeholder="Jane Doe"
                value={auth.name}
                onChange={(event) => setAuth((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
          ) : null}

          <label className="field-wrap">
            <span className="field-label">Email</span>
            <input
              className="field-input"
              autoComplete="off"
              name="careerai_email"
              placeholder="you@example.com"
              value={auth.email}
              onChange={(event) => setAuth((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>

          <label className="field-wrap">
            <span className="field-label">Password</span>
            <input
              className="field-input"
              type="password"
              autoComplete="new-password"
              name="careerai_password"
              placeholder="Use a secure password"
              value={auth.password}
              onChange={(event) => setAuth((prev) => ({ ...prev, password: event.target.value }))}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          {authTab === 'login' ? (
            <button type="button" onClick={onLogin} disabled={loading} className="btn btn-primary">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          ) : (
            <button type="button" onClick={onRegister} disabled={loading} className="btn btn-primary">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          )}
        </div>
      </div>
    </SectionFrame>
  )
}

export function InputSection({ isAuthenticated, activeSection, inputTab, setInputTab, manualSkills, setManualSkills, onManualRecommend, loading, resumeFile, setResumeFile, onUploadResume }) {
  if (!(isAuthenticated && activeSection === 'input')) {
    return null
  }

  return (
    <SectionFrame step="02" title="Input your skills" hint="Choose between a resume upload and direct skill entry.">
      <div className="space-y-5">
        <Tabs
          items={[
            { key: 'manual', label: 'Manual entry' },
            { key: 'upload', label: 'Resume upload' },
          ]}
          active={inputTab}
          onChange={setInputTab}
        />

        {inputTab === 'manual' ? (
          <div className="space-y-4">
            <label className="field-wrap">
              <span className="field-label">Skills</span>
              <input
                className="field-input"
                value={manualSkills}
                onChange={(event) => setManualSkills(event.target.value)}
                placeholder=""
              />
            </label>
            <button type="button" onClick={onManualRecommend} disabled={loading} className="btn btn-accent">
              {loading ? 'Working...' : 'Generate recommendations'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="upload-area">
              <LogoMark className="h-16 w-16 rounded-3xl" />
              <div className="space-y-1 text-center">
                <p className="text-lg font-semibold text-slate-50">Drop your resume here or browse</p>
                <p className="text-sm text-slate-400">Supported formats: PDF, DOCX, TXT</p>
                {resumeFile ? <p className="text-sm font-semibold text-cyan-200">Selected file: {resumeFile.name}</p> : null}
              </div>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
            </label>
            <button type="button" onClick={onUploadResume} disabled={!resumeFile || loading} className="btn btn-primary">
              {loading ? 'Parsing resume...' : 'Parse and recommend'}
            </button>
          </div>
        )}
      </div>
    </SectionFrame>
  )
}

export function ProfileSection({ isAuthenticated, activeSection, profile }) {
  if (!(isAuthenticated && activeSection === 'profile' && profile)) {
    return null
  }

  return (
    <SectionFrame step="03" title="Candidate profile" hint="Normalized profile extracted from the latest input.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-sky-500 text-2xl font-bold text-slate-950">
              {(profile.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-50">{profile.name || 'Unknown candidate'}</p>
              <p className="text-sm text-slate-400">{profile.email || 'No email captured'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Detected skills</p>
          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).map((skill) => (
              <SkillChip key={skill}>{skill}</SkillChip>
            ))}
          </div>
        </div>
      </div>
    </SectionFrame>
  )
}

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
          <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-400">Loading chart...</div>}>
            <GapRadarChart chartData={chartData} />
          </Suspense>
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
