import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import * as fs from "fs"
import * as path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]")
}
function readUsers(): any[] { ensureDir(); try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")) } catch { return [] } }
function writeUsers(users: any[]) { ensureDir(); fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)) }

function hash(str: string): string {
  let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h }
  return "h_" + Math.abs(h).toString(16)
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "login"
    const body = await request.json()

    if (action === "register") {
      const { email, password, name } = body
      if (!email || !password || !name) return NextResponse.json({ error: "All fields required" }, { status: 400 })
      if (password.length < 6) return NextResponse.json({ error: "Password at least 6 characters" }, { status: 400 })
      const users = readUsers()
      if (users.find((u: any) => u.email === email)) return NextResponse.json({ error: "Email already registered" }, { status: 400 })
      const user = { id: crypto.randomUUID(), email, password: hash(password), name, createdAt: new Date().toISOString() }
      users.push(user); writeUsers(users)
      return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
    }

    const { email, password } = body
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    const users = readUsers()
    const user = users.find((u: any) => u.email === email && u.password === hash(password))
    if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
