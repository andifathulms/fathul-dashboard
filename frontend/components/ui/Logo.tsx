import { cn } from '@/lib/utils'

/** The fathul-dashboard mark — a gradient tile with a mono "f_". Inline SVG so
 *  it stays crisp at any size and uses the app's JetBrains Mono. */
export default function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={cn('shrink-0', className)}
      role="img"
      aria-label="fathul-dashboard"
    >
      <defs>
        <linearGradient id="fd-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6d84fb" />
          <stop offset="100%" stopColor="#8f5ff0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="512" height="512" rx="115" fill="url(#fd-logo-grad)" />
      <text
        x="256"
        y="256"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace"
        fontWeight={700}
        fontSize={230}
        fill="#ffffff"
      >
        f<tspan fill="#dff0ff">_</tspan>
      </text>
    </svg>
  )
}
