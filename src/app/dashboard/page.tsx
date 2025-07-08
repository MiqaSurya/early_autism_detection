'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ServiceCard } from '@/components/dashboard/service-card'
import { ClipboardList, MessageCircle, MapPin, LogOut, User, Heart, Brain, Users, BookOpen, Lightbulb, Shield } from 'lucide-react'
import { signOut } from '@/lib/supabase'
// import EmergencyNearestCenter from '@/components/dashboard/EmergencyNearestCenter'
import { Logo } from '@/components/ui/logo'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 px-4 relative overflow-hidden">
      {/* Autism Awareness Ribbon Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-red-400 rounded-full"></div>
        <div className="absolute bottom-40 left-32 w-28 h-28 bg-yellow-400 rounded-full"></div>
        <div className="absolute bottom-20 right-40 w-20 h-20 bg-green-400 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-purple-400 rounded-full"></div>
      </div>

      <motion.div
        className="max-w-6xl mx-auto py-12 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section with Logo */}
        <motion.div
          className="text-center mb-16"
          variants={itemVariants}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <Logo size="lg" />
            <div className="mt-6 flex justify-center items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600 ml-2">Supporting Every Child's Journey</span>
            </div>
          </div>
        </motion.div>
        {/* Welcome Message */}
        <motion.div
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 mb-12 shadow-lg border border-white/30"
          variants={itemVariants}
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Empowering Families Through Early Detection
            </h1>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Every child deserves the best start in life. Our comprehensive tools help you understand,
              support, and celebrate your child's unique development journey.
            </p>
          </div>
        </motion.div>

        {/* Enhanced Service Cards */}
        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <ClipboardList className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-3">M-CHAT-R Assessment</h3>
                <p className="text-gray-600 text-center text-sm mb-4 leading-relaxed">
                  Complete our scientifically-validated screening tool designed for early autism detection
                </p>
                <Link href="/dashboard/questionnaire" className="block">
                  <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200">
                    Start Assessment
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-3">AI Information Hub</h3>
                <p className="text-gray-600 text-center text-sm mb-4 leading-relaxed">
                  Get instant, expert answers about autism, development, and support strategies
                </p>
                <Link href="/dashboard/chat" className="block">
                  <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200">
                    Ask Questions
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-3">Support Center Locator</h3>
                <p className="text-gray-600 text-center text-sm mb-4 leading-relaxed">
                  Find nearby autism specialists, therapy centers, and support resources
                </p>
                <Link href="/dashboard/locator" className="block">
                  <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200">
                    Find Centers
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-3">Child Progress Hub</h3>
                <p className="text-gray-600 text-center text-sm mb-4 leading-relaxed">
                  Track development milestones and view comprehensive assessment history
                </p>
                <Link href="/dashboard/progress" className="block">
                  <button className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-xl font-medium hover:from-teal-600 hover:to-teal-700 transition-all duration-200">
                    View Progress
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Emergency Nearest Center - Temporarily disabled */}
        {/* <motion.div
          className="mb-12"
          variants={itemVariants}
        >
          <EmergencyNearestCenter />
        </motion.div> */}

        {/* About Autism Information Section */}
        <motion.div
          className="mb-16"
          variants={itemVariants}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/30">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-6">
                Understanding Autism Spectrum Disorder
              </h2>
              <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                Autism is a beautiful part of human neurodiversity. Early understanding and support
                help every child reach their unique potential and thrive in their own special way.
              </p>
            </div>

            {/* Enhanced Key Information Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
              <motion.div
                className="group relative"
                variants={itemVariants}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center border border-blue-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Brain className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-800 mb-4">Early Recognition</h3>
                  <p className="text-blue-700 leading-relaxed">
                    Understanding unique communication styles, sensory preferences, and behavioral patterns.
                    Every sign is a window into your child's beautiful mind.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="group relative"
                variants={itemVariants}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 text-center border border-red-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Heart className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-800 mb-4">Loving Support</h3>
                  <p className="text-red-700 leading-relaxed">
                    With understanding, patience, and the right support, every child can flourish.
                    Celebrate differences and nurture each child's unique strengths.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="group relative"
                variants={itemVariants}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8 text-center border border-green-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-4">Community Connection</h3>
                  <p className="text-green-700 leading-relaxed">
                    Building bridges between families, specialists, and communities.
                    Together, we create a world where every child belongs and thrives.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Statistics and Facts */}
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-teal-500/10 backdrop-blur-sm rounded-3xl p-8 border border-white/30">
              <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">Autism by the Numbers</h3>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="group">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">1:36</span>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">1 in 36</div>
                  <p className="text-gray-700 font-medium">Children are part of the autism spectrum</p>
                  <p className="text-sm text-gray-600 mt-1">Each one unique and valuable</p>
                </div>
                <div className="group">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl font-bold text-white">18m</span>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">18-24</div>
                  <p className="text-gray-700 font-medium">Months for optimal screening</p>
                  <p className="text-sm text-gray-600 mt-1">Early understanding, better outcomes</p>
                </div>
                <div className="group">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">85%</span>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">85%</div>
                  <p className="text-gray-700 font-medium">Benefit from early support</p>
                  <p className="text-sm text-gray-600 mt-1">Hope, progress, and growth</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tips and Resources Section */}
        <motion.div
          className="mb-12"
          variants={itemVariants}
        >
          <div className="bg-gradient-to-br from-[#A7C4D9] to-[#B8D4E3] rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[#4A4A4A] text-center mb-8">
              Tips for Supporting Your Child's Development
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#4A4A4A] mb-1">Create Routines</h4>
                    <p className="text-sm text-[#5A5A5A]">Consistent daily routines help children feel secure and understand expectations.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#4A4A4A] mb-1">Use Visual Supports</h4>
                    <p className="text-sm text-[#5A5A5A]">Pictures, schedules, and visual cues can improve communication and understanding.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Heart className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#4A4A4A] mb-1">Celebrate Progress</h4>
                    <p className="text-sm text-[#5A5A5A]">Acknowledge small achievements and focus on your child's unique strengths.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#4A4A4A] mb-1">Build Social Skills</h4>
                    <p className="text-sm text-[#5A5A5A]">Practice social interactions through play, games, and structured activities.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#4A4A4A] mb-1">Manage Sensory Needs</h4>
                    <p className="text-sm text-[#5A5A5A]">Create sensory-friendly environments and identify triggers or preferences.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#4A4A4A] mb-1">Seek Professional Help</h4>
                    <p className="text-sm text-[#5A5A5A]">Work with specialists, therapists, and educators to create the best support plan.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Logout Section */}
        <motion.div
          className="text-center"
          variants={itemVariants}
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 inline-block shadow-lg border border-white/30">
            <p className="text-gray-600 mb-4 text-sm">Thank you for using Early Autism Detector</p>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transition-all duration-300 rounded-xl py-3 px-8 font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <LogOut size={20} />
              Sign Out Safely
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
