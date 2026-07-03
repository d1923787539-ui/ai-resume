"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Share2, Loader2, Sparkles } from "lucide-react"
import { ResumeAnalysis } from "@/lib/types"
import { RewriteResult } from "@/lib/rewriter"
import RadarChart from "@/components/RadarChart"
import CompetitivenessGauge from "@/components/CompetitivenessGauge"
import SuggestionCard from "@/components/SuggestionCard"
import ResumePreview from "@/components/ResumePreview"
import LoginModal from "@/components/LoginModal"

export default function ResultPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false)
  
  // Rewrite state
  const [rewriting, setRewriting] = useState(false)
  const [rewriteResults, setRewriteResults] = useState<RewriteResult[] | null>(null)
  const [rewriteError, setRewriteError] = useState("")
  const [showLogin, setShowLogin] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [previewKey, setPreviewKey] = useState(0)

  useEffect(() => {
    const stored = sessionStorage.getItem("ai-resume-analysis")
    if (stored) {
      try { 
        const a = JSON.parse(stored)
        setAnalysis(a)
        // Start rewriting immediately after analysis loads
        startRewrite(a)
      } catch { router.push("/") }
    } else { router.push("/") }

    // Check login state
    const userStr = localStorage.getItem("ai-resume-user")
    if (userStr) setUser(JSON.parse(userStr))
  }, [router])

  const startRewrite = async (a: ResumeAnalysis) => {
    setRewriting(true)
    setRewriteError("")
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "batch",
          sections: a.sections || [],
          fullResume: a.rawText || "",
          suggestions: (a.suggestions || []).map((s) => ({
            module: s.module,
            text: s.title + ": " + s.suggestion,
          })),
        }),
      })
      const data = await res.json()
      if (data.results && data.results.length > 0) {
        setRewriteResults(data.results)
      } else {
        setRewriteError("No rewrite results returned")
      }
    } catch (e: any) {
      setRewriteError(e.message || "Rewrite failed")
    } finally {
      setRewriting(false)
    }
  }

  const handleSave = async () => {
    if (!analysis) return; setSaving(true)
    try {
      const userStr = localStorage.getItem("ai-resume-user")
      const u = userStr ? JSON.parse(userStr) : null
      await fetch("/api/resumes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ analysis, userId: u?.id || null }) })
      setSaved(true)
    } catch { alert("Save failed") } finally { setSaving(false) }
  }

  const handleLoginRequired = () => {
    setShowLogin(true)
  }

  if (!analysis) return null

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-surface-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700">
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving || saved} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "Saved" : "Save"}
            </button>
            <button className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />Share
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ===== EXISTING ANALYSIS ===== */}
        <section>
          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-surface-900 mb-6">Competitiveness Assessment</h2>
            <CompetitivenessGauge current={analysis.currentCompetitiveness} expected={analysis.expectedCompetitiveness} />
            <div className="mt-6 p-4 rounded-xl bg-surface-50 border border-surface-200 text-center">
              <p className="text-sm text-surface-500">
                Overall Score <span className="text-2xl font-bold text-primary-600">{analysis.overallScore}</span> / 100
                <span className="mx-2 text-surface-300">&middot;</span>
                Expected after optimization: <span className="font-semibold text-green-600">{analysis.expectedCompetitiveness}</span>
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-surface-900 mb-6">Module Scores</h2>
            <div className="flex justify-center"><RadarChart modules={analysis.modules} /></div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Suggestions</h2>
          <div className="space-y-3">
            {analysis.suggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} defaultExpanded={s.priority === "critical"} />
            ))}
          </div>
        </section>

        {analysis.sections.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-4">Content Analysis</h2>
            <div className="space-y-3">
              {analysis.sections.map((section, i) => (
                <div key={i} className="card p-4 sm:p-5">
                  <h3 className="text-sm font-medium text-surface-900 mb-2">{section.name}</h3>
                  {section.content && <p className="text-sm text-surface-500 mb-3 leading-relaxed">{section.content}</p>}
                  {section.issues.length > 0 && (
                    <div className="space-y-1">
                      {section.issues.map((issue, j) => (
                        <p key={j} className="text-xs text-surface-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-surface-300" />{issue}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== OPTIMIZED RESUME SECTION ===== */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-surface-900">AI-Optimized Resume</h2>
          </div>

          {rewriting ? (
            <div className="card p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  </div>
                </div>
                <div>
                  <p className="text-base font-medium text-surface-700">AI is rewriting your resume...</p>
                  <p className="text-sm text-surface-400 mt-1">
                    5 specialized AI agents are optimizing each section in parallel
                  </p>
                </div>
                {/* Progress indicators */}
                <div className="flex items-center gap-2 mt-2">
                  {["work", "projects", "skills", "edu", "summary"].map((item, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary-200 animate-pulse" style={{ animationDelay: i * 0.2 + "s" }} />
                  ))}
                </div>
              </div>
            </div>
          ) : rewriteError ? (
            <div className="card p-8 text-center">
              <p className="text-surface-500">Rewrite unavailable: {rewriteError}</p>
              <button onClick={() => startRewrite(analysis)} className="btn-secondary !py-2 !px-4 text-sm mt-3">
                Retry
              </button>
            </div>
          ) : rewriteResults && rewriteResults.length > 0 ? (
            <ResumePreview
              key={previewKey}
              results={rewriteResults}
              isLoggedIn={!!user}
              onLoginRequired={handleLoginRequired}
            />
          ) : null}
        </section>

        {/* Bottom CTA */}
        <div className="text-center py-8">
          <button onClick={() => router.push("/")} className="btn-primary">Analyze Another Resume</button>
        </div>
      </div>

      {/* Login modal for download gate */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={(u) => {
            setUser(u); localStorage.setItem("ai-resume-user", JSON.stringify(u)); setShowLogin(false)
          }}
        />
      )}
    </div>
  )
}