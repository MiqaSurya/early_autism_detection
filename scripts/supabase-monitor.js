#!/usr/bin/env node

/**
 * Supabase Database Monitor for Early Autism Detection App
 * 
 * This script monitors your Supabase database health, usage, and performance.
 * It can detect issues early and send alerts.
 * 
 * Usage:
 *   node scripts/supabase-monitor.js
 *   node scripts/supabase-monitor.js --check-health
 *   node scripts/supabase-monitor.js --usage-report
 *   node scripts/supabase-monitor.js --continuous
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MONITOR_DIR = path.join(__dirname, '..', 'monitoring')

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  checkHealth: args.includes('--check-health'),
  usageReport: args.includes('--usage-report'),
  continuous: args.includes('--continuous'),
  interval: parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 300000 // 5 minutes
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Utility functions
function log(level, message, data = null) {
  const timestamp = new Date().toISOString()
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  }
  
  console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

function ensureMonitorDir() {
  if (!fs.existsSync(MONITOR_DIR)) {
    fs.mkdirSync(MONITOR_DIR, { recursive: true })
    log('info', `Created monitoring directory: ${MONITOR_DIR}`)
  }
}

function saveReport(type, data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const fileName = `${type}-report-${timestamp}.json`
  const filePath = path.join(MONITOR_DIR, fileName)
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  log('info', `Report saved: ${filePath}`)
  return filePath
}

// Monitoring functions
async function checkDatabaseHealth() {
  log('info', 'Checking database health...')
  
  const health = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
    issues: [],
    recommendations: []
  }

  try {
    // Check basic connectivity
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    health.checks.connectivity = {
      status: connectionError ? 'failed' : 'passed',
      error: connectionError?.message
    }

    if (connectionError) {
      health.status = 'unhealthy'
      health.issues.push('Database connection failed')
    }

    // Check table existence
    const expectedTables = ['profiles', 'children', 'assessments', 'autism_centers', 'center_users', 'chat_history']
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (!tablesError && tables) {
      const existingTables = tables.map(t => t.table_name)
      const missingTables = expectedTables.filter(table => !existingTables.includes(table))
      
      health.checks.tables = {
        status: missingTables.length === 0 ? 'passed' : 'failed',
        expected: expectedTables.length,
        found: existingTables.length,
        missing: missingTables
      }

      if (missingTables.length > 0) {
        health.status = 'unhealthy'
        health.issues.push(`Missing tables: ${missingTables.join(', ')}`)
        health.recommendations.push('Run emergency recovery script to recreate missing tables')
      }
    }

    // Check RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname')
      .eq('schemaname', 'public')

    if (!policiesError && policies) {
      const tablesWithPolicies = [...new Set(policies.map(p => p.tablename))]
      const tablesWithoutPolicies = expectedTables.filter(table => !tablesWithPolicies.includes(table))
      
      health.checks.rls = {
        status: tablesWithoutPolicies.length === 0 ? 'passed' : 'warning',
        policies_count: policies.length,
        tables_without_policies: tablesWithoutPolicies
      }

      if (tablesWithoutPolicies.length > 0) {
        health.issues.push(`Tables without RLS policies: ${tablesWithoutPolicies.join(', ')}`)
        health.recommendations.push('Review and add RLS policies for security')
      }
    }

    // Check data integrity
    const { data: orphanedAssessments } = await supabase
      .from('assessments')
      .select('id')
      .not('child_id', 'in', `(SELECT id FROM children)`)

    health.checks.data_integrity = {
      status: orphanedAssessments?.length === 0 ? 'passed' : 'warning',
      orphaned_assessments: orphanedAssessments?.length || 0
    }

    if (orphanedAssessments?.length > 0) {
      health.issues.push(`Found ${orphanedAssessments.length} orphaned assessments`)
      health.recommendations.push('Clean up orphaned assessment records')
    }

    log('success', `Health check completed - Status: ${health.status}`)
    return health

  } catch (error) {
    health.status = 'error'
    health.error = error.message
    log('error', 'Health check failed:', error)
    return health
  }
}

async function generateUsageReport() {
  log('info', 'Generating usage report...')
  
  const report = {
    timestamp: new Date().toISOString(),
    tables: {},
    summary: {}
  }

  try {
    const tables = ['profiles', 'children', 'assessments', 'autism_centers', 'center_users', 'chat_history', 'saved_locations']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (!error) {
          report.tables[table] = {
            row_count: count,
            status: 'accessible'
          }

          // Get recent activity (last 7 days)
          if (['children', 'assessments', 'chat_history'].includes(table)) {
            const { count: recentCount } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true })
              .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

            report.tables[table].recent_activity = recentCount
          }
        } else {
          report.tables[table] = {
            status: 'error',
            error: error.message
          }
        }
      } catch (error) {
        report.tables[table] = {
          status: 'error',
          error: error.message
        }
      }
    }

    // Calculate summary
    const totalRows = Object.values(report.tables)
      .filter(t => t.row_count !== undefined)
      .reduce((sum, t) => sum + t.row_count, 0)

    const totalRecentActivity = Object.values(report.tables)
      .filter(t => t.recent_activity !== undefined)
      .reduce((sum, t) => sum + t.recent_activity, 0)

    report.summary = {
      total_rows: totalRows,
      total_tables: tables.length,
      accessible_tables: Object.values(report.tables).filter(t => t.status === 'accessible').length,
      recent_activity_7_days: totalRecentActivity,
      estimated_size_mb: Math.round(totalRows * 0.001) // Rough estimate
    }

    log('success', 'Usage report generated')
    log('info', `Total rows: ${totalRows}, Recent activity: ${totalRecentActivity}`)
    
    return report

  } catch (error) {
    report.error = error.message
    log('error', 'Usage report failed:', error)
    return report
  }
}

async function checkPerformance() {
  log('info', 'Checking database performance...')
  
  const performance = {
    timestamp: new Date().toISOString(),
    response_times: {},
    slow_queries: []
  }

  try {
    // Test response times for common queries
    const queries = [
      { name: 'profiles_select', query: () => supabase.from('profiles').select('id').limit(1) },
      { name: 'children_select', query: () => supabase.from('children').select('id').limit(10) },
      { name: 'centers_select', query: () => supabase.from('autism_centers').select('id, name').limit(10) }
    ]

    for (const { name, query } of queries) {
      const startTime = Date.now()
      try {
        await query()
        const responseTime = Date.now() - startTime
        performance.response_times[name] = responseTime
        
        if (responseTime > 1000) {
          performance.slow_queries.push({ name, response_time: responseTime })
        }
      } catch (error) {
        performance.response_times[name] = {
          error: error.message,
          response_time: Date.now() - startTime
        }
      }
    }

    const avgResponseTime = Object.values(performance.response_times)
      .filter(t => typeof t === 'number')
      .reduce((sum, t, _, arr) => sum + t / arr.length, 0)

    performance.summary = {
      average_response_time: Math.round(avgResponseTime),
      slow_queries_count: performance.slow_queries.length,
      status: avgResponseTime < 500 ? 'good' : avgResponseTime < 1000 ? 'fair' : 'poor'
    }

    log('success', `Performance check completed - Average response: ${Math.round(avgResponseTime)}ms`)
    return performance

  } catch (error) {
    performance.error = error.message
    log('error', 'Performance check failed:', error)
    return performance
  }
}

async function runFullMonitoring() {
  log('info', 'Running full monitoring suite...')
  
  const results = {
    timestamp: new Date().toISOString(),
    health: await checkDatabaseHealth(),
    usage: await generateUsageReport(),
    performance: await checkPerformance()
  }

  // Determine overall status
  const healthStatus = results.health.status
  const performanceStatus = results.performance.summary?.status || 'unknown'
  
  results.overall_status = healthStatus === 'healthy' && performanceStatus === 'good' ? 'excellent' :
                          healthStatus === 'healthy' && performanceStatus === 'fair' ? 'good' :
                          healthStatus === 'healthy' ? 'fair' : 'poor'

  // Generate recommendations
  results.recommendations = [
    ...results.health.recommendations || [],
    ...(results.performance.slow_queries?.length > 0 ? ['Consider optimizing slow queries'] : []),
    ...(results.usage.summary?.total_rows > 100000 ? ['Consider data archiving for large tables'] : [])
  ]

  log('success', `Full monitoring completed - Overall status: ${results.overall_status}`)
  
  return results
}

// Main execution
async function main() {
  try {
    // Validate environment
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase credentials. Check your .env.local file.')
    }

    log('info', 'Starting Supabase monitoring...')
    ensureMonitorDir()

    let results

    if (options.checkHealth) {
      results = await checkDatabaseHealth()
      saveReport('health', results)
    } else if (options.usageReport) {
      results = await generateUsageReport()
      saveReport('usage', results)
    } else {
      results = await runFullMonitoring()
      saveReport('full-monitoring', results)
    }

    // Display summary
    console.log('\n📊 MONITORING SUMMARY')
    console.log('='.repeat(50))
    
    if (results.overall_status) {
      console.log(`Overall Status: ${results.overall_status.toUpperCase()}`)
    }
    
    if (results.health) {
      console.log(`Health: ${results.health.status}`)
      if (results.health.issues.length > 0) {
        console.log(`Issues: ${results.health.issues.length}`)
      }
    }
    
    if (results.usage?.summary) {
      console.log(`Total Rows: ${results.usage.summary.total_rows}`)
      console.log(`Recent Activity: ${results.usage.summary.recent_activity_7_days}`)
    }
    
    if (results.performance?.summary) {
      console.log(`Avg Response: ${results.performance.summary.average_response_time}ms`)
    }

    if (results.recommendations?.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:')
      results.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`)
      })
    }

    // Continuous monitoring
    if (options.continuous) {
      log('info', `Starting continuous monitoring (interval: ${options.interval}ms)`)
      setInterval(async () => {
        try {
          const continuousResults = await runFullMonitoring()
          saveReport('continuous', continuousResults)
          
          // Alert on issues
          if (continuousResults.overall_status === 'poor') {
            log('warning', '🚨 Database health degraded!')
          }
        } catch (error) {
          log('error', 'Continuous monitoring error:', error)
        }
      }, options.interval)
    }

  } catch (error) {
    log('error', '❌ Monitoring failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = {
  checkDatabaseHealth,
  generateUsageReport,
  checkPerformance,
  runFullMonitoring
}
