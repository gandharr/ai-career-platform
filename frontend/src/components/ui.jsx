const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

export function formatPercentValue(value) {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(100, value * 100)) : 0
  return `${percentFormatter.format(normalized)}%`
}

export function LogoMark({ className = 'h-12 w-12' }) {
  return <img src="/logo.svg" alt="CareerAI logo" className={className} />
}

export function Tabs({ items, active, onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-white/10 bg-slate-950/70 p-1 shadow-inner shadow-black/20">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            active === item.key
              ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function SectionFrame({ step, title, hint, children }) {
  return (
    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-sm font-bold text-cyan-300 ring-1 ring-cyan-400/25">
            {step}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step {step}</p>
            <h2 className="text-xl font-semibold text-slate-50">{title}</h2>
          </div>
        </div>
        {hint ? <p className="text-sm text-slate-400">{hint}</p> : null}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  )
}

export function SkillChip({ children, tone = 'default' }) {
  const toneClass = {
    default: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  }

  return <span className={`chip ${toneClass[tone]}`}>{children}</span>
}

export function ProviderBadge({ provider }) {
  const map = {
    YouTube: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
    Coursera: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
    Udemy: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  }

  return <span className={`chip ${map[provider] || 'border-white/10 bg-white/5 text-slate-200'}`}>{provider}</span>
}

export function Meter({ value, label, accentClass = 'from-cyan-400 to-sky-400' }) {
  const widthValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value * 100)) : 0
  const width = `${widthValue}%`
  const displayValue = formatPercentValue(value)

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2 text-sm">
        <span className="min-w-0 break-words leading-tight text-slate-300">{label}</span>
        <span className="shrink-0 whitespace-nowrap text-right font-semibold tabular-nums text-slate-100">{displayValue}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full bg-gradient-to-r ${accentClass}`} style={{ width }} />
      </div>
    </div>
  )
}
