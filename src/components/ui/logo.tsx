import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const sizeConfig = {
  sm: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    accent: 'w-4 h-4',
    accentDot: 'w-1.5 h-1.5',
    text: 'text-xl',
    subtitle: 'text-sm'
  },
  md: {
    container: 'w-16 h-16',
    icon: 'w-8 h-8',
    accent: 'w-5 h-5',
    accentDot: 'w-2 h-2',
    text: 'text-2xl',
    subtitle: 'text-base'
  },
  lg: {
    container: 'w-20 h-20',
    icon: 'w-10 h-10',
    accent: 'w-6 h-6',
    accentDot: 'w-2 h-2',
    text: 'text-4xl',
    subtitle: 'text-lg'
  },
  xl: {
    container: 'w-24 h-24',
    icon: 'w-12 h-12',
    accent: 'w-7 h-7',
    accentDot: 'w-2.5 h-2.5',
    text: 'text-5xl',
    subtitle: 'text-xl'
  }
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const config = sizeConfig[size]

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Main Logo Container with Autism Awareness Colors */}
        <div className={`${config.container} bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden`}>
          {/* Autism awareness ribbon pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1 left-1 w-2 h-2 bg-red-400 rounded-full"></div>
            <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>

          <div className="text-white font-bold relative z-10">
            <svg className={config.icon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Puzzle piece representing autism awareness */}
              <path
                d="M8 8h6c0-2 2-4 4-4s4 2 4 4h6c2 0 4 2 4 4v6c2 0 4 2 4 4s-2 4-4 4v6c0 2-2 4-4 4h-6c0 2-2 4-4 4s-4-2-4-4H8c-2 0-4-2-4-4v-6c-2 0-4-2-4-4s2-4 4-4V8c0-2 2-4 4-4z"
                fill="white"
                fillOpacity="0.95"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.5"
              />
              {/* Heart in center representing care */}
              <path
                d="M20 28c0 0-8-5 -8-12c0-3 2.5-5 5.5-5c1.5 0 2.5 1 2.5 2c0-1 1-2 2.5-2c3 0 5.5 2 5.5 5c0 7-8 12-8 12z"
                fill="rgba(255,255,255,0.8)"
              />
            </svg>
          </div>
        </div>

        {/* Multi-colored Accent Dots representing diversity */}
        <div className="absolute -top-1 -right-1 flex gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
        </div>
        <div className="absolute -bottom-1 -left-1 flex gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
        </div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="ml-4 space-y-1">
          <h1 className={`${config.text} font-bold text-[#4A4A4A] tracking-tight leading-tight`}>
            Early Autism Detector
          </h1>
          <p className={`${config.subtitle} text-[#6B7280] font-medium leading-tight`}>
            Caring for Your Child's Development
          </p>
        </div>
      )}
    </div>
  )
}

export function LogoIcon({ size = 'md', className = '' }: Omit<LogoProps, 'showText'>) {
  return <Logo size={size} showText={false} className={className} />
}
