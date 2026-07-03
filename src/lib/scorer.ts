import { ModuleScore, ResumeSection } from "./types"

export interface ScoredResult {
  modules: ModuleScore[]
  overallScore: number
  currentCompetitiveness: number
  expectedCompetitiveness: number
  sections: ResumeSection[]
}

// ============================================================
// Section Detection
// ============================================================

interface DetectedSection {
  name: string
  content: string
  issues: string[]
}

const SECTION_HEADERS: [string, string[]][] = [
  ["summary", ["summary", "profile", "about me", "professional summary", "personal summary", 
               "objective", "career objective", "qualifications summary",
               "个人总结", "自我评价", "个人简介", "求职意向", "职业目标", "个人概述"]],
  ["work experience", ["work experience", "experience", "employment", "professional experience",
                       "work history", "employment history", "relevant experience",
                       "工作经历", "工作经验", "工作背景", "职业经历"]],
  ["projects", ["projects", "project experience", "project", "key projects",
                "professional projects", "technical projects",
                "项目经验", "项目经历", "项目"]],
  ["education", ["education", "academic background", "education & certifications",
                 "educational background", "academic qualifications",
                 "教育背景", "教育经历", "学历", "教育"]],
  ["skills", ["skills", "technical skills", "core competencies", "key skills",
              "skills & expertise", "competencies", "technologies",
              "专业技能", "技能", "技术能力", "专业能力", "核心技术"]],
  ["certifications", ["certifications", "certificates", "licenses", "professional certifications",
                      "认证", "证书", "资格证书"]],
  ["languages", ["languages", "language skills", "language",
                 "语言能力", "语言", "外语能力"]],
  ["contact", ["contact", "contact information", "contact info",
               "联系方式", "基本信息", "个人信息"]],
]

function detectSections(text: string): DetectedSection[] {
  const lines = text.split("\n")
  const sections: DetectedSection[] = []
  let currentHeader: string | null = null
  let currentContent: string[] = []

  const findSection = (line: string): string | null => {
    const lower = line.toLowerCase().trim().replace(/[:\-–—]/g, "")
    for (const [name, keywords] of SECTION_HEADERS) {
      for (const kw of keywords) {
        if (lower === kw || lower.startsWith(kw + " ") || lower.endsWith(" " + kw)) {
          return name
        }
      }
    }
    // Also check for lines that are ALL CAPS (common for section headers)
    if (line.trim().length > 3 && line.trim().length < 40 &&
        line.trim() === line.trim().toUpperCase() &&
        /[A-Za-z]{3,}/.test(line.trim())) {
      return line.trim().toLowerCase()
    }
    return null
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const section = findSection(trimmed)
    if (section) {
      if (currentHeader) {
        sections.push({
          name: currentHeader,
          content: currentContent.join("\n").trim(),
          issues: [],
        })
      }
      currentHeader = section
      currentContent = []
    } else if (currentHeader) {
      currentContent.push(trimmed)
    }
  }

  // Push last section
  if (currentHeader) {
    sections.push({
      name: currentHeader,
      content: currentContent.join("\n").trim(),
      issues: [],
    })
  }

  // If no sections detected, treat the whole text as one section
  if (sections.length === 0) {
    sections.push({
      name: "full text",
      content: text,
      issues: [],
    })
  }

  return sections
}

function getSectionContent(sections: DetectedSection[], name: string): string {
  const s = sections.find((s) => s.name === name)
  return s ? s.content : ""
}

function hasSection(sections: DetectedSection[], names: string[]): boolean {
  return sections.some((s) => names.includes(s.name))
}

// ============================================================
// Scoring Rules by Module
// ============================================================

function scoreWorkExperience(sections: DetectedSection[], text: string): ModuleScore {
  const content = getSectionContent(sections, "work experience") || text
  let score = 0

  // Has work experience section: +15
  if (hasSection(sections, ["work experience", "experience", "employment"])) score += 15
  else if (/experience|work|employment/i.test(text)) score += 5

  // Has company/institution names: +15
  if (/at\s+[A-Z][a-zA-Z.]+|,\s*inc\.?|,\s*ltd\.?|company|corp|co\.,|university|institute/i.test(content)) score += 15
  // Chinese company markers
  if (/公司|集团|有限/.test(content)) score += 10

  // Has job titles: +15
  if (/engineer|manager|director|developer|analyst|designer|lead|head|associate|architect|consultant|specialist|intern/i.test(content)) score += 15
  // Chinese titles
  if (/工程师|经理|总监|主管|主任|专员|助理|实习生|负责人/.test(content)) score += 10

  // Has dates/time periods: +10
  if (/\d{4}\s*[-–—to]+\s*\d{4}|\d{4}\s*[-–—]\s*(present|current|now|至今|现在|目前)/i.test(content)) score += 10
  else if (/\d{4}/.test(content)) score += 5

  // Has quantified achievements: +25
  const quantPatterns = [
    /\d+%/,
    /\$\s*\d+[kKmMbB]?/,
    /\d+\s*(times?|x\b)/,
    /increased|decreased|improved|reduced|grew|boosted|saved\s+\d+/i,
    /\d+\+?\s*(people|customers|users|clients|members|employees)/i,
    /\d+[kK]\s*\+\s*/,
    /raised|generated|delivered|achieved|drove/i,
  ]
  const quantScore = quantPatterns.reduce((sum, p) => (p.test(content) ? sum + 4 : sum), 0)
  score += Math.min(quantScore, 25)

  // Has action verbs: +10
  const actionVerbs = /led|developed|created|managed|designed|implemented|built|launched|established|coordinated|organized|directed|spearheaded|drove|optimized|transformed|delivered|achieved|proposed|negotiated|mentored|trained|recruited|hired/i
  if (actionVerbs.test(content)) score += 10

  // Has multiple entries: +10
  const entryMarker = /\d{4}/g
  const matches = content.match(entryMarker)
  if (matches && matches.length >= 4) score += 10
  else if (matches && matches.length >= 2) score += 5

  // Responsibility vs achievement language: +5 (bonus for achievement language)
  if (/\b(responsible for|duties included|responsibilities include)\b/i.test(content)) {
    score -= 5 // penalize duty-focused language
  }

  return { name: "Work Experience", score: Math.max(0, Math.min(100, score)), maxScore: 100, weight: 0.35 }
}

function scoreProjects(sections: DetectedSection[], text: string): ModuleScore {
  const content = getSectionContent(sections, "projects") || text
  let score = 0

  // Has projects section: +20
  if (hasSection(sections, ["projects", "project"])) score += 20
  else if (/project/i.test(text)) score += 5

  // Has project descriptions: +20
  const descWords = content.split(/\s+/).length
  if (descWords > 100) score += 20
  else if (descWords > 50) score += 15
  else if (descWords > 20) score += 10

  // Has technical details: +15
  const techPatterns = /react|angular|vue|node|python|java|javascript|typescript|aws|docker|kubernetes|sql|api|rest|graphql|database|backend|frontend|full.stack|mobile|cloud|machine.learning|ai|algorithm|framework/i
  if (techPatterns.test(content)) score += 15

  // Has outcomes/results: +15
  if (/result|outcome|improved|increased|reduced|achieved|launched|delivered|completed|success/i.test(content)) score += 15

  // Has multiple projects: +15
  const bullets = (content.match(/[•\-–—*]\s/g) || []).length
  if (bullets >= 6) score += 15
  else if (bullets >= 3) score += 10
  else if (bullets >= 1) score += 5

  // Has URLs/links: +15
  if (/https?:\/\/|github\.com|gitlab\.com|bitbucket\.org|\.io|\.app|demo|live/i.test(content)) score += 15

  return { name: "Projects", score: Math.max(0, Math.min(100, score)), maxScore: 100, weight: 0.25 }
}

function scoreSkills(sections: DetectedSection[], text: string): ModuleScore {
  const content = getSectionContent(sections, "skills") || text
  let score = 0

  // Has skills section: +25
  if (hasSection(sections, ["skills", "technologies", "core competencies"])) score += 25
  else if (/skill|technology|proficient|expertise/i.test(text)) score += 10

  // Has technical skills listed: +20
  const techSkills = /react|vue|angular|node\.js|python|java|javascript|typescript|go|rust|c\+\+|sql|mongodb|postgresql|redis|aws|azure|gcp|docker|kubernetes|git|linux|html|css|sass|rest|graphql|api|machine.learning|ai|data|blockchain/i
  const techMatches = content.match(techSkills)
  if (techMatches && techMatches.length >= 5) score += 20
  else if (techMatches && techMatches.length >= 3) score += 15
  else if (techMatches && techMatches.length >= 1) score += 10

  // Skills are categorized: +20
  if (/skills?\s*:[\s\S]{0,200}(?:languages|technologies|tools|frameworks|databases|platforms|软|工|语|框)/i.test(text)) score += 20

  // Has proficiency levels: +15
  if (/advanced|intermediate|beginner|expert|proficient|familiar|experienced|精通|熟练|掌握|了解|高级/.test(content)) score += 15

  // Skills include soft skills: +10
  if (/communication|leadership|teamwork|problem.solving|analytical|management|organization|creative|collaboration|adaptive|strategic|沟通|领导|团队|分析|管理|创新/.test(content)) score += 10

  // Has tools/platforms: +10
  if (/jira|confluence|slack|trello|asana|notion|figma|sketch|photoshop|vscode|intellij|eclipse|postman/i.test(content)) score += 10

  return { name: "Skills", score: Math.max(0, Math.min(100, score)), maxScore: 100, weight: 0.2 }
}

function scoreEducation(sections: DetectedSection[], text: string): ModuleScore {
  const content = getSectionContent(sections, "education") || text
  let score = 0

  // Has education section: +25
  if (hasSection(sections, ["education", "academic background"])) score += 25
  else if (/education|university|college|school|degree/i.test(text)) score += 10

  // Has degree: +25
  if (/bachelor|master|phd|doctor|associate|b\.s\.|b\.a\.|m\.s\.|m\.a\.|ph\.d\.|ba|bs|ma|ms|mba/i.test(content)) score += 25
  // Chinese degrees
  if (/本科|硕士|博士|研究生|学士|大专/.test(content)) score += 20

  // Has institution name: +20
  if (/university|college|institute|school|academy|大学|学院|学校|研究院/.test(content)) score += 20

  // Has dates/years: +15
  if (/\d{4}\s*[-–—]\s*\d{4}|\d{4}\s*[-–—]\s*(present|至今)/i.test(content)) score += 15
  else if (/\d{4}/.test(content)) score += 8

  // Has major/field: +15
  if (/computer|engineering|business|science|arts|mathematics|economics|finance|major|field|专业|计算机|工程|经济|金融|数学|物理/.test(content)) score += 15

  return { name: "Education", score: Math.max(0, Math.min(100, score)), maxScore: 100, weight: 0.1 }
}

function scorePresentation(sections: DetectedSection[], text: string): ModuleScore {
  let score = 0

  // Has professional summary: +20
  if (hasSection(sections, ["summary", "profile", "objective"])) score += 20
  else if (/summary|profile|objective|about/i.test(text)) score += 10

  // Has contact info: +15
  if (/@|email|phone|linkedin|github|地址|邮箱|电话|手机|微信/.test(text)) score += 15

  // Well structured (has clear section headers): +20
  const sectionHeaders = text.match(/^[A-Z][A-Za-z\s/]+$/m)
  if (sectionHeaders && sectionHeaders.length >= 3) score += 20
  else if (sectionHeaders && sectionHeaders.length >= 1) score += 10

  // Uses bullet points or formatting: +15
  if (/[•\-–—*\n\d+\.]\s/.test(text)) score += 15

  // Appropriate length: +15
  const words = text.split(/\s+/).length
  const chars = text.length
  if (chars > 500 && chars < 5000) score += 15
  else if (chars > 300) score += 10
  else if (chars > 100) score += 5

  // Consistency (has consistent structure): +15
  const lines = text.split("\n").filter((l) => l.trim().length > 0)
  const capitalized = lines.filter((l) => /^[A-Z]/.test(l.trim())).length
  if (capitalized > lines.length * 0.5) score += 15
  else if (capitalized > lines.length * 0.3) score += 8

  return { name: "Presentation", score: Math.max(0, Math.min(100, score)), maxScore: 100, weight: 0.1 }
}

// ============================================================
// Main scoring function
// ============================================================

export function scoreResume(text: string): ScoredResult {
  const sections = detectSections(text)
  
  // Generate issues for each detected section
  const resumeSections: ResumeSection[] = sections.map((s) => {
    const issues: string[] = []
    const content = s.content
    
    // Check for missing quantified results
    if (s.name === "work experience" && !/\d+%|\$\s*\d+/.test(content)) {
      issues.push("Missing quantified achievements")
    }
    // Check for short content
    if (content.length < 30) {
      issues.push("Section content is too brief")
    }
    // Check for duty-focused language
    if (/responsible for|duties included/i.test(content)) {
      issues.push("Focuses on duties rather than achievements")
    }
    
    return { name: s.name, content: content.substring(0, 300), issues }
  })

  // Score each module
  const modules: ModuleScore[] = [
    scoreWorkExperience(sections, text),
    scoreProjects(sections, text),
    scoreSkills(sections, text),
    scoreEducation(sections, text),
    scorePresentation(sections, text),
  ]

  // Calculate weighted overall score
  const overallScore = Math.round(
    modules.reduce((sum, m) => sum + m.score * m.weight, 0)
  )

  // Improvement factors per module (how much improvement is realistically possible)
  const improvementFactors: Record<string, number> = {
    "Work Experience": 0.5,
    "Projects": 0.6,
    "Skills": 0.8,
    "Education": 0.3,
    "Presentation": 0.8,
  }

  // Calculate expected competitiveness
  const totalWeight = modules.reduce((sum, m) => sum + m.weight, 0)
  const expectedScore = modules.reduce((sum, m) => {
    const gap = 100 - m.score
    const improvement = gap * (improvementFactors[m.name] ?? 0.5)
    return sum + (m.score + improvement) * m.weight
  }, 0)

  const currentCompetitiveness = overallScore
  const expectedCompetitiveness = Math.min(100, Math.round(expectedScore))

  return {
    modules,
    overallScore,
    currentCompetitiveness,
    expectedCompetitiveness,
    sections: resumeSections,
  }
}