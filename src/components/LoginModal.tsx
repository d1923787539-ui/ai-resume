"use client"
import { useState } from "react"
import { X, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react"
interface Props { onClose: () => void; onLogin: (user: any) => void }
export default function LoginModal({ onClose, onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("")
  const [loading, setLoading] = useState(false); const [error, setError] = useState("")
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("")
    try {
      const endpoint = "/api/auth?action=" + mode
      const body = mode === "login" ? { email, password } : { email, password, name }
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed"); return }
      onLogin(data.user)
    } catch { setError("Network error") }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-surface-900">{mode === "login" ? "Sign In" : "Register"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100"><X className="w-5 h-5 text-surface-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Name</label>
            <div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field !pl-10" placeholder="Your name" required /></div></div>
          )}
          <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
          <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field !pl-10" placeholder="Email address" required /></div></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field !pl-10" placeholder="At least 6 characters" minLength={6} required /></div></div>
          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">{loading && <Loader2 className="w-4 h-4 animate-spin" />}{mode === "login" ? "Sign In" : "Create Account"}</button>
        </form>
        <div className="mt-4 text-center text-sm text-surface-400">
          {mode === "login" ? <>No account? <button onClick={() => { setMode("register"); setError("") }} className="text-primary-500 hover:text-primary-600 font-medium">Register</button></>
          : <>Already have an account? <button onClick={() => { setMode("login"); setError("") }} className="text-primary-500 hover:text-primary-600 font-medium">Sign In</button></>}
        </div>
      </div>
    </div>
  )
}
