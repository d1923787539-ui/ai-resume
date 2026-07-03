import { NextRequest, NextResponse } from "next/server"
import { ResumeAnalysis } from "@/lib/types"
import * as fs from "fs"
import * as path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const RESUMES_FILE = path.join(DATA_DIR, "resumes.json")

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(RESUMES_FILE)) fs.writeFileSync(RESUMES_FILE, "[]")
}
function readResumes(): ResumeAnalysis[] { ensureDir(); try { return JSON.parse(fs.readFileSync(RESUMES_FILE, "utf-8")) } catch { return [] } }
function writeResumes(r: ResumeAnalysis[]) { ensureDir(); fs.writeFileSync(RESUMES_FILE, JSON.stringify(r, null, 2)) }

export async function POST(request: NextRequest) {
  try {
    const { analysis, userId } = await request.json()
    if (!analysis) return NextResponse.json({ error: "Missing analysis data" }, { status: 400 })
    const resumes = readResumes()
    const newAnalysis: ResumeAnalysis = { ...analysis, id: userId ? userId + "-" + Date.now() : "anon-" + Date.now(), createdAt: new Date().toISOString() }
    resumes.push(newAnalysis); writeResumes(resumes)
    return NextResponse.json({ success: true, id: newAnalysis.id })
  } catch (error) { console.error("Save error:", error); return NextResponse.json({ error: "Save failed" }, { status: 500 }) }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const resumes = readResumes()
    if (userId) return NextResponse.json({ resumes: resumes.filter((r) => r.id.startsWith(userId + "-")) })
    return NextResponse.json({ resumes })
  } catch (error) { console.error("Load error:", error); return NextResponse.json({ error: "Load failed" }, { status: 500 }) }
}
