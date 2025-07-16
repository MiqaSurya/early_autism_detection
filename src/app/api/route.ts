import { NextResponse } from 'next/server'

// Force dynamic rendering for all API routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Early Autism Detector API is running - Latest Version',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    deploymentCheck: 'Force deployment trigger - ' + new Date().toISOString()
  })
}
