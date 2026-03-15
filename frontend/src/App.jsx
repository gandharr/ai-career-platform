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
  const [token, setToken] = useState(localStorage.getItem('career_token') || sessionStorage.getItem('career_token') || '')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Processing your request...')
  const [backendReady, setBackendReady] = useState(false)
  const [backendWarming, setBackendWarming] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [authTab, setAuthTab] = useState('login')
  const [inputTab, setInputTab] = useState('upload')
  const [activeSection, setActiveSection] = useState(token ? 'input' : 'dashboard')
  const flashTimeoutRef = useRef(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    document.body.classList.add('theme-light')
    localStorage.setItem('career_theme', 'light')
  }, [])

  useEffect(() => {
    setAuthToken(token || '')
  }, [token])

  useEffect(() => {
    if (!token) {
      setActiveSection('dashboard')
    }
  }, [token])

  useEffect(() => {
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
    () =>
      [...gapReport]
        .sort((left, right) => (right.importance || 0) - (left.importance || 0))
        .slice(0, 8)
        .map((item) => ({
          skill: item.skill,
          importance: Math.max(0, Math.min(100, (item.importance || 0) * 100)),
        })),
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
      setActiveSection('profile')
      showMessage('Resume parsed. Candidate profile is ready.')
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
      setActiveSection('profile')
      showMessage('Profile generated from skills. Continue to recommendations.')
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
      localStorage.setItem('career_token', accessToken)
      setAuthToken(accessToken)
      setToken(accessToken)
      setActiveSection('input')
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
      localStorage.setItem('career_token', accessToken)
      setAuthToken(accessToken)
      setToken(accessToken)

      setActiveSection('input')
      showMessage('Signed in successfully.')
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Login failed.'))
    } finally {
      setLoading(false)
    }
  }

  const onLogout = () => {
    sessionStorage.removeItem('career_token')
    localStorage.removeItem('career_token')
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
    setActiveSection('dashboard')
    showMessage('Signed out.')
  }

  const onOpenLogin = () => {
    setAuthTab('login')
    setActiveSection('auth')
  }

  const onOpenRegister = () => {
    setAuthTab('register')
    setActiveSection('auth')
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
  const showHeroHeader = true
  const orderedSectionKeys = ['input', 'profile', 'recommendations', 'explainability', 'gap', 'learning']
  const navigableSections = isAuthenticated ? orderedSectionKeys : ['dashboard']
  const currentStepIndex = navigableSections.indexOf(activeSection)
  const previousSection = currentStepIndex > 0 ? navigableSections[currentStepIndex - 1] : null
  const nextSection =
    currentStepIndex >= 0 && currentStepIndex < navigableSections.length - 1
      ? navigableSections[currentStepIndex + 1]
      : null

  const onNextStep = async () => {
    if (!nextSection) {
      return
    }

    if (nextSection === 'gap' && gapReport.length === 0) {
      if (!profile || !selectedRole) {
        setError('Select a recommended role first to continue to skill-gap analysis.')
        return
      }
      await onAnalyzeGap()
      return
    }

    if (nextSection === 'learning' && resources.length === 0) {
      if (!profile || !selectedRole) {
        setError('Select a recommended role first to continue to learning resources.')
        return
      }
      if (gapReport.length === 0) {
        await onAnalyzeGap()
      }
      setActiveSection('learning')
      return
    }

    setActiveSection(nextSection)
  }

  return (
    <div className="app-shell">
      {loading ? (
        <div className="progress-bar-track">
          <div className="progress-bar-fill" />
        </div>
      ) : null}

      <div className="toast-stack">
        {successMsg ? (
          <div className="toast toast-success">&#10003;&nbsp; {successMsg}</div>
        ) : null}
        {error ? (
          <div className="toast toast-error">&#10005;&nbsp; {error}</div>
        ) : null}
      </div>

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        {showHeroHeader ? (
          <HeroHeader
            isAuthenticated={isAuthenticated}
            onLogout={onLogout}
            onOpenLogin={onOpenLogin}
            onOpenRegister={onOpenRegister}
            onGetStarted={() => {
              if (isAuthenticated) {
                setActiveSection('input')
                return
              }
              setError('Please click Login to continue.')
            }}
          />
        ) : null}

        <main className={`${showHeroHeader ? 'mt-8' : 'mt-2'} space-y-6`}>
          {isAuthenticated && activeSection !== 'dashboard' && navigableSections.length > 1 ? (
            <div className="flex items-center justify-end gap-3 px-1">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300 bg-white text-lg text-emerald-800 shadow-sm shadow-emerald-100 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => previousSection && setActiveSection(previousSection)}
                disabled={!previousSection || loading || backendWarming}
                aria-label="Previous step"
                title="Previous"
              >
                ←
              </button>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/50 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 text-lg text-white shadow-lg shadow-emerald-300/35 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:from-emerald-500 hover:via-green-500 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-400/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => void onNextStep()}
                disabled={!nextSection || loading || backendWarming}
                aria-label="Next step"
                title="Next"
              >
                →
              </button>
            </div>
          ) : null}

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
            explainability={explainability}
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
