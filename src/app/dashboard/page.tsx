'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ServiceCard } from '@/components/dashboard/service-card'
import { ClipboardList, MessageCircle, MapPin, LogOut, User, Heart, Brain, Users, BookOpen, Lightbulb, Shield, ArrowRight, Star, CheckCircle } from 'lucide-react'
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background decorative autism-themed elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Autism awareness puzzle pieces */}
        <div className="absolute top-20 left-10 opacity-6 transform rotate-12">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg relative">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Colorful therapy blocks - top right */}
        <div className="absolute top-32 right-10 opacity-5 transform -rotate-6">
          <div className="grid grid-cols-2 gap-1">
            <div className="w-6 h-6 bg-red-400 rounded"></div>
            <div className="w-6 h-6 bg-blue-400 rounded"></div>
            <div className="w-6 h-6 bg-green-400 rounded"></div>
            <div className="w-6 h-6 bg-yellow-400 rounded"></div>
          </div>
        </div>

        {/* Heart shape - bottom left */}
        <div className="absolute bottom-32 left-20 opacity-6 transform rotate-6">
          <div className="relative w-16 h-14">
            <div className="absolute top-0 left-0 w-8 h-8 bg-pink-400 rounded-full transform rotate-45"></div>
            <div className="absolute top-0 right-0 w-8 h-8 bg-pink-400 rounded-full transform rotate-45"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-10 border-l-transparent border-r-transparent border-t-pink-400"></div>
          </div>
        </div>

        {/* Large puzzle piece - bottom right */}
        <div className="absolute bottom-20 right-20 opacity-4 transform -rotate-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg relative">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full"></div>
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full"></div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Small floating puzzle pieces */}
        <div className="absolute top-1/3 left-1/4 opacity-4">
          <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded relative">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full"></div>
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="absolute top-2/3 right-1/3 opacity-4">
          <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded relative">
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full"></div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 opacity-3 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-gradient-to-br from-rose-400 to-rose-600 rounded relative">
            <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full"></div>
            <div className="absolute -right-0.5 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Header Navigation */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size="sm" />
              <span className="ml-3 text-lg font-semibold text-gray-900">Early Autism Detection Companion</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <motion.div
        className="relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-purple-700 text-white relative overflow-hidden"
          variants={itemVariants}
        >
          {/* Hero background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Subtle puzzle pieces in hero */}
            <div className="absolute top-10 right-20 opacity-10">
              <div className="w-12 h-12 bg-white rounded-lg relative">
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>

            <div className="absolute bottom-15 left-20 opacity-8">
              <div className="w-9 h-9 bg-white rounded-lg relative">
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="absolute top-1/2 left-10 opacity-6">
              <div className="w-7 h-7 bg-white rounded-lg relative">
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                <div className="absolute -right-0.5 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                <div className="absolute -left-0.5 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Floating hearts */}
            <div className="absolute top-20 left-1/3 opacity-15">
              <div className="relative w-5 h-4">
                <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-white rounded-full transform rotate-45"></div>
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-white rounded-full transform rotate-45"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2.5 border-r-2.5 border-t-3 border-l-transparent border-r-transparent border-t-white"></div>
              </div>
            </div>

            <div className="absolute bottom-20 right-1/3 opacity-12">
              <div className="relative w-4 h-3">
                <div className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full transform rotate-45"></div>
                <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full transform rotate-45"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-white"></div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
            <div className="text-center">
              <motion.h1
                className="text-4xl md:text-6xl font-bold mb-6"
                variants={itemVariants}
              >
                Creating connections for the
                <span className="block text-blue-200">Autism community to live fully.</span>
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100"
                variants={itemVariants}
              >
                Every child deserves the best start in life. Our comprehensive tools help you understand, support, and celebrate your child's unique development journey.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={itemVariants}
              >
                <Link href="/dashboard/questionnaire">
                  <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
                    Start Assessment
                    <ArrowRight size={20} />
                  </button>
                </Link>
                <Link href="/dashboard/locator">
                  <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                    Find Support Centers
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Services Section */}
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
          variants={containerVariants}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Connect to Knowledge
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The Early Autism Detection Companion is your connection to resources, assessments, and support for the Autism community.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <motion.div variants={itemVariants}>
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <ClipboardList className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">M-CHAT-R Assessment</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Complete our scientifically-validated screening tool designed for early autism detection.
                  </p>
                  <Link href="/dashboard/questionnaire" className="block">
                    <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      Start Assessment
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">AI Information Hub</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Get instant, expert answers about autism, development, and support strategies.
                  </p>
                  <Link href="/dashboard/chat" className="block">
                    <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                      Ask Questions
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Support Center Locator</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Find nearby autism specialists, therapy centers, and support resources.
                  </p>
                  <Link href="/dashboard/locator" className="block">
                    <button className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
                      Find Centers
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Child Progress Hub</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Track development milestones and view comprehensive assessment history.
                  </p>
                  <Link href="/dashboard/progress" className="block">
                    <button className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors">
                      View Progress
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* The Autism Experience Section */}
        <motion.div
          className="bg-gray-50 py-16"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  The Autism Experience
                </h2>
                <h3 className="text-xl font-semibold text-blue-600 mb-4">
                  Everyone's story is different.
                </h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  The experience of Autism is not one thing. It is many things. It's dreams, talents, relationships, victories, hurdles, and everything in between. The connection between those experiences is you.
                </p>
                <p className="text-lg font-semibold text-gray-900 mb-8">
                  You break the mold. No matter who you are, the person you are is infinite—and you are the only you there is.
                </p>
                <Link href="/dashboard/questionnaire">
                  <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                    Learn More
                    <ArrowRight size={20} />
                  </button>
                </Link>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Brain className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Screening & Diagnosis</h4>
                    <p className="text-sm text-gray-600">Identifying Autism, related conditions, and educational evaluations.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Resources by Topic</h4>
                    <p className="text-sm text-gray-600">Find the support you need, when you need it by accessing our resources.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Get Involved</h4>
                    <p className="text-sm text-gray-600">Work together, make a difference. Learn more about our programs.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-red-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Support</h4>
                    <p className="text-sm text-gray-600">Connect to local support and resources in your area.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          className="bg-white py-16"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Autism by the Numbers
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Understanding the prevalence and importance of early detection in the autism community.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                className="text-center"
                variants={itemVariants}
              >
                <div className="bg-blue-50 rounded-lg p-8">
                  <div className="text-4xl font-bold text-blue-600 mb-2">1 in 36</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Children are part of the autism spectrum</h3>
                  <p className="text-gray-600">Each one unique and valuable</p>
                </div>
              </motion.div>
              <motion.div
                className="text-center"
                variants={itemVariants}
              >
                <div className="bg-green-50 rounded-lg p-8">
                  <div className="text-4xl font-bold text-green-600 mb-2">18-24</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Months for optimal screening</h3>
                  <p className="text-gray-600">Early understanding, better outcomes</p>
                </div>
              </motion.div>
              <motion.div
                className="text-center"
                variants={itemVariants}
              >
                <div className="bg-purple-50 rounded-lg p-8">
                  <div className="text-4xl font-bold text-purple-600 mb-2">85%</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Benefit from early support</h3>
                  <p className="text-gray-600">Hope, progress, and growth</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Understanding Autism - Common Difficulties Section */}
        <motion.div
          className="bg-white py-16"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Understanding Autism Spectrum Disorder
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Learn about common characteristics and how to provide the best support for your child's unique needs.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Common Difficulties */}
              <div className="bg-blue-50 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                  <Brain className="h-8 w-8 text-blue-600" />
                  Five Common Difficulties Often Associated with Autism
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">Social Interactions</h4>
                    <p className="text-blue-700">Difficulty with nonverbal cues, conversations, and social norms.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">Sensory Sensitivities</h4>
                    <p className="text-blue-700">Heightened or diminished sensitivity to sensory input.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">Restriction/Repetition</h4>
                    <p className="text-blue-700">Repetitive movements, strict routines, intense interests.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">Communication Difficulties</h4>
                    <p className="text-blue-700">Delayed language, verbal challenges, abstract language understanding.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">Executive Functioning Issues</h4>
                    <p className="text-blue-700">Problems with planning, organizing, time management, adapting to change.</p>
                  </div>
                </div>
              </div>

              {/* Support Strategies */}
              <div className="bg-green-50 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-3">
                  <Heart className="h-8 w-8 text-green-600" />
                  Support Strategies & Tips
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-green-800 mb-2">Create Predictable Routines</h4>
                    <p className="text-green-700">Consistent daily schedules help reduce anxiety and provide security.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-800 mb-2">Use Visual Supports</h4>
                    <p className="text-green-700">Pictures, schedules, and visual cues improve communication and understanding.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-800 mb-2">Sensory Accommodations</h4>
                    <p className="text-green-700">Create sensory-friendly environments and identify triggers or preferences.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-800 mb-2">Break Tasks Down</h4>
                    <p className="text-green-700">Divide complex activities into smaller, manageable steps.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-800 mb-2">Celebrate Strengths</h4>
                    <p className="text-green-700">Focus on your child's unique abilities and interests to build confidence.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Connect to Community Section */}
        <motion.div
          className="bg-blue-600 text-white py-16"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Connect to Community
              </h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                There are many ways to get involved in the Autism community. Whether it's supporting a crucial initiative, attending an event, or making a difference, we're your connection to the community.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <motion.div
                className="text-center"
                variants={itemVariants}
              >
                <div className="bg-white/10 rounded-lg p-6 hover:bg-white/20 transition-colors">
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Take Assessment</h3>
                  <p className="text-blue-100 mb-4">Complete our M-CHAT-R screening tool</p>
                  <Link href="/dashboard/questionnaire">
                    <button className="text-blue-600 bg-white px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors">
                      Start Now
                    </button>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                className="text-center"
                variants={itemVariants}
              >
                <div className="bg-white/10 rounded-lg p-6 hover:bg-white/20 transition-colors">
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Find Support</h3>
                  <p className="text-blue-100 mb-4">Locate nearby autism centers</p>
                  <Link href="/dashboard/locator">
                    <button className="text-blue-600 bg-white px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors">
                      Find Centers
                    </button>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                className="text-center"
                variants={itemVariants}
              >
                <div className="bg-white/10 rounded-lg p-6 hover:bg-white/20 transition-colors">
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Get Answers</h3>
                  <p className="text-blue-100 mb-4">Ask our AI information hub</p>
                  <Link href="/dashboard/chat">
                    <button className="text-blue-600 bg-white px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors">
                      Ask Questions
                    </button>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                className="text-center"
                variants={itemVariants}
              >
                <div className="bg-white/10 rounded-lg p-6 hover:bg-white/20 transition-colors">
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Track Progress</h3>
                  <p className="text-blue-100 mb-4">Monitor your child's development</p>
                  <Link href="/dashboard/progress">
                    <button className="text-blue-600 bg-white px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors">
                      View Progress
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Practical Tips & Early Intervention Section */}
        <motion.div
          className="bg-gray-50 py-16"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Practical Tips for Daily Support
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Evidence-based strategies to help your child thrive in everyday situations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Communication Tips */}
              <motion.div
                className="bg-white rounded-lg shadow-lg p-6"
                variants={itemVariants}
              >
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Communication Support</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Use simple, clear language</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Give processing time after speaking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Use gestures and visual cues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Validate their communication attempts</span>
                  </li>
                </ul>
              </motion.div>

              {/* Sensory Management */}
              <motion.div
                className="bg-white rounded-lg shadow-lg p-6"
                variants={itemVariants}
              >
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sensory Management</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Create quiet spaces for breaks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Use noise-canceling headphones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Provide sensory tools (fidgets, weighted items)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Prepare for sensory-rich environments</span>
                  </li>
                </ul>
              </motion.div>

              {/* Behavioral Support */}
              <motion.div
                className="bg-white rounded-lg shadow-lg p-6"
                variants={itemVariants}
              >
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Behavioral Support</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Use positive reinforcement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Identify triggers and patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Teach coping strategies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">Stay calm during challenging moments</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Early Intervention Importance */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">The Power of Early Intervention</h3>
              <div className="grid md:grid-cols-3 gap-8 mb-6">
                <div>
                  <div className="text-3xl font-bold mb-2">85%</div>
                  <p className="text-blue-100">of children benefit significantly from early intervention services</p>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">18-24</div>
                  <p className="text-blue-100">months is the optimal age range for autism screening</p>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">2-5x</div>
                  <p className="text-blue-100">more effective when intervention starts before age 4</p>
                </div>
              </div>
              <p className="text-lg text-blue-100 max-w-3xl mx-auto">
                Early identification and intervention can significantly improve outcomes for children with autism.
                The earlier support begins, the better the long-term results for communication, social skills, and independence.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Support Section */}
        <motion.div
          className="bg-white py-16"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Connect to support from the Early Autism Detection Companion
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  We're here to support you on your journey. Access resources, connect with professionals, and find the help you need for your child's development.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/chat">
                  <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Get Support
                  </button>
                </Link>
                <Link href="/dashboard/locator">
                  <button className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors">
                    Find Local Resources
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <Logo size="sm" />
                <span className="ml-3 text-lg font-semibold">Early Autism Detection Companion</span>
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-400 mb-2">Thank you for using our platform</p>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  )
}
