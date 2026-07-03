"use client"
import { useState } from "react"
import { Check, ThumbsUp, AlertTriangle, Edit2, Download, Copy, X, Save } from "lucide-react"
import { RewriteResult } from "@/lib/rewriter"

interface Props {
  results: RewriteResult[]
  onDownload?: () => void
  onCopy?: () => void
  isLoggedIn?: boolean
  onLoginRequired?: () => void
}

const MODULE_LABELS: Record<string, string> = {
  "work-experience": "Work Experience",
  "projects": "Projects",
  "skills": "Skills",
  "education": "Education",
  "summary": "Professional Summary",
}

const MODULE_ICONS: Record<string, string> = {
  "work-experience": "💼",
  "projects": "🛠",
  "skills": "⚡",
  "education": "🎓",
  "summary": "📋",
}

export default function ResumePreview({ results, isLoggedIn, onLoginRequired }: Props) {
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [moduleContent, setModuleContent] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    results.forEach((r) => { initial[r.module] = r.rewritten })
    return initial
  })

  const startEdit = (module: string, content: string) => {
    setEditingModule(module)
    setEditContent(content)
  }

  const saveEdit = () => {
    if (editingModule) {
      setModuleContent((prev) => ({ ...prev, [editingModule]: editContent }))
      setEditingModule(null)
    }
  }

  const cancelEdit = () => {
    setEditingModule(null)
  }

  const handleDownload = () => {
    const parts = modules.map(m => {
      const label = MODULE_LABELS[m.module] || m.module
      const text = moduleContent[m.module] || m.rewritten
      return label + "\n" + text + "\n"
    })
    const fullText = parts.join("\n")
    const blob = new Blob([fullText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "optimized-resume.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    const parts = modules.map(m => {
      const label = MODULE_LABELS[m.module] || m.module
      const text = moduleContent[m.module] || m.rewritten
      return label + "\n" + text + "\n"
    })
    navigator.clipboard.writeText(parts.join("\n"))
  }

  const modules = results.filter((r) => r.rewritten && r.rewritten.length > 0)

  return (
    <div className="card overflow-hidden">
      {/* Header - "Paper" styled resume */}
      <div className="bg-white p-6 sm:p-8">
        <div className="max-w-[800px] mx-auto">
          {/* Resume Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-surface-200">
            <h1 className="text-3xl font-bold text-surface-900 tracking-tight">
              {moduleContent["summary"]?.includes("[AI SUGGESTED]") ? "Your Optimized Resume" : "Optimized Resume"}
            </h1>
            <p className="text-surface-400 text-sm mt-2">
              {"AI-enhanced version "}
              <span className="text-amber-500">{"review each section below"}</span>
            </p>
          </div>

          {/* Module sections */}
          <div className="space-y-8">
            {modules.map((m) => {
              const label = MODULE_LABELS[m.module] || m.module
              const icon = MODULE_ICONS[m.module] || "📄"
              const content = moduleContent[m.module] || m.rewritten
              const isEditing = editingModule === m.module

              return (
                <div key={m.module} className="group">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
                      <span>{icon}</span>
                      {label}
                    </h2>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(m.module, content)}
                          className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary-600 transition-colors"
                          title="Edit this section"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="input-field min-h-[120px] font-mono text-sm"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1">
                          <Save className="w-3.5 h-3.5" />Save
                        </button>
                        <button onClick={cancelEdit} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      {renderContent(content)}
                    </div>
                  )}

                  {/* Changed items */}
                  {m.changes && m.changes.length > 0 && !isEditing && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.changes.map((c, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-surface-200 bg-surface-50 px-6 py-4">
        <div className="max-w-[800px] mx-auto flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-surface-400">
            {"AI-generated content may contain inaccuracies. Please review each section."}
          </p>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <button onClick={handleDownload} className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />Download
                </button>
                <button onClick={handleCopy} className="btn-primary !py-2 !px-3 text-xs flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" />Copy
                </button>
              </>
            ) : (
              <button onClick={onLoginRequired} className="btn-primary !py-2 !px-3 text-xs flex items-center gap-1.5">
                Sign in to Download
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderContent(text: string) {
  // Simple renderer: detect bullet points and format them
  const lines = text.split("\n").filter((l) => l.trim())

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        // Bullet point line
        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
          return (
            <div key={i} className="flex gap-2 text-sm text-surface-700 leading-relaxed">
              <span className="text-primary-500 mt-1 shrink-0">•</span>
              <span>{highlightChanges(trimmed.substring(1).trim())}</span>
            </div>
          )
        }
        // Sub-header (project name | tech)
        if (trimmed.includes(" | ") || trimmed.includes("|")) {
          const parts = trimmed.split("|").map((p) => p.trim())
          return (
            <div key={i} className="text-sm">
              <span className="font-medium text-surface-800">{parts[0]}</span>
              {parts.length > 1 && <span className="text-surface-500"> | {parts.slice(1).join(" | ")}</span>}
            </div>
          )
        }
        // Regular line
        return (
          <p key={i} className="text-sm text-surface-700 leading-relaxed">
            {highlightChanges(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

function highlightChanges(text: string) {
  if (text.includes("[AI SUGGESTED]")) {
    const parts = text.split("[AI SUGGESTED]")
    return (
      <>
        {parts.map((part, i) => {
          if (i === 0) return <span key={i}>{part}</span>
          return (
            <span key={i}>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200 mr-1">
                AI
              </span>
              {part}
            </span>
          )
        })}
      </>
    )
  }
  return text
}