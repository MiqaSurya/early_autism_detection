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
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-100">
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
          className="bg-gradient-to-r from-blue-600 to-purple-700 text-white"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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

        {/* Support Section */}
        <motion.div
          className="bg-gray-50 py-16"
          variants={itemVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
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
