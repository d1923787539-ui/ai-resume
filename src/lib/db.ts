import { ResumeAnalysis, User } from "./types"
import * as fs from "fs"
import * as path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")
const RESUMES_FILE = path.join(DATA_DIR, "resumes.json")

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]")
  if (!fs.existsSync(RESUMES_FILE)) fs.writeFileSync(RESUMES_FILE, "[]")
}

function readJSON<T>(file: string): T[] {
  ensureDataDir()
  try { return JSON.parse(fs.readFileSync(file, "utf-8")) as T[] }
  catch { return [] }
}

function writeJSON<T>(file: string, data: T[]) {
  ensureDataDir()
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

export function getUsers(): User[] { return readJSON<User>(USERS_FILE) }
export function getUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email === email)
}
export function createUser(user: User) {
  const users = getUsers()
  users.push(user)
  writeJSON(USERS_FILE, users)
}
export function getResumes(): ResumeAnalysis[] { return readJSON<ResumeAnalysis>(RESUMES_FILE) }
export function getResumesByUser(userId: string): ResumeAnalysis[] {
  return getResumes().filter((r) => r.id.startsWith(userId + "-"))
}
export function saveResume(userId: string | null, resume: ResumeAnalysis) {
  const resumes = getResumes()
  const id = userId ? userId + "-" + Date.now() : "anon-" + Date.now()
  resume.id = id
  resumes.push(resume)
  writeJSON(RESUMES_FILE, resumes)
  return resume
}
