import { useEffect, useMemo, useRef, useState } from 'react'
import {
  warmUpBackend,
  getLearningPath,
  getSkillGap,
  getUserProfile,
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
  HistorySection,
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
  const [profileHistory, setProfileHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [authTab, setAuthTab] = useState('login')
  const [inputTab, setInputTab] = useState('manual')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [theme, setTheme] = useState(localStorage.getItem('career_theme') || 'dark')
  const flashTimeoutRef = useRef(0)

  useEffect(() => {
    const nextTheme = theme === 'light' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', nextTheme)
    document.body.classList.toggle('theme-light', nextTheme === 'light')
    localStorage.setItem('career_theme', nextTheme)
  }, [theme])

  useEffect(() => {
    setAuthToken(token || '')
  }, [token])

  useEffect(() => {
    if (!token) {
      setActiveSection('auth')
    }
  }, [token])

  const refreshProfileHistory = async () => {
    try {
      const profileRes = await getUserProfile()
      setProfileHistory(profileRes.recent_recommendations || [])
    } catch {
      setProfileHistory([])
    }
  }

  useEffect(() => {
    if (!token) {
      setProfileHistory([])
      return
    }

    void refreshProfileHistory()
  }, [token])

  useEffect(() => {
    localStorage.removeItem('career_token')

    const timerId = window.setTimeout(() => {
      setAuth({ name: '', email: '', password: '' })
    }, 120)

    return () => window.clearTimeout(timerId)
  }, [])

  useEffect(() => {
    void warmUpBackend()
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

  const onUploadResume = async () => {
    if (!resumeFile) return

    setError('')
    setLoading(true)
    try {
      const parsed = await parseResume(resumeFile)
      setProfile(parsed)

      const rec = await recommendCareers({
        user_id: parsed.email || 'demo-user',
        name: parsed.name,
        skills: parsed.skills,
        experience_years: 0,
        certifications: parsed.certifications || [],
        resume_text: parsed.raw_text || '',
      })

      setRecommendations(rec.recommendations)
      setExplainability(rec.explainability || {})
      setSelectedRole(rec.recommendations[0]?.role || '')
      setActiveSection('recommendations')
      showMessage('Resume parsed and recommendations generated.')
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || 'Failed to parse the resume and generate recommendations.')
    } finally {
      setLoading(false)
    }
  }

  const onManualRecommend = async () => {
    setError('')
    setLoading(true)
    try {
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
      setError(requestError?.response?.data?.detail || 'Failed to generate recommendations from manual skills.')
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async () => {
    setError('')
    setLoading(true)
    try {
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
      setError(requestError?.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const onLogin = async () => {
    setError('')
    setLoading(true)
    try {
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
      setError(requestError?.response?.data?.detail || 'Login failed.')
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
    setProfileHistory([])
    setError('')
    setActiveSection('auth')
    showMessage('Signed out.')
  }

  const onToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const onAnalyzeGap = async () => {
    if (!profile || !selectedRole) return

    setError('')
    setLoading(true)
    try {
      const gap = await getSkillGap({ user_skills: profile.skills, target_role: selectedRole })
      setGapReport(gap.missing_skills)

      const learn = await getLearningPath({
        missing_skills: gap.missing_skills.map((item) => item.skill),
      })
      setResources(learn.resources)
      setActiveSection('gap')
      showMessage(`Skill gap ready for ${selectedRole}.`)
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || 'Failed to analyze the skill gap.')
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
    {
      key: 'history',
      label: 'Saved History',
      hint: 'Recent recommendation history',
      enabled: isAuthenticated && profileHistory.length > 0,
    },
  ]

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        <HeroHeader isAuthenticated={isAuthenticated} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />

        <main className="mt-8 space-y-6">
          {successMsg ? <div className="notice success">{successMsg}</div> : null}
          {error ? <div className="notice error">{error}</div> : null}

          <DashboardSectionNav
            isAuthenticated={isAuthenticated}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            dashboardItems={dashboardItems}
          />

          {loading ? (
            <div className="panel px-6 py-10">
              <div className="flex items-center justify-center gap-3 text-slate-300">
                <div className="spinner" />
                <span>Processing your request...</span>
              </div>
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

          <HistorySection isAuthenticated={isAuthenticated} activeSection={activeSection} profileHistory={profileHistory} />
        </main>

        <footer className="mt-8 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-center text-[13px] font-medium tracking-[0.02em] text-slate-300">
          2026 CareerAI - All Right Reserved.
        </footer>
      </div>
    </div>
  )
}

export default App
