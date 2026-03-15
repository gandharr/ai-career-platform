const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

export function formatPercentValue(value) {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(100, value * 100)) : 0
  return `${percentFormatter.format(normalized)}%`
}

export function LogoMark({ className = 'h-12 w-12' }) {
  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return <img src={`${normalizedBaseUrl}logo.svg`} alt="CareerAI logo" className={className} />
}

export function Tabs({ items, active, onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-emerald-200 bg-emerald-50 p-1 shadow-sm shadow-emerald-100">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            active === item.key
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-300/60'
              : 'text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700 ring-1 ring-emerald-300/70">
            {step}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step {step}</p>
            <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
          </div>
        </div>
        {hint ? <p className="text-sm text-slate-600">{hint}</p> : null}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  )
}

export function SkillChip({ children, tone = 'default' }) {
  const toneClass = {
    default: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    success: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    danger: 'border-rose-300 bg-rose-50 text-rose-700',
  }

  return <span className={`chip ${toneClass[tone]}`}>{children}</span>
}

export function ProviderBadge({ provider }) {
  const map = {
    YouTube: 'border-rose-300 bg-rose-50 text-rose-700',
    Coursera: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    Udemy: 'border-amber-300 bg-amber-50 text-amber-700',
  }

  return <span className={`chip ${map[provider] || 'border-slate-300 bg-white text-slate-700'}`}>{provider}</span>
}

export function Meter({ value, label, accentClass = 'from-cyan-400 to-sky-400' }) {
  const widthValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value * 100)) : 0
  const width = `${widthValue}%`
  const displayValue = formatPercentValue(value)

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2 text-sm">
        <span className="min-w-0 break-words leading-tight text-slate-700">{label}</span>
        <span className="shrink-0 whitespace-nowrap text-right font-semibold tabular-nums text-slate-800">{displayValue}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
        <div className={`h-full rounded-full bg-gradient-to-r ${accentClass}`} style={{ width }} />
      </div>
    </div>
  )
}
