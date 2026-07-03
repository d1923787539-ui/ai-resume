export interface ResumeAnalysis {
  id: string
  createdAt: string
  fileName: string
  overallScore: number
  currentCompetitiveness: number
  expectedCompetitiveness: number
  modules: ModuleScore[]
  suggestions: Suggestion[]
  sections: ResumeSection[]
  rawText: string
}
export interface ModuleScore {
  name: string
  score: number
  maxScore: number
  weight: number
}
export interface Suggestion {
  id: string
  priority: "critical" | "important" | "optional"
  module: string
  title: string
  reason: string
  suggestion: string
  value: string
}
export interface ResumeSection {
  name: string
  content: string
  issues: string[]
}
export interface User {
  id: string
  email: string
  name: string
  resumes: ResumeAnalysis[]
}
