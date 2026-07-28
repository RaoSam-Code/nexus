// Nexus SVG logo — geometric hexagonal node mark with neon cyan/purple
export default function NexusLogo({
  size = 32,
  showText = true,
  className = '',
}: {
  size?: number
  showText?: boolean
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Nexus logo"
      >
        {/* Outer hexagon */}
        <path
          d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
          stroke="#00f2ff"
          strokeWidth="1.5"
          fill="rgba(0,242,255,0.06)"
        />
        {/* Inner node connections */}
        <line x1="20" y1="8"  x2="12" y2="20" stroke="#bc13fe" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="8"  x2="28" y2="20" stroke="#bc13fe" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="20" x2="20" y2="32" stroke="#00f2ff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="28" y1="20" x2="20" y2="32" stroke="#00f2ff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="20" x2="28" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
        {/* Nodes */}
        <circle cx="20" cy="8"  r="2.5" fill="#00f2ff" />
        <circle cx="12" cy="20" r="2.5" fill="#bc13fe" />
        <circle cx="28" cy="20" r="2.5" fill="#bc13fe" />
        <circle cx="20" cy="32" r="2.5" fill="#00f2ff" />
        {/* Center glow */}
        <circle cx="20" cy="20" r="2" fill="rgba(0,242,255,0.4)" />
      </svg>
      {showText && (
        <span
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: size * 0.6, letterSpacing: '-0.02em' }}
          className="text-gradient-nexus select-none"
        >
          nexus
        </span>
      )}
    </div>
  )
}
