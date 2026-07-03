"use client"
import { ModuleScore } from "@/lib/types"
interface Props { modules: ModuleScore[]; size?: number }
export default function RadarChart({ modules, size = 280 }: Props) {
  const cx = size / 2, cy = size / 2, radius = size * 0.38, levels = 4
  const angleStep = (2 * Math.PI) / modules.length, startAngle = -Math.PI / 2
  const getPoint = (i: number, v: number, max: number) => {
    const a = startAngle + i * angleStep; const r = (v / max) * radius
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }
  const gridPolygons = Array.from({ length: levels }, (_, l) => {
    const f = (l + 1) / levels
    return modules.map((_, i) => {
      const a = startAngle + i * angleStep; const r = radius * f
      return cx + r * Math.cos(a) + "," + (cy + r * Math.sin(a))
    }).join(" ")
  })
  const dataPoints = modules.map((m, i) => {
    const p = getPoint(i, m.score, m.maxScore)
    return p.x + "," + p.y
  }).join(" ")
  const labels = modules.map((m, i) => {
    const a = startAngle + i * angleStep; const lr = radius + 28
    const x = cx + lr * Math.cos(a), y = cy + lr * Math.sin(a)
    let ta: string = "middle"
    if (Math.abs(Math.cos(a)) >= 0.1) ta = Math.cos(a) > 0 ? "start" : "end"
    return { x, y, label: m.name, score: m.score, textAnchor: ta }
  })
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {gridPolygons.map((p, i) => <polygon key={i} points={p} fill="none" stroke="#e2e8f0" strokeWidth="1" />)}
        {modules.map((_, i) => {
          const a = startAngle + i * angleStep
          return <line key={i} x1={cx} y1={cy} x2={cx + radius * Math.cos(a)} y2={cy + radius * Math.sin(a)} stroke="#e2e8f0" strokeWidth="1" />
        })}
        <polygon points={dataPoints} fill="rgba(37, 99, 235, 0.15)" stroke="#2563eb" strokeWidth="2" />
        {modules.map((m, i) => {
          const p = getPoint(i, m.score, m.maxScore)
          return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2563eb" stroke="white" strokeWidth="2" />
        })}
        {labels.map((l, i) => <text key={i} x={l.x} y={l.y} textAnchor={l.textAnchor as any} dominantBaseline="middle" className="text-xs fill-surface-500" fontSize="12">{l.label}</text>)}
      </svg>
      <div className="grid grid-cols-3 gap-3 mt-4 w-full max-w-xs">
        {modules.slice(0, 3).map((m) => <div key={m.name} className="text-center"><div className="text-lg font-semibold text-surface-900">{m.score}</div><div className="text-xs text-surface-400">{m.name}</div></div>)}
      </div>
      <div className="grid grid-cols-2 gap-6 mt-2 w-full max-w-xs">
        {modules.slice(3).map((m) => <div key={m.name} className="text-center"><div className="text-lg font-semibold text-surface-900">{m.score}</div><div className="text-xs text-surface-400">{m.name}</div></div>)}
      </div>
    </div>
  )
}
