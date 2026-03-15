import { useEffect, useMemo, useRef, useState } from 'react'
import {
  warmUpBackend,
  getLearningPath,
  getSkillGap,
  loginUser,
  parseResume,
  recommendCareers,
  registerUser,
  setAuthToken,
} from './api'
import { formatPercentValue } from './components/ui'
import {
  AuthSection,
  DashboardSectionNav,
  ExplainabilitySection,
  GapSection,
  HeroHeader,
  InputSection,
  LearningSection,
  ProfileSection,
  RecommendationsSection,
} from './components/sections'

function App() {
  const [resumeFile, setResumeFile] = useState(null)
  const [profile, setProfile] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [selectedRole, setSelectedRole] = useState('')
  const [gapReport, setGapReport] = useState([])
  const [resources, setResources] = useState([])
  const [explainability, setExplainability] = useState({})
  const [manualSkills, setManualSkills] = useState('')
  const [auth, setAuth] = useState({ name: '', email: '', password: '' })
  const [token, setToken] = useState(sessionStorage.getItem('career_token') || '')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Processing your request...')
  const [backendReady, setBackendReady] = useState(false)
  const [backendWarming, setBackendWarming] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [authTab, setAuthTab] = useState('login')
  const [inputTab, setInputTab] = useState('manual')
  const [activeSection, setActiveSection] = useState('dashboard')
  const flashTimeoutRef = useRef(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.classList.remove('theme-light')
    localStorage.setItem('career_theme', 'dark')
  }, [])

  useEffect(() => {
    setAuthToken(token || '')
  }, [token])

  useEffect(() => {
    if (!token) {
      setActiveSection('auth')
    }
  }, [token])

  useEffect(() => {
    localStorage.removeItem('career_token')

    const timerId = window.setTimeout(() => {
      setAuth({ name: '', email: '', password: '' })
    }, 120)

    return () => window.clearTimeout(timerId)
  }, [])

  const ensureBackendReady = async () => {
    if (backendReady) {
      return true
    }

    setBackendWarming(true)
    const ok = await warmUpBackend()
    setBackendWarming(false)
    setBackendReady(ok)

    if (!ok) {
      setError('Backend is waking up. Please wait a few seconds and try again.')
      return false
    }
    return true
  }

  useEffect(() => {
    void ensureBackendReady()
  }, [])

  const chartData = useMemo(
    () => gapReport.map((item) => ({ skill: item.skill, importance: item.importance * 100 })),
    [gapReport],
  )

  const showMessage = (message) => {
    setSuccessMsg(message)
    window.clearTimeout(flashTimeoutRef.current)
    flashTimeoutRef.current = window.setTimeout(() => setSuccessMsg(''), 3200)
  }

  const getRequestErrorMessage = (requestError, fallback) => {
    const detail = requestError?.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((item) => item?.msg || JSON.stringify(item)).join('; ')
    }
    if (typeof requestError?.message === 'string' && requestError.message.trim()) {
      return requestError.message
    }
    return fallback
  }

  const onUploadResume = async () => {
    if (!resumeFile) return

    setError('')
    setLoadingMessage('Waking backend and parsing resume...')
    setLoading(true)
    try {
      const ready = await ensureBackendReady()
      if (!ready) {
        return
      }

      const parsed = await parseResume(resumeFile)
      setProfile(parsed)

      const rec = await recommendCareers({
        user_id: parsed.email || 'demo-user',
        name: parsed.name,
        skills: parsed.skills,
        experience_years: 0,
        certifications: parsed.certifications || [],
        resume_text: (parsed.raw_text || '').slice(0, 8000),
      })

      setRecommendations(rec.recommendations)
      setExplainability(rec.explainability || {})
      setSelectedRole(rec.recommendations[0]?.role || '')
      setActiveSection('recommendations')
      showMessage('Resume parsed and recommendations generated.')
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Failed to parse the resume and generate recommendations.'))
    } finally {
      setLoading(false)
    }
  }

  const onManualRecommend = async () => {
    setError('')
    setLoadingMessage('Waking backend and generating recommendations...')
    setLoading(true)
    try {
      const ready = await ensureBackendReady()
      if (!ready) {
        return
      }

      const skills = manualSkills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      const parsedProfile = { name: auth.name || 'Manual User', email: auth.email, skills }
      setProfile(parsedProfile)

      const rec = await recommendCareers({
        user_id: parsedProfile.email || 'manual-user',
        name: parsedProfile.name,
        skills,
        experience_years: 0,
      })

      setRecommendations(rec.recommendations)
      setExplainability(rec.explainability || {})
      setSelectedRole(rec.recommendations[0]?.role || '')
      setActiveSection('recommendations')
      showMessage('Recommendations generated from manual skills.')
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Failed to generate recommendations from manual skills.'))
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async () => {
    setError('')
    setLoadingMessage('Connecting to backend...')
    setLoading(true)
    try {
      const ready = await ensureBackendReady()
      if (!ready) {
        return
      }

      const data = await registerUser(auth)
      const accessToken = (data?.access_token || '').trim()
      if (!accessToken) {
        throw new Error('No access token returned')
      }

      sessionStorage.setItem('career_token', accessToken)
      setAuthToken(accessToken)
      setToken(accessToken)
      setActiveSection('dashboard')
      showMessage('Account created successfully.')
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  const onLogin = async () => {
    setError('')
    setLoadingMessage('Connecting to backend...')
    setLoading(true)
    try {
      const ready = await ensureBackendReady()
      if (!ready) {
        return
      }

      const data = await loginUser({ email: auth.email, password: auth.password })
      const accessToken = (data?.access_token || '').trim()
      if (!accessToken) {
        throw new Error('No access token returned')
      }

      sessionStorage.setItem('career_token', accessToken)
      setAuthToken(accessToken)
      setToken(accessToken)

      setActiveSection('dashboard')
      showMessage('Signed in successfully.')
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Login failed.'))
    } finally {
      setLoading(false)
    }
  }

  const onLogout = () => {
    sessionStorage.removeItem('career_token')
    setAuthToken('')
    setToken('')
    setResumeFile(null)
    setProfile(null)
    setRecommendations([])
    setSelectedRole('')
    setGapReport([])
    setResources([])
    setExplainability({})
    setManualSkills('')
    setAuth({ name: '', email: '', password: '' })
    setError('')
    setActiveSection('auth')
    showMessage('Signed out.')
  }

  const onAnalyzeGap = async () => {
    if (!profile || !selectedRole) return

    setError('')
    setLoadingMessage('Analyzing your skill gap...')
    setLoading(true)
    try {
      const ready = await ensureBackendReady()
      if (!ready) {
        return
      }

      const gap = await getSkillGap({ user_skills: profile.skills, target_role: selectedRole })
      setGapReport(gap.missing_skills)

      const learn = await getLearningPath({
        missing_skills: gap.missing_skills.map((item) => item.skill),
      })
      setResources(learn.resources)
      setActiveSection('gap')
      showMessage(`Skill gap ready for ${selectedRole}.`)
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Failed to analyze the skill gap.'))
    } finally {
      setLoading(false)
    }
  }

  const onExportPdf = async () => {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    doc.setFillColor(8, 15, 30)
    doc.rect(0, 0, 210, 34, 'F')
    doc.setTextColor(120, 223, 255)
    doc.setFontSize(20)
    doc.text('CareerAI Report', 14, 20)
    doc.setTextColor(230, 238, 248)
    doc.setFontSize(10)
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28)

    doc.setTextColor(23, 37, 84)
    doc.setFontSize(11)
    doc.text(`Name: ${profile?.name || 'N/A'}`, 14, 48)
    doc.text(`Email: ${profile?.email || 'N/A'}`, 14, 56)
    doc.text(`Skills: ${(profile?.skills || []).join(', ') || 'N/A'}`, 14, 64, { maxWidth: 180 })

    let cursorY = 82
    doc.setFontSize(14)
    doc.text('Recommendations', 14, cursorY)
    cursorY += 10
    doc.setFontSize(10)

    recommendations.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.role} (${formatPercentValue(item.confidence)})`, 16, cursorY)
      cursorY += 6
      doc.text(item.reason, 20, cursorY, { maxWidth: 170 })
      cursorY += 12
    })

    doc.save('career-recommendation-report.pdf')
  }

  const isAuthenticated = Boolean((token || '').trim())
  const showHeroHeader = isAuthenticated && activeSection === 'dashboard'
  const orderedSectionKeys = ['dashboard', 'auth', 'input', 'profile', 'recommendations', 'explainability', 'gap', 'learning']
  const dashboardItems = [
    {
      key: 'auth',
      label: 'Authentication',
      hint: 'Sign in or create account',
      enabled: true,
    },
    {
      key: 'input',
      label: 'Skills Input',
      hint: 'Manual entry or resume upload',
      enabled: isAuthenticated,
    },
    {
      key: 'profile',
      label: 'Candidate Profile',
      hint: 'Extracted name, email, and skills',
      enabled: isAuthenticated && Boolean(profile),
    },
    {
      key: 'recommendations',
      label: 'Recommendations',
      hint: 'Ranked role matches',
      enabled: isAuthenticated && recommendations.length > 0,
    },
    {
      key: 'explainability',
      label: 'Explainability',
      hint: 'Matched and missing skills',
      enabled: isAuthenticated && recommendations.length > 0,
    },
    {
      key: 'gap',
      label: 'Gap & Radar',
      hint: 'Missing skills and importance graph',
      enabled: isAuthenticated && gapReport.length > 0,
    },
    {
      key: 'learning',
      label: 'Learning Path',
      hint: 'Recommended courses/resources',
      enabled: isAuthenticated && resources.length > 0,
    },
  ]

  const isSectionEnabled = (key) => {
    if (key === 'auth') {
      return true
    }
    if (key === 'dashboard') {
      return isAuthenticated
    }
    const item = dashboardItems.find((entry) => entry.key === key)
    return Boolean(item?.enabled)
  }

  const navigableSections = orderedSectionKeys.filter((key) => isSectionEnabled(key))
  const currentStepIndex = navigableSections.indexOf(activeSection)
  const previousSection = currentStepIndex > 0 ? navigableSections[currentStepIndex - 1] : null
  const nextSection =
    currentStepIndex >= 0 && currentStepIndex < navigableSections.length - 1
      ? navigableSections[currentStepIndex + 1]
      : null

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        {showHeroHeader ? <HeroHeader isAuthenticated={isAuthenticated} onLogout={onLogout} /> : null}

        {isAuthenticated ? (
          <DashboardSectionNav
            isAuthenticated={isAuthenticated}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            dashboardItems={dashboardItems}
          />
        ) : null}

        <main className={`${showHeroHeader ? 'mt-8' : 'mt-2'} space-y-6`}>
          {successMsg ? <div className="notice success">{successMsg}</div> : null}
          {error ? <div className="notice error">{error}</div> : null}
          {backendWarming ? (
            <div className="panel px-6 py-4">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="spinner" />
                <span>Waking backend server for faster responses...</span>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="panel px-6 py-10">
              <div className="flex items-center justify-center gap-3 text-slate-300">
                <div className="spinner" />
                <span>{loadingMessage}</span>
              </div>
            </div>
          ) : null}

          <div className="panel px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => previousSection && setActiveSection(previousSection)}
                disabled={!previousSection || loading || backendWarming}
              >
                ← Previous
              </button>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Step {Math.max(1, currentStepIndex + 1)} / {Math.max(1, navigableSections.length)}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => nextSection && setActiveSection(nextSection)}
                disabled={!nextSection || loading || backendWarming}
              >
                Next →
              </button>
            </div>
          </div>

          <AuthSection
            activeSection={activeSection}
            isAuthenticated={isAuthenticated}
            authTab={authTab}
            setAuthTab={setAuthTab}
            auth={auth}
            setAuth={setAuth}
            onLogin={onLogin}
            onRegister={onRegister}
            loading={loading}
          />

          <InputSection
            isAuthenticated={isAuthenticated}
            activeSection={activeSection}
            inputTab={inputTab}
            setInputTab={setInputTab}
            manualSkills={manualSkills}
            setManualSkills={setManualSkills}
            onManualRecommend={onManualRecommend}
            loading={loading}
            resumeFile={resumeFile}
            setResumeFile={setResumeFile}
            onUploadResume={onUploadResume}
          />

          <ProfileSection isAuthenticated={isAuthenticated} activeSection={activeSection} profile={profile} />

          <RecommendationsSection
            isAuthenticated={isAuthenticated}
            activeSection={activeSection}
            recommendations={recommendations}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onAnalyzeGap={onAnalyzeGap}
            onExportPdf={onExportPdf}
            loading={loading}
          />

          <ExplainabilitySection
            isAuthenticated={isAuthenticated}
            activeSection={activeSection}
            recommendations={recommendations}
            explainability={explainability}
          />

          <GapSection isAuthenticated={isAuthenticated} activeSection={activeSection} gapReport={gapReport} chartData={chartData} />

          <LearningSection isAuthenticated={isAuthenticated} activeSection={activeSection} resources={resources} />
        </main>

        <footer className="mt-8 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-center text-[13px] font-medium tracking-[0.02em] text-slate-300">
          2026 CareerAI - All Right Reserved.
        </footer>
      </div>
    </div>
  )
}

export default App
