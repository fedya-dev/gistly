interface LogoProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gistly-g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#gistly-g)" />
      <rect width="64" height="64" rx="15" fill="black" opacity="0.08" />
      <path
        d="M23 23 L13.5 32 L23 41"
        stroke="white"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M41 23 L50.5 32 L41 41"
        stroke="white"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M35.5 19.5 L28.5 44.5" stroke="white" strokeWidth="4.6" strokeLinecap="round" />
    </svg>
  )
}
