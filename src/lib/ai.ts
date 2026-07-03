import { ResumeAnalysis, ModuleScore, Suggestion, ResumeSection } from "./types"
import { scoreResume } from "./scorer"

interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
}

function getAIConfig(): AIConfig | null {
  const provider = process.env.AI_PROVIDER || "openai"
  
  if (provider === "deepseek") {
    const key = process.env.DEEPSEEK_API_KEY
    if (key && key !== "sk-your-deepseek-key") {
      return {
        apiKey: key,
        baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      }
    }
  }
  
  const key = process.env.OPENAI_API_KEY
  if (key && key !== "sk-your-api-key-here") {
    return {
      apiKey: key,
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    }
  }
  
  return null
}

const SUGGESTION_PROMPT = `You are a senior HR expert and career advisor. Analyze this resume section by section and provide specific, actionable suggestions for improvement.

For each suggestion, follow this structure:
1. What needs to change (title)
2. Why HR cares about this
3. How to fix it (specific)
4. What benefit it brings

Respond with ONLY a JSON array. Each item must use these exact field names:
{
  "priority": "critical or important or optional",
  "module": "Work Experience or Projects or Skills or Education or Presentation",
  "title": "short title",
  "reason": "why HR cares, be specific",
  "suggestion": "exactly what to do",
  "value": "expected benefit"
}

Rules:
- critical = blocking issues that will get the resume rejected
- important = strong factors that hurt competitiveness
- optional = nice improvements for edge
- Be specific, not generic
- Reference what you see in the resume
- 3-7 suggestions total is ideal`

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  // Step 1: Local scorer - deterministic, always the same for same input
  const scored = scoreResume(resumeText)

  // Step 2: Try AI for suggestions
  const config = getAIConfig()
  let suggestions: Suggestion[] = []

  if (config) {
    suggestions = await fetchAISuggestions(resumeText, config)
  }

  // If AI didn't return suggestions, generate based on scores
  if (suggestions.length === 0) {
    suggestions = generateFallbackSuggestions(scored.modules, scored.sections)
  }

  return {
    id: "",
    createdAt: new Date().toISOString(),
    fileName: "resume.pdf",
    overallScore: scored.overallScore,
    currentCompetitiveness: scored.currentCompetitiveness,
    expectedCompetitiveness: scored.expectedCompetitiveness,
    modules: scored.modules,
    suggestions,
    sections: scored.sections,
    rawText: resumeText,
  }
}

async function fetchAISuggestions(text: string, config: AIConfig): Promise<Suggestion[]> {
  try {
    const response = await fetch(config.baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SUGGESTION_PROMPT },
          { role: "user", content: "Analyze this resume:\n\n" + text },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      console.error("API error:", response.status, await response.text())
      return []
    }

    const data = await response.json()
    let rawContent = data.choices[0].message.content

    // Handle markdown code blocks
    if (rawContent.includes("```")) {
      const match = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) rawContent = match[1].trim()
    }

    const parsed = JSON.parse(rawContent)
    const suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || [])

    // Normalize field names
    return suggestions.map((s: any, i: number) => ({
      id: String(s.id ?? i + 1),
      priority: s.priority ?? s.type ?? s.grade ?? "important",
      module: s.module ?? s.category ?? "General",
      title: s.title ?? s.name ?? s.text?.substring(0, 50) ?? "Suggestion",
      reason: s.reason ?? s.description ?? s.why ?? "HR looks for this in resumes.",
      suggestion: s.suggestion ?? s.text ?? s.advice ?? s.description ?? "",
      value: s.value ?? s.expectedImpact ?? s.benefit ?? "Improves your resume quality.",
    }))
  } catch (error) {
    console.error("AI suggestion error:", error)
    return []
  }
}

function generateFallbackSuggestions(modules: ModuleScore[], sections: ResumeSection[]): Suggestion[] {
  const suggestions: Suggestion[] = []
  let id = 0

  const moduleAdvice: Record<string, { critical: string[]; important: string[] }> = {
    "Work Experience": {
      critical: [
        'Add quantified achievements to each role (e.g., "increased revenue by 30%", "managed team of 12")',
        'Replace duty-based descriptions with accomplishment statements starting with strong action verbs',
      ],
      important: [
        'Include specific time periods for each position to show career progression',
      ],
    },
    "Projects": {
      critical: [
        'Add a dedicated Projects section with 2-3 key projects that demonstrate your technical capabilities',
        'For each project, describe: your specific role, technologies used, and measurable outcomes',
      ],
      important: [
        'Include links to live projects or code repositories (GitHub, personal website)',
      ],
    },
    "Skills": {
      critical: [
        'Create a structured Skills section with categories: Programming Languages, Frameworks, Tools',
        'List specific technologies rather than general terms (e.g., "React" instead of "frontend")',
      ],
      important: [
        'Indicate proficiency levels for key skills to help HR gauge your expertise',
      ],
    },
    "Education": {
      critical: [
        'Add your degree, institution name, and graduation year to the Education section',
      ],
      important: [
        'Include relevant coursework, GPA (if strong), and academic achievements',
      ],
    },
    "Presentation": {
      critical: [
        'Add a 2-3 line professional summary at the top to immediately communicate your value',
        'Ensure consistent formatting and clear section headers throughout',
      ],
      important: [
        'Add contact information (LinkedIn, GitHub, portfolio) to make it easy for recruiters',
      ],
    },
  }

  for (const module of modules) {
    const advice = moduleAdvice[module.name]
    if (!advice) continue

    if (module.score < 40) {
      for (const tip of advice.critical) {
        suggestions.push({
          id: String(++id),
          priority: "critical",
          module: module.name,
          title: tip.substring(0, 50),
          reason: `Your ${module.name.toLowerCase()} section scored only ${module.score}/100. This is below the competitive threshold and needs immediate attention.`,
          suggestion: tip,
          value: `Addressing this can increase your ${module.name.toLowerCase()} score by 20-30 points.`,
        })
      }
    } else if (module.score < 70) {
      for (const tip of advice.important.slice(0, 1)) {
        suggestions.push({
          id: String(++id),
          priority: "important",
          module: module.name,
          title: tip.substring(0, 50),
          reason: `Your ${module.name.toLowerCase()} section (${module.score}/100) has room for improvement that can significantly impact your overall competitiveness.`,
          suggestion: tip,
          value: `This improvement can boost your overall resume competitiveness by 5-10 points.`,
        })
      }
    } else {
      const tip = advice.important[0]
      if (tip) {
        suggestions.push({
          id: String(++id),
          priority: "optional",
          module: module.name,
          title: "Fine-tune this section",
          reason: `Your ${module.name.toLowerCase()} (${module.score}/100) is solid. These refinements can give you an edge over other candidates.`,
          suggestion: tip,
          value: "Polished details differentiate you from equally qualified candidates.",
        })
      }
    }
  }

  return suggestions
}