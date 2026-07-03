"use client"
import { useState, useRef, useCallback } from "react"
import { Upload, Loader2, CheckCircle } from "lucide-react"
interface Props { onAnalyze: (analysis: any, text: string, fileName: string) => void; loading: boolean }
export default function FileUpload({ onAnalyze }: Props) {
  const [dragOver, setDragOver] = useState(false); const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false); const inputRef = useRef<HTMLInputElement>(null)
  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase()
    if (!["pdf", "docx", "txt"].includes(ext || "")) { alert("Please upload PDF, DOCX or TXT"); return }
    setFile(f)
  }, [])
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }, [handleFile])
  const handleSubmit = async () => {
    if (!file) return; setParsing(true)
    const fd = new FormData(); fd.append("file", file)
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || data.error) { alert(data.error || "Failed"); setParsing(false); return }
      onAnalyze(data.analysis, data.analysis?.rawText || "", file.name)
    } catch { alert("Failed to parse") } finally { setParsing(false) }
  }
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div onDrop={handleDrop} onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }} onDragLeave={(e: React.DragEvent) => { e.preventDefault(); setDragOver(false) }} onClick={() => inputRef.current?.click()}
        className={"relative overflow-hidden cursor-pointer border-2 border-dashed rounded-2xl p-12 sm:p-16 transition-all duration-300 text-center " + (dragOver ? "border-primary-500 bg-primary-50/50 scale-[1.02]" : file ? "border-green-300 bg-green-50/30" : "border-surface-200 bg-surface-50/50 hover:border-surface-300 hover:bg-surface-100/50")}>
        <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <div className="flex flex-col items-center gap-4">
          {file ? (
            <><div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center"><CheckCircle className="w-8 h-8 text-green-600" /></div>
            <div><p className="text-base font-medium text-surface-900">{file.name}</p><p className="text-sm text-surface-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p></div>
            <div className="flex gap-3 mt-2"><button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="btn-secondary !py-2 !px-4 text-sm">Re-select</button>
            <button onClick={(e) => { e.stopPropagation(); handleSubmit() }} disabled={parsing} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2">{parsing && <Loader2 className="w-4 h-4 animate-spin" />}{parsing ? "Analyzing..." : "Start Analysis"}</button></div></>
          ) : (
            <><div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center"><Upload className="w-8 h-8 text-surface-400" /></div>
            <div><p className="text-base font-medium text-surface-700">Drop your resume here, or <span className="text-primary-500">click to browse</span></p>
            <p className="text-sm text-surface-400 mt-1">Supports PDF, DOCX, TXT</p></div></>
          )}
        </div>
      </div>
    </div>
  )
}
