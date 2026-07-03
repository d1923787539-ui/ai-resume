"use client"
interface Props { current: number; expected: number }
export default function CompetitivenessGauge({ current, expected }: Props) {
  const radius = 56, circumference = 2 * Math.PI * radius
  const currentOffset = circumference * (1 - current / 100), expectedOffset = circumference * (1 - expected / 100)
  const getColor = (s: number) => { if (s >= 80) return "#22c55e"; if (s >= 60) return "#eab308"; return "#ef4444" }
  return (
    <div className="flex justify-center gap-8 sm:gap-12">
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <circle cx="70" cy="70" r={radius} fill="none" stroke={getColor(current)} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={currentOffset} className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-surface-900">{current}</span>
            <span className="text-xs text-surface-400">Competitiveness</span>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <svg width="40" height="40" viewBox="0 0 24 24" className="text-primary-500">
          <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <circle cx="70" cy="70" r={radius} fill="none" stroke={getColor(expected)} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={expectedOffset} className="transition-all duration-1000 ease-out delay-300" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-surface-900">{expected}</span>
            <span className="text-xs text-surface-400">Expected</span>
          </div>
        </div>
      </div>
    </div>
  )
}
