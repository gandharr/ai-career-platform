import { LogoMark, SectionFrame, SkillChip, Tabs } from '../ui'

export function AuthSection({ activeSection, isAuthenticated, authTab, setAuthTab, auth, setAuth, onLogin, onRegister, loading }) {
  if (!(activeSection === 'auth' || !isAuthenticated)) {
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
