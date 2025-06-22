'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface ServiceCardProps {
  href: string
  title: string
  description?: string
  icon?: React.ReactNode
}

export function ServiceCard({ href, title, description, icon }: ServiceCardProps) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-[#8B7E74] hover:bg-[#7A6E64] transition-all duration-300 rounded-2xl p-6 h-full flex flex-col items-center justify-center gap-4 shadow-lg hover:shadow-xl"
      >
        {icon && <div className="text-4xl text-white">{icon}</div>}
        <h3 className="text-white font-medium text-xl text-center">{title}</h3>
        {description && (
          <p className="text-white/80 text-sm text-center">{description}</p>
        )}
      </motion.div>
    </Link>
  )
}
