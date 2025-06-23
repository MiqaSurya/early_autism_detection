'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ServiceCard } from '@/components/dashboard/service-card'
import { ClipboardList, MessageCircle, MapPin, LogOut } from 'lucide-react'
import { signOut } from '@/lib/supabase'
import EmergencyNearestCenter from '@/components/dashboard/EmergencyNearestCenter'

export default function DashboardPage() {
  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF3F0] px-4">
      <motion.div 
        className="max-w-4xl mx-auto py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="bg-[#A7C4D9] rounded-3xl p-8 mb-12 shadow-lg"
          variants={itemVariants}
        >
          <h1 className="text-3xl font-serif text-[#4A4A4A] text-center leading-relaxed">
            The services we have to help you early detecting your child
          </h1>
        </motion.div>

        <motion.div 
          className="grid gap-6 md:grid-cols-3 mb-12"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <ServiceCard
              href="/dashboard/questionnaire"
              title="QUESTIONNAIRE"
              description="Complete our age-appropriate screening assessment"
              icon={<ClipboardList />}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <ServiceCard
              href="/dashboard/chat"
              title="INFORMATION"
              description="Get instant answers about autism and development"
              icon={<MessageCircle />}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <ServiceCard
              href="/dashboard/locator"
              title="CENTER LOCATOR"
              description="Find nearby support centers and specialists"
              icon={<MapPin />}
            />
          </motion.div>
        </motion.div>

        {/* Emergency Nearest Center */}
        <motion.div
          className="mb-8"
          variants={itemVariants}
        >
          <EmergencyNearestCenter />
        </motion.div>

        <motion.div
          className="text-center"
          variants={itemVariants}
        >
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-[#E8DCDA] hover:bg-[#D8CCCA] transition-all duration-300 rounded-full py-3 px-8 text-[#4A4A4A] font-medium shadow hover:shadow-md"
          >
            <LogOut size={20} />
            LOGOUT
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
