import { cn } from "@/lib/utils"


export function VPayLogo({ size = "md", variant = "default", className }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  }

  // Icon-only version - Unique Token Vesting Visualization
  if (variant === "icon") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <defs>
            <linearGradient id="vpay-unique-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <radialGradient id="vpay-token-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#3B82F6" />
            </radialGradient>
          </defs>

          {/* Unique concept: Token "Waterfall" forming a V */}
          {/* This represents tokens cascading down through vesting periods */}

          {/* Top reservoir (locked tokens) */}
          <ellipse
            cx="20"
            cy="8"
            rx="12"
            ry="3"
            fill="url(#vpay-token-gradient)"
            opacity="0.3"
            stroke="url(#vpay-unique-gradient)"
            strokeWidth="1"
          />

          {/* Token waterfall - left cascade */}
          <g opacity="0.8">
            {/* Level 1 */}
            <circle cx="16" cy="12" r="1.5" fill="url(#vpay-unique-gradient)" />
            <circle cx="14" cy="13" r="1.2" fill="url(#vpay-unique-gradient)" opacity="0.8" />

            {/* Level 2 */}
            <circle cx="14" cy="16" r="1.5" fill="url(#vpay-unique-gradient)" />
            <circle cx="12" cy="17" r="1.2" fill="url(#vpay-unique-gradient)" opacity="0.8" />
            <circle cx="16" cy="17.5" r="1" fill="url(#vpay-unique-gradient)" opacity="0.6" />

            {/* Level 3 */}
            <circle cx="12" cy="20" r="1.5" fill="url(#vpay-unique-gradient)" />
            <circle cx="10" cy="21" r="1.2" fill="url(#vpay-unique-gradient)" opacity="0.8" />
            <circle cx="14" cy="21.5" r="1" fill="url(#vpay-unique-gradient)" opacity="0.6" />

            {/* Level 4 */}
            <circle cx="10" cy="24" r="1.5" fill="url(#vpay-unique-gradient)" />
            <circle cx="8" cy="25" r="1.2" fill="url(#vpay-unique-gradient)" opacity="0.8" />
            <circle cx="12" cy="25.5" r="1" fill="url(#vpay-unique-gradient)" opacity="0.6" />
          </g>

          {/* Token waterfall - right cascade */}
          <g opacity="0.8">
            {/* Level 1 */}
            <circle cx="24" cy="12" r="1.5" fill="url(#vpay-unique-gradient)" />
            <circle cx="26" cy="13" r="1.2" fill="url(#vpay-unique-gradient)" opacity="0.8" />

            {/* Level 2 */}
            <circle cx="26" cy="16" r="1.5" fill="url(#vpay-unique-gradient)" />
            <circle cx="28" cy="17" r="1.2" fill="url(#vpay-unique-gradient)" opacity="0.8" />
            <circle cx="24" cy="17.5" r="1" fill="url(#vpay-unique-gradient)" opacity="0.6" />

            {/* Level 3 */}
            <circle cx="28" cy="20" r="1.5" fill="url(#vpay-unique-gradient)" />
            <circle cx="30" cy="21" r="1.2" fill="url(#vpay-unique-gradient)" opacity="0.8" />
            <circle cx="26" cy="21.5" r="1" fill="url(#vpay-unique-gradient)" opacity="0.6" />

            {/* Level 4 */}
            <circle cx="30" cy="24" r="1.5" fill="url(#vpay-unique-gradient)" />
            <circle cx="32" cy="25" r="1.2" fill="url(#vpay-unique-gradient)" opacity="0.8" />
            <circle cx="28" cy="25.5" r="1" fill="url(#vpay-unique-gradient)" opacity="0.6" />
          </g>

          {/* Central collection pool (available tokens) */}
          <ellipse
            cx="20"
            cy="30"
            rx="8"
            ry="2.5"
            fill="url(#vpay-token-gradient)"
            opacity="0.4"
            stroke="url(#vpay-unique-gradient)"
            strokeWidth="1.5"
          />

          {/* Available tokens in pool */}
          <circle cx="18" cy="30" r="1.5" fill="url(#vpay-unique-gradient)" />
          <circle cx="22" cy="30" r="1.5" fill="url(#vpay-unique-gradient)" />
          <circle cx="20" cy="29" r="1.2" fill="url(#vpay-unique-gradient)" opacity="0.9" />

          {/* Unique element: Vesting "Gates" */}
          {/* These represent the time barriers that control token flow */}
          <g stroke="url(#vpay-unique-gradient)" strokeWidth="2" fill="none" opacity="0.4">
            <path d="M6 14 L34 14" strokeDasharray="2 3" />
            <path d="M4 18 L36 18" strokeDasharray="2 3" />
            <path d="M2 22 L38 22" strokeDasharray="2 3" />
            <path d="M0 26 L40 26" strokeDasharray="2 3" />
          </g>

          {/* Time progression indicator */}
          <g transform="translate(35, 6)" opacity="0.6">
            <circle cx="0" cy="0" r="2" fill="none" stroke="url(#vpay-unique-gradient)" strokeWidth="1" />
            <path d="M0 -1.5 L0 0 L1 1" stroke="url(#vpay-unique-gradient)" strokeWidth="1" fill="none" />
          </g>
        </svg>
      </div>
    )
  }

  // Text-only version with unique styling
  if (variant === "text") {
    return (
      <div className={cn("relative", className)}>
        <div className={cn("font-black tracking-tight", textSizeClasses[size])}>
          <span className="bg-gradient-to-r from-blue-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
            V
          </span>
          <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Pay</span>
        </div>
        {/* Unique underline that mimics token flow */}
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-blue-500 to-cyan-500 opacity-60" />
        <div className="absolute -bottom-0.5 left-1 w-1 h-1 rounded-full bg-cyan-400 opacity-80" />
        <div className="absolute -bottom-0.5 left-3 w-0.5 h-0.5 rounded-full bg-blue-400 opacity-60" />
        <div className="absolute -bottom-0.5 right-2 w-0.5 h-0.5 rounded-full bg-blue-400 opacity-40" />
      </div>
    )
  }

  // Stacked version
  if (variant === "stacked") {
    return (
      <div className={cn("flex flex-col items-center gap-1", className)}>
        <VPayLogo size={size} variant="icon" />
        <VPayLogo size="sm" variant="text" />
      </div>
    )
  }

  // Default horizontal version
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <VPayLogo size={size} variant="icon" />
      <VPayLogo size={size} variant="text" />
    </div>
  )
}
