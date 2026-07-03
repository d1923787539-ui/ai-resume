import { NextRequest, NextResponse } from "next/server"
import { parseResume } from "@/lib/parser"
import { analyzeResume } from "@/lib/ai"
import * as fs from "fs"
import * as path from "path"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
      const ext = path.extname(file.name).toLowerCase()
      if (![".pdf", ".docx", ".txt"].includes(ext)) return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
      const tmpDir = path.join(process.cwd(), "tmp")
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
      const tmpPath = path.join(tmpDir, crypto.randomUUID() + ext)
      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(tmpPath, buffer)
      try {
        const text = await parseResume(tmpPath)
        const analysis = await analyzeResume(text)
        analysis.fileName = file.name; analysis.rawText = text
        return NextResponse.json({ analysis })
      } finally { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath) }
    }
    const body = await request.json()
    const { text, fileName } = body
    if (!text || text.trim().length < 10) return NextResponse.json({ error: "Resume content too short" }, { status: 400 })
    const analysis = await analyzeResume(text)
    analysis.fileName = fileName || "resume.txt"; analysis.rawText = text
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
