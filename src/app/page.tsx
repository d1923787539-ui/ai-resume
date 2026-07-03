"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import FileUpload from "@/components/FileUpload"
import { Sparkles, Shield, Brain, BarChart3, ArrowRight } from "lucide-react"
export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const handleAnalyze = (analysis: any, _text: string, _fileName: string) => {
    sessionStorage.setItem("ai-resume-analysis", JSON.stringify(analysis))
    router.push("/result")
  }
  const features = [
    { icon: Brain, title: "HR-Level Insight", desc: "Every suggestion comes from HR perspective, not just grammar checking" },
    { icon: BarChart3, title: "Multi-Dimension Scoring", desc: "5 dimensions including experience, projects, skills, education and presentation" },
    { icon: Shield, title: "Honest & Real", desc: "We don't fabricate experience, we help you discover your true value" },
  ]
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="py-16 sm:py-24 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6"><Sparkles className="w-4 h-4" />AI that thinks like an HR professional</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-surface-900 leading-tight">Let AI help you
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700 block sm:inline"> understand what HR looks for</span></h1>
          <p className="mt-6 text-lg text-surface-500 max-w-xl mx-auto leading-relaxed">Upload your resume and get professional analysis from an HR perspective. Not just grammar checks - real understanding of how interviewers evaluate candidates.</p>
        </div>
      </section>
      <section className="pb-16 px-4"><FileUpload onAnalyze={handleAnalyze} loading={loading} /></section>
      {loading && <section className="pb-16 text-center px-4"><div className="max-w-md mx-auto"><div className="card p-8"><div className="flex flex-col items-center gap-3"><div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div><p className="text-surface-700 font-medium">AI is analyzing your resume...</p><p className="text-sm text-surface-400">Evaluating from HR perspective</p></div></div></div></section>}
      <section className="py-16 bg-white border-t border-surface-200">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center text-surface-900 mb-12">More than grammar - understand how HR thinks</h2>
          <div className="grid sm:grid-cols-3 gap-6">{features.map((f) => <div key={f.title} className="card p-6 text-center"><div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-4"><f.icon className="w-6 h-6 text-primary-600" /></div><h3 className="text-base font-medium text-surface-900 mb-2">{f.title}</h3><p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p></div>)}</div>
        </div>
      </section>
      <section className="py-16 text-center px-4"><div className="max-w-xl mx-auto"><ArrowRight className="w-8 h-8 text-primary-500 mx-auto mb-4" /><p className="text-surface-400 text-sm">Your data is secure - you can choose to save or delete after analysis</p></div></section>
    </div>
  )
}
