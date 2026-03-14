import { LogoMark } from '../ui'

export function HeroHeader({ isAuthenticated, onLogout }) {
  return (
    <header className="panel overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(244,114,182,0.12),transparent_24%)]" />
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
            ) : null}
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
        </div>

        <div className="grid items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="metric-card">
            <p className="metric-label">Top role slots</p>
            <p className="metric-value">5</p>
            <p className="metric-note">Balanced ranking from hybrid recommendation methods.</p>
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
    return (
      <section className="panel px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Workspace dashboard</p>
            <h2 className="text-xl font-semibold text-slate-50">Open a section</h2>
          </div>
          {activeSection !== 'dashboard' ? (
            <button type="button" onClick={() => setActiveSection('dashboard')} className="btn btn-ghost">
              Back to dashboard
            </button>
          ) : null}
        </div>
        <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => item.enabled && setActiveSection(item.key)}
              disabled={!item.enabled}
              className={`h-full min-h-[96px] rounded-2xl border px-4 py-4 text-left transition ${
                activeSection === item.key
                  ? 'border-cyan-400/40 bg-cyan-400/10'
                  : 'border-white/10 bg-slate-950/60 hover:border-cyan-400/25 hover:bg-slate-900/70'
              } ${!item.enabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <p className="text-sm font-semibold text-slate-100">{item.label}</p>
              <p className="mt-1 text-xs text-slate-400">{item.hint}</p>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="panel px-6 py-6">
      <p className="text-sm text-slate-300">Please sign in or create an account to access the platform.</p>
    </section>
  )
}
