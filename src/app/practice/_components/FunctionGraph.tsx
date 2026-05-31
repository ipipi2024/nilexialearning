'use client'

import { useId } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GraphFunction = {
  label: string
  expression: string
  color?: string
}

export type GraphPoint = {
  x: number
  y: number
  label?: string
}

export type GraphSpec = {
  title?: string
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
  functions?: GraphFunction[]
  points?: GraphPoint[]
  xLabel?: string
  yLabel?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const W = 480, H = 300
const ML = 54, MR = 18, MT = 28, MB = 44
const PW = W - ML - MR
const PH = H - MT - MB

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']

// ---------------------------------------------------------------------------
// Expression evaluator
// Expressions come from our controlled AI system prompt, not from user input.
// new Function is intentional here — see tutorPrompt.ts for the whitelist rules.
// ---------------------------------------------------------------------------

function evaluateAt(expression: string, x: number): number | null {
  try {
    const expr = expression
      .replace(/\^/g, '**')
      .replace(/\bpi\b/gi, String(Math.PI))
      // Replace bare 'e' not adjacent to letters/digits (avoid 'exp', 'e1', etc.)
      .replace(/(?<![A-Za-z0-9_])e(?![A-Za-z0-9_])/g, String(Math.E))
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\blog10\b/g, 'Math.log10')
      .replace(/\blog2\b/g, 'Math.log2')
      .replace(/\blog\b/g, 'Math.log')
      .replace(/\bexp\b/g, 'Math.exp')
    // eslint-disable-next-line no-new-func
    const result = new Function('x', `'use strict'; return (${expr})`)(x)
    return typeof result === 'number' && isFinite(result) ? result : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Tick helpers
// ---------------------------------------------------------------------------

function niceInterval(range: number, targetTicks = 6): number {
  if (range === 0) return 1
  const rough = range / targetTicks
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)))
  const normalized = rough / magnitude
  let nice: number
  if (normalized < 1.5) nice = 1
  else if (normalized < 3.5) nice = 2
  else if (normalized < 7.5) nice = 5
  else nice = 10
  return nice * magnitude
}

function generateTicks(min: number, max: number, targetTicks = 6): number[] {
  const interval = niceInterval(max - min, targetTicks)
  const start = Math.ceil((min - 1e-10) / interval) * interval
  const ticks: number[] = []
  for (
    let t = Math.round(start * 1e10) / 1e10;
    t <= max + 1e-10 && ticks.length < 24;
    t = Math.round((t + interval) * 1e10) / 1e10
  ) {
    ticks.push(t)
  }
  return ticks
}

// ---------------------------------------------------------------------------
// SVG path builder
// ---------------------------------------------------------------------------

function buildPath(
  expression: string,
  xMin: number, xMax: number,
  yMin: number, yMax: number,
  toSvgX: (x: number) => number,
  toSvgY: (y: number) => number,
): string {
  const STEPS = 400
  const yRange = yMax - yMin
  const yPad = yRange * 0.15
  const parts: string[] = []
  let inPath = false
  let prevY: number | null = null

  for (let i = 0; i <= STEPS; i++) {
    const x = xMin + (i / STEPS) * (xMax - xMin)
    const y = evaluateAt(expression, x)

    const outOfRange = y === null || y < yMin - yPad || y > yMax + yPad
    // Discontinuity: huge jump suggests a vertical asymptote
    const isDiscontinuous =
      !outOfRange && prevY !== null && Math.abs(y! - prevY) > yRange * 6

    if (outOfRange || isDiscontinuous) {
      inPath = false
      prevY = null
      continue
    }

    const sx = toSvgX(x).toFixed(1)
    const sy = toSvgY(y!).toFixed(1)
    parts.push(inPath ? `L${sx} ${sy}` : `M${sx} ${sy}`)
    inPath = true
    prevY = y!
  }

  return parts.join(' ')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FunctionGraph({ spec }: { spec: GraphSpec }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, 'u')

  const xMin = spec.xMin ?? -5
  const xMax = spec.xMax ?? 5
  const yMin = spec.yMin ?? -5
  const yMax = spec.yMax ?? 5

  const toSvgX = (x: number) => ML + ((x - xMin) / (xMax - xMin)) * PW
  const toSvgY = (y: number) => MT + (1 - (y - yMin) / (yMax - yMin)) * PH

  // Where the axes cross the plot edges (clamped so they're always visible)
  const xAxisY = Math.max(MT, Math.min(MT + PH, toSvgY(0)))
  const yAxisX = Math.max(ML, Math.min(ML + PW, toSvgX(0)))

  const xTicks = generateTicks(xMin, xMax)
  const yTicks = generateTicks(yMin, yMax)
  const fns = spec.functions ?? []
  const pts = spec.points ?? []

  // Format a tick label: trim unnecessary decimal zeros
  const fmt = (n: number) => {
    const s = n.toPrecision(4).replace(/\.?0+$/, '')
    return s === '-0' ? '0' : s
  }

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white p-3">
      {spec.title && (
        <p className="text-center text-xs font-semibold text-gray-700 mb-1 select-none">
          {spec.title}
        </p>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxWidth: W, display: 'block', margin: '0 auto' }}
        aria-label={spec.title ?? 'Function graph'}
      >
        <defs>
          <clipPath id={uid}>
            <rect x={ML} y={MT} width={PW} height={PH} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {xTicks.map((t) => (
          <line
            key={`gx${t}`}
            x1={toSvgX(t)} y1={MT} x2={toSvgX(t)} y2={MT + PH}
            stroke="#e5e7eb" strokeWidth="0.5"
          />
        ))}
        {yTicks.map((t) => (
          <line
            key={`gy${t}`}
            x1={ML} y1={toSvgY(t)} x2={ML + PW} y2={toSvgY(t)}
            stroke="#e5e7eb" strokeWidth="0.5"
          />
        ))}

        {/* Axes */}
        <line x1={ML} y1={xAxisY} x2={ML + PW} y2={xAxisY} stroke="#9ca3af" strokeWidth="1.5" />
        <line x1={yAxisX} y1={MT} x2={yAxisX} y2={MT + PH} stroke="#9ca3af" strokeWidth="1.5" />

        {/* X-axis tick marks + labels */}
        {xTicks.map((t) => {
          const sx = toSvgX(t)
          return (
            <g key={`xt${t}`}>
              <line x1={sx} y1={xAxisY - 3} x2={sx} y2={xAxisY + 3} stroke="#9ca3af" strokeWidth="1" />
              <text x={sx} y={xAxisY + 14} textAnchor="middle" fontSize="11" fill="#6b7280">
                {fmt(t)}
              </text>
            </g>
          )
        })}

        {/* Y-axis tick marks + labels (skip 0 — x-axis label already shows it) */}
        {yTicks.filter((t) => t !== 0).map((t) => {
          const sy = toSvgY(t)
          return (
            <g key={`yt${t}`}>
              <line x1={yAxisX - 3} y1={sy} x2={yAxisX + 3} y2={sy} stroke="#9ca3af" strokeWidth="1" />
              <text x={yAxisX - 6} y={sy + 3.5} textAnchor="end" fontSize="11" fill="#6b7280">
                {fmt(t)}
              </text>
            </g>
          )
        })}

        {/* Optional axis labels */}
        {spec.xLabel && (
          <text x={ML + PW / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="#374151">
            {spec.xLabel}
          </text>
        )}
        {spec.yLabel && (
          <text
            x={10} y={MT + PH / 2}
            textAnchor="middle" fontSize="12" fill="#374151"
            transform={`rotate(-90, 10, ${MT + PH / 2})`}
          >
            {spec.yLabel}
          </text>
        )}

        {/* Function curves + points (clipped to plot area) */}
        <g clipPath={`url(#${uid})`}>
          {fns.map((fn, i) => {
            const color = fn.color ?? COLORS[i % COLORS.length]
            const d = buildPath(fn.expression, xMin, xMax, yMin, yMax, toSvgX, toSvgY)
            return d ? (
              <path key={i} d={d} stroke={color} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
            ) : null
          })}

          {pts.map((pt, i) => {
            if (pt.x < xMin || pt.x > xMax || pt.y < yMin || pt.y > yMax) return null
            return (
              <circle
                key={`pt${i}`}
                cx={toSvgX(pt.x)} cy={toSvgY(pt.y)} r="4.5"
                fill={COLORS[0]} stroke="white" strokeWidth="1.5"
              />
            )
          })}
        </g>

        {/* Point labels — outside clip so they can overhang slightly */}
        {pts.map((pt, i) => {
          if (!pt.label) return null
          const cx = toSvgX(pt.x), cy = toSvgY(pt.y)
          const flipX = cx > ML + PW - 60
          return (
            <text
              key={`ptl${i}`}
              x={flipX ? cx - 7 : cx + 8} y={cy - 6}
              textAnchor={flipX ? 'end' : 'start'}
              fontSize="10" fill={COLORS[0]} fontWeight="500"
            >
              {pt.label}
            </text>
          )
        })}

        {/* Plot border */}
        <rect x={ML} y={MT} width={PW} height={PH} fill="none" stroke="#d1d5db" strokeWidth="1" />
      </svg>

      {/* Legend */}
      {fns.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 mt-2 px-2">
          {fns.map((fn, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <svg width="18" height="3" className="shrink-0">
                <line x1="0" y1="1.5" x2="18" y2="1.5"
                  stroke={fn.color ?? COLORS[i % COLORS.length]}
                  strokeWidth="2.2"
                />
              </svg>
              <span className="text-xs text-gray-600">{fn.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
