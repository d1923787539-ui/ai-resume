"use client"
import { useState, useRef, useCallback } from "react"
import { Upload, Loader2, CheckCircle } from "lucide-react"
interface Props { onAnalyze: (analysis: any, text: string, fileName: string) => void; loading: boolean }
export default function FileUpload({ onAnalyze }: Props) {
  const [dragOver, setDragOver] = useState(false); const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false); const [textMode, setTextMode] = useState(false)
  const [pasteText, setPasteText] = useState(""); const inputRef = useRef<HTMLInputElement>(null)
  
  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase()
    if (["pdf", "docx"].includes(ext || "")) {
      setTextMode(true)
      setFile(null)
      alert("Please paste your resume text below (PDF/DOCX support coming soon)")
      return
    }
    if (!["txt"].includes(ext || "")) { alert("Please upload TXT files"); return }
    setFile(f)
    setTextMode(false)
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }, [handleFile])
  
  const handleSubmit = async () => {
    const content = file ? await file.text() : pasteText
    if (!content || content.trim().length < 10) { alert("Please provide resume content (at least 10 characters)"); return }
    
    setParsing(true)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, fileName: file?.name || "pasted-resume.txt" }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { alert(data.error || "Failed"); setParsing(false); return }
      onAnalyze(data.analysis, content, file?.name || "pasted-resume.txt")
    } catch { alert("Failed to process") } finally { setParsing(false) }
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Upload area for TXT */}
      {!textMode && (
        <div onDrop={handleDrop} onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }} onDragLeave={(e: React.DragEvent) => { e.preventDefault(); setDragOver(false) }} onClick={() => inputRef.current?.click()}
          className={"relative overflow-hidden cursor-pointer border-2 border-dashed rounded-2xl p-12 sm:p-16 transition-all duration-300 text-center " + (dragOver ? "border-primary-500 bg-primary-50/50 scale-[1.02]" : file ? "border-green-300 bg-green-50/30" : "border-surface-200 bg-surface-50/50 hover:border-surface-300 hover:bg-surface-100/50")}>
          <input ref={inputRef} type="file" accept=".txt,.pdf,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-4">
            {file ? (
              <><div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center"><CheckCircle className="w-8 h-8 text-green-600" /></div>
              <div><p className="text-base font-medium text-surface-900">{file.name}</p></div></>
            ) : (
              <><div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center"><Upload className="w-8 h-8 text-surface-400" /></div>
              <div><p className="text-base font-medium text-surface-700">Upload a TXT file, or <span className="text-primary-500">click to browse</span></p><p className="text-sm text-surface-400 mt-1">For PDF/DOCX: paste below</p></div></>
            )}
          </div>
        </div>
      )}
      
      {/* Or divider + paste area */}
      <div className="text-center text-sm text-surface-300">or</div>
      
      <textarea
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
        placeholder="Paste your resume content here..."
        className="input-field min-h-[180px] font-mono text-sm resize-y"
      />
      
      {pasteText.length >= 10 && (
        <div className="text-center">
          <button onClick={handleSubmit} disabled={parsing} className="btn-primary flex items-center gap-2 mx-auto">
            {parsing && <Loader2 className="w-4 h-4 animate-spin" />}
            {parsing ? "Analyzing..." : "Start Analysis"}
          </button>
        </div>
      )}
    </div>
  )
}