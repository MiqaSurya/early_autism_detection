'use client'

import { useState } from 'react'
import { Database, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react'
import { manualInitializeQuestionnaire } from '@/lib/init-questionnaire-db'

export default function AdminSetupPage() {
  const [initStatus, setInitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleInitialize = async () => {
    setInitStatus('loading')
    try {
      const result = await manualInitializeQuestionnaire()
      if (result.success) {
        setInitStatus('success')
        setMessage(result.message || 'Database initialized successfully!')
      } else {
        setInitStatus('error')
        setMessage(result.error || 'Failed to initialize database')
      }
    } catch (error) {
      setInitStatus('error')
      setMessage('An unexpected error occurred')
      console.error('Setup error:', error)
    }
  }

  const sqlScript = `-- Create questionnaire_questions table for admin-managed M-CHAT-R questions
CREATE TABLE IF NOT EXISTS questionnaire_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('social_communication', 'behavior_sensory')),
  risk_answer TEXT NOT NULL CHECK (risk_answer IN ('yes', 'no')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_active ON questionnaire_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_number ON questionnaire_questions(question_number);

-- Enable RLS (Row Level Security)
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users (admin access)
CREATE POLICY "Allow all operations for authenticated users" ON questionnaire_questions
  FOR ALL USING (auth.role() = 'authenticated');`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('SQL script copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Setup</h1>
        <p className="text-gray-600 mt-2">
          Set up the questionnaire database for admin-managed M-CHAT-R questions
        </p>
      </div>

      {/* Setup Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Database Setup</h2>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            The questionnaire management system requires a database table to store admin-managed questions.
            Follow these steps to set it up:
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Step 1: Create Database Table</h3>
            <p className="text-blue-800 text-sm mb-3">
              Go to your Supabase dashboard → SQL Editor and run the following script:
            </p>
            
            <div className="bg-white border border-blue-200 rounded p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-500">SQL Script</span>
                <button
                  onClick={() => copyToClipboard(sqlScript)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                {sqlScript}
              </pre>
            </div>

            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open Supabase Dashboard</span>
            </a>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Step 2: Initialize Default Questions</h3>
            <p className="text-green-800 text-sm mb-3">
              After creating the table, click the button below to populate it with default M-CHAT-R questions:
            </p>
            
            <button
              onClick={handleInitialize}
              disabled={initStatus === 'loading'}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {initStatus === 'loading' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Initializing...</span>
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  <span>Initialize Default Questions</span>
                </>
              )}
            </button>
          </div>

          {/* Status Messages */}
          {initStatus === 'success' && (
            <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">{message}</span>
            </div>
          )}

          {initStatus === 'error' && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What You'll Get</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Admin Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Add new assessment questions</li>
              <li>• Edit existing questions</li>
              <li>• Configure risk scoring (Yes/No)</li>
              <li>• Delete unwanted questions</li>
              <li>• Reorder questions</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">User Experience</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time question updates</li>
              <li>• Dynamic risk calculation</li>
              <li>• Consistent scoring algorithm</li>
              <li>• Automatic sync across devices</li>
              <li>• Professional M-CHAT-R format</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      {initStatus === 'success' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
          <div className="space-y-3">
            <p className="text-gray-600">
              Your questionnaire database is now set up! You can:
            </p>
            <div className="space-y-2">
              <a
                href="/admin/assessments"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Manage Questionnaire</span>
              </a>
              <a
                href="/dashboard/questionnaire"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-3"
              >
                <span>Test User Questionnaire</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
