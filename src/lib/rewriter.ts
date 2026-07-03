interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export async function rewriteModule(module: string, originalContent: string, fullResume: string, suggestions?: string): Promise<RewriteResult> {
  const config = getAIConfig()
  if (!config) return getMockRewrite(module)
  return callAIForModule(module, originalContent, fullResume, suggestions, config)
}

function getAIConfig(): AIConfig | null {
  const provider = process.env.AI_PROVIDER || "openai"
  if (provider === "deepseek") {
    const key = process.env.DEEPSEEK_API_KEY
    if (key && key !== "sk-your-deepseek-key")
      return { apiKey: key, baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com", model: process.env.DEEPSEEK_MODEL || "deepseek-chat" }
  }
  const key = process.env.OPENAI_API_KEY
  if (key && key !== "sk-your-api-key-here")
    return { apiKey: key, baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1", model: process.env.OPENAI_MODEL || "gpt-4o-mini" }
  return null
}

export interface RewriteResult {
  module: string
  rewritten: string
  changes: string[]
}

const MODULE_PROMPTS: Record<string, string> = {
  "work-experience": `You are a senior HR specialist optimizing the WORK EXPERIENCE section of a resume.
RULES:
1. Keep ALL facts, dates, company names, and job titles exactly as provided
2. Transform duty-based descriptions into accomplishment statements
3. Add quantified metrics where implied by context (e.g., "led a team" -> "led a team of 8 engineers")
4. Start each bullet with a strong action verb
5. Show career progression and impact
6. Do NOT fabricate experiences - enhance what exists
7. Mark significantly added content with [AI SUGGESTED] prefix
Return ONLY JSON: {"rewritten": "...", "changes": ["...", "..."]}`,
  "projects": `You are a technical recruiter optimizing the PROJECTS section.
RULES:
1. Keep ALL project names and facts exactly as provided
2. Enhance technical depth - add specific technologies and methodologies
3. Describe the problem, your role, and the outcome
4. Quantify impact where possible
5. Mark added content with [AI SUGGESTED] prefix
Return ONLY JSON: {"rewritten": "...", "changes": ["...", "..."]}`,
  "skills": `You are a skills assessment expert optimizing the SKILLS section.
RULES:
1. Keep ALL listed skills exactly as provided
2. Reorganize into clear categories: Languages, Frameworks, Tools, Platforms
3. Add related skills that complement listed ones
4. Remove outdated skills
5. Mark added content with [AI SUGGESTED] prefix
Return ONLY JSON: {"rewritten": "...", "changes": ["...", "..."]}`,
  "education": `You are an academic credentials specialist optimizing the EDUCATION section.
RULES:
1. Keep ALL degrees, institutions, dates exactly as provided
2. Highlight academic achievements (GPA, honors, awards)
3. Fill in missing details where appropriate
4. Do NOT fabricate degrees or institutions
5. Mark added content with [AI SUGGESTED] prefix
Return ONLY JSON: {"rewritten": "...", "changes": ["...", "..."]}`,
  "summary": `You are a resume branding expert creating/optimizing a PROFESSIONAL SUMMARY.
RULES:
1. If a summary exists, enhance it; if not, create one based on resume content
2. Include: years of experience, key skills, industries, notable achievements
3. Keep it concise (2-4 lines)
4. Make it compelling for HR to keep reading
5. Mark added content with [AI SUGGESTED] prefix
Return ONLY JSON: {"rewritten": "...", "changes": ["...", "..."]}`,
}

const MOCK_REWRITES: Record<string, string> = {
  "work-experience": "• Spearheaded microservices architecture serving 1M+ daily users\n• Engineered CI/CD pipelines reducing deployment time by 60%\n• Mentored 4 junior engineers\n• Architected cloud migration to AWS, cutting costs by 35%",
  "projects": "• E-Commerce Platform | React, Node.js, PostgreSQL, Docker\n  - Architected full-featured platform from concept to production\n  - Integrated Stripe payments with 99.9% uptime\n  - [AI SUGGESTED] Implemented Redis caching, improving load times by 40%",
  "skills": "Languages: JavaScript/TypeScript, Python, Go, SQL\nFrameworks: React, Vue.js, Node.js, Express\n[AI SUGGESTED] State Management: Redux, Zustand\nDevOps: Docker, Kubernetes, AWS, CI/CD",
  "education": "• University of Technology | B.S. Computer Science | 2014-2018\n  GPA: 3.8/4.0 - Dean's List\n  [AI SUGGESTED] Relevant Coursework: Data Structures, Algorithms, Distributed Systems",
  "summary": "[AI SUGGESTED] Senior Software Engineer with 6+ years architecting scalable web applications. Proven track record in microservices, cloud migration, and team mentorship.",
}

const FETCH_TIMEOUT = 15000 // 15 seconds per call

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

async function callAIForModule(module: string, originalContent: string, fullResume: string, suggestions: string | undefined, config: AIConfig): Promise<RewriteResult> {
  const prompt = MODULE_PROMPTS[module]
  if (!prompt) return { module, rewritten: originalContent, changes: [] }

  const userMessage = `Original ${module} content:\n${originalContent}\n\nFull Resume Context:\n${fullResume}\n${suggestions ? `\nRelevant Suggestions:\n${suggestions}` : ""}`

  try {
    const response = await fetchWithTimeout(
      config.baseUrl + "/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + config.apiKey },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      },
      FETCH_TIMEOUT
    )

    if (!response.ok) {
      console.error(`Rewrite API error for ${module}:`, response.status)
      return getMockRewrite(module)
    }

    const data = await response.json()
    let rawContent = data.choices[0].message.content
    if (rawContent.includes("```")) {
      const match = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) rawContent = match[1].trim()
    }
    const parsed = JSON.parse(rawContent)
    return {
      module,
      rewritten: parsed.rewritten || parsed.text || parsed.content || originalContent || getMockRewrite(module).rewritten,
      changes: parsed.changes || ["Enhanced for impact"],
    }
  } catch (error: any) {
    console.error(`Rewrite failed for ${module}:`, error?.message || error)
    return getMockRewrite(module)
  }
}

export async function rewriteAllModules(
  sections: { name: string; content: string }[],
  fullResume: string,
  suggestions?: { module: string; text: string }[]
): Promise<RewriteResult[]> {
  const moduleMap: Record<string, string> = {
    "work experience": "work-experience", "experience": "work-experience",
    "projects": "projects", "project": "projects",
    "skills": "skills",
    "education": "education",
    "summary": "summary", "profile": "summary",
    "full text": "summary",
  }

  const modulesToRewrite = ["work-experience", "projects", "skills", "education", "summary"]

  // Run all rewrites in PARALLEL
  const promises = modulesToRewrite.map((module) => {
    const matchedSection = sections.find((s) => {
      const mapped = moduleMap[s.name.toLowerCase()]
      return mapped === module
    })
    const originalContent = matchedSection?.content || ""
    const moduleSuggestions = suggestions?.filter((s) => {
      const mapped = moduleMap[s.module.toLowerCase()]
      return mapped === module
    }).map((s) => s.text).join("\n")

    const config = getAIConfig()
    if (config) {
      return callAIForModule(module, originalContent, fullResume, moduleSuggestions, config)
    }
    return Promise.resolve(getMockRewrite(module))
  })

  // Wait for all to complete (failing individually doesn't block others)
  return Promise.all(promises)
}

function getMockRewrite(module: string): RewriteResult {
  return {
    module,
    rewritten: MOCK_REWRITES[module] || "Enhanced version of this section.",
    changes: ["Rewrote for impact and clarity"],
  }
}