import { NextRequest, NextResponse } from "next/server"
import { rewriteModule, rewriteAllModules } from "@/lib/rewriter"
import { ResumeSection } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Case 1: Rewrite all modules at once (batch mode)
    if (body.mode === "batch") {
      const sections: { name: string; content: string }[] = body.sections || []
      const fullResume: string = body.fullResume || ""
      const suggestions: { module: string; text: string }[] = body.suggestions || []

      const results = await rewriteAllModules(sections, fullResume, suggestions)
      return NextResponse.json({ results })
    }

    // Case 2: Rewrite a single module
    const { module, originalContent, fullResume, suggestions } = body
    if (!module) {
      return NextResponse.json({ error: "Module name required" }, { status: 400 })
    }

    const result = await rewriteModule(module, originalContent || "", fullResume || "", suggestions)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Rewrite endpoint error:", error)
    return NextResponse.json({ error: "Rewrite failed" }, { status: 500 })
  }
}