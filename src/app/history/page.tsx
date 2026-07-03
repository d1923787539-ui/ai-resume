"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Clock, BarChart3, ArrowLeft } from "lucide-react"
import { ResumeAnalysis } from "@/lib/types"
export default function HistoryPage() {
  const router = useRouter(); const [user, setUser] = useState<any>(null); const [resumes, setResumes] = useState<ResumeAnalysis[]>([])
  useEffect(() => {
    const userStr = localStorage.getItem("ai-resume-user")
    if (userStr) { const u = JSON.parse(userStr); setUser(u); loadResumes(u.id) }
  }, [])
  const loadResumes = async (userId: string) => {
    try { const res = await fetch("/api/resumes?userId=" + userId); const data = await res.json(); if (data.resumes) setResumes(data.resumes) } catch {}
  }
  const viewAnalysis = (analysis: ResumeAnalysis) => { sessionStorage.setItem("ai-resume-analysis", JSON.stringify(analysis)); router.push("/result") }
  if (!user) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><div className="text-center"><h2 className="text-xl font-semibold text-surface-900 mb-2">Please sign in</h2><p className="text-surface-500">Sign in to view your analysis history</p></div></div>
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push("/")} className="p-2 rounded-lg hover:bg-surface-100"><ArrowLeft className="w-5 h-5 text-surface-400" /></button>
          <div><h1 className="text-2xl font-semibold text-surface-900">History</h1><p className="text-sm text-surface-400 mt-1">{resumes.length} records</p></div>
        </div>
        {resumes.length === 0 ? (
          <div className="card p-12 text-center"><FileText className="w-12 h-12 text-surface-300 mx-auto mb-4" /><h3 className="text-base font-medium text-surface-500">No records yet</h3><p className="text-sm text-surface-400 mt-1">Analyze your first resume to get started</p><button onClick={() => router.push("/")} className="btn-primary !py-2 !px-4 text-sm mt-4">Start Analysis</button></div>
        ) : (
          <div className="space-y-3">{resumes.map((r) => <div key={r.id} onClick={() => viewAnalysis(r)} className="card-hover p-4 sm:p-5 flex items-center gap-4 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-primary-600" /></div>
            <div className="flex-1 min-w-0"><h3 className="text-sm font-medium text-surface-900 truncate">{r.fileName || "Unnamed"}</h3>
            <div className="flex items-center gap-3 mt-1"><span className="text-xs text-surface-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.createdAt).toLocaleDateString()}</span><span className="text-xs text-surface-400 flex items-center gap-1"><BarChart3 className="w-3 h-3" />Score {r.overallScore}</span></div></div>
            <div className="text-right shrink-0"><div className="text-lg font-semibold text-primary-600">{r.overallScore}</div><div className="text-xs text-surface-400">Score</div></div>
          </div>)}</div>
        )}
      </div>
    </div>
  )
}
