"use client"
import { useState } from "react"
import { FileText, History, LogIn, User, ChevronDown } from "lucide-react"
import LoginModal from "./LoginModal"
export default function Header() {
  const [showLogin, setShowLogin] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [user, setUser] = useState<any>(null)
  const handleLogout = () => { setUser(null); localStorage.removeItem("ai-resume-user"); setShowUserMenu(false) }
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-surface-900 tracking-tight">AI<span className="text-primary-500">Resume</span></span>
          </a>
          <nav className="flex items-center gap-3">
            <a href="/history" className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-1.5"><History className="w-4 h-4" />History</a>
            {user ? (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-100 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">{user.name.charAt(0)}</div>
                  <span className="text-sm text-surface-700">{user.name}</span>
                  <ChevronDown className="w-4 h-4 text-surface-400" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-surface-200 py-2">
                    <div className="px-4 py-2 text-sm text-surface-400 border-b border-surface-100">{user.email}</div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1.5"><LogIn className="w-4 h-4" />Sign In</button>
            )}
          </nav>
        </div>
      </header>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={(u: any) => { setUser(u); localStorage.setItem("ai-resume-user", JSON.stringify(u)); setShowLogin(false) }} />}
    </>
  )
}
