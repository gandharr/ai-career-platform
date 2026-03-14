import { useCareerWorkflow } from './hooks/useCareerWorkflow'
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
  const {
    resumeFile,
    setResumeFile,
    profile,
    recommendations,
    selectedRole,
    setSelectedRole,
    gapReport,
    resources,
    explainability,
    manualSkills,
    setManualSkills,
    auth,
    setAuth,
    profileHistory,
    loading,
    error,
    successMsg,
    authTab,
    setAuthTab,
    inputTab,
    setInputTab,
    activeSection,
    setActiveSection,
    chartData,
    isAuthenticated,
    dashboardItems,
    onUploadResume,
    onManualRecommend,
    onRegister,
    onLogin,
    onLogout,
    onAnalyzeGap,
    onExportPdf,
  } = useCareerWorkflow()

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        <HeroHeader isAuthenticated={isAuthenticated} onLogout={onLogout} />

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
