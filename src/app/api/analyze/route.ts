import { NextRequest, NextResponse } from "next/server"
import { parseResume } from "@/lib/parser"
import { analyzeResume } from "@/lib/ai"
import * as fs from "fs"
import * as path from "path"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileContent, fileName, text } = body

    // Case 1: Base64-encoded file upload (from browser)
    if (fileContent) {
      const buffer = Buffer.from(fileContent, "base64")
      const ext = path.extname(fileName || "file.txt").toLowerCase()
      const tmpDir = path.join(process.cwd(), "tmp")
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
      const tmpPath = path.join(tmpDir, crypto.randomUUID() + ext)
      fs.writeFileSync(tmpPath, buffer)

      try {
        const parsedText = await parseResume(tmpPath)
        const analysis = await analyzeResume(parsedText)
        analysis.fileName = fileName || "resume.txt"
        analysis.rawText = parsedText
        return NextResponse.json({ analysis })
      } finally {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
      }
    }

    // Case 2: Direct text input
    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: "Resume content too short" }, { status: 400 })
    }
    const analysis = await analyzeResume(text)
    analysis.fileName = fileName || "resume.txt"
    analysis.rawText = text
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}