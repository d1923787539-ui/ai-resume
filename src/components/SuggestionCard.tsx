"use client"
import { useState } from "react"
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Target, Lightbulb } from "lucide-react"
import { Suggestion } from "@/lib/types"
interface Props { suggestion: Suggestion; defaultExpanded?: boolean }
const priorityConfig = {
  critical: { icon: AlertCircle, tagClass: "tag-critical", label: "Must Fix" },
  important: { icon: AlertTriangle, tagClass: "tag-important", label: "Recommended" },
  optional: { icon: Info, tagClass: "tag-optional", label: "Nice to Have" },
}
export default function SuggestionCard({ suggestion, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const config = priorityConfig[suggestion.priority]; const Icon = config.icon
  return (
    <div className={"card overflow-hidden transition-all duration-200 " + (expanded ? "shadow-md" : "card-hover")}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 sm:p-5 flex items-start gap-3">
        <div className={"mt-0.5 shrink-0 " + (suggestion.priority === "critical" ? "text-red-500" : suggestion.priority === "important" ? "text-amber-500" : "text-blue-500")}><Icon className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1"><span className={config.tagClass}>{config.label}</span><span className="text-xs text-surface-400">{suggestion.module}</span></div>
          <h4 className="text-sm font-medium text-surface-900">{suggestion.title}</h4>
        </div>
        <div className="shrink-0 text-surface-300">{expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</div>
      </button>
      {expanded && (
        <div className="px-4 sm:px-5 pb-5 space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/50">
            <div className="flex items-start gap-2.5"><Target className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /><div><p className="text-xs font-medium text-amber-700 mb-0.5">HR Perspective</p><p className="text-sm text-amber-800">{suggestion.reason}</p></div></div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/50">
            <div className="flex items-start gap-2.5"><Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" /><div><p className="text-xs font-medium text-blue-700 mb-0.5">Suggestion</p><p className="text-sm text-blue-800">{suggestion.suggestion}</p></div></div>
          </div>
          <div className="p-3.5 rounded-xl bg-green-50/80 border border-green-200/50">
            <div className="flex items-start gap-2.5"><Info className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /><div><p className="text-xs font-medium text-green-700 mb-0.5">Value</p><p className="text-sm text-green-800">{suggestion.value}</p></div></div>
          </div>
        </div>
      )}
    </div>
  )
}
