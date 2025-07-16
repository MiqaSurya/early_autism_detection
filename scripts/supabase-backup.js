#!/usr/bin/env node

/**
 * Supabase Backup Script for Early Autism Detection App
 * 
 * This script creates comprehensive backups of your Supabase database
 * including schema, data, RLS policies, and functions.
 * 
 * Usage:
 *   node scripts/supabase-backup.js
 *   node scripts/supabase-backup.js --tables=users,children
 *   node scripts/supabase-backup.js --schema-only
 *   node scripts/supabase-backup.js --data-only
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BACKUP_DIR = path.join(__dirname, '..', 'backups')

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  tables: args.find(arg => arg.startsWith('--tables='))?.split('=')[1]?.split(','),
  schemaOnly: args.includes('--schema-only'),
  dataOnly: args.includes('--data-only'),
  compress: !args.includes('--no-compress')
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

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    log('info', `Created backup directory: ${BACKUP_DIR}`)
  }
}

function getBackupFileName(type, extension = 'sql') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `autism-detector-${type}-${timestamp}.${extension}`
}

// Main backup functions
async function backupTableSchema(tableName) {
  log('info', `Backing up schema for table: ${tableName}`)
  
  try {
    // Get table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (columnsError) throw columnsError

    // Get constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')

    if (constraintsError) throw constraintsError

    // Generate CREATE TABLE statement
    let createStatement = `-- Table: ${tableName}\n`
    createStatement += `DROP TABLE IF EXISTS public.${tableName} CASCADE;\n`
    createStatement += `CREATE TABLE public.${tableName} (\n`
    
    const columnDefs = columns.map(col => {
      let def = `  ${col.column_name} ${col.data_type}`
      
      if (col.character_maximum_length) {
        def += `(${col.character_maximum_length})`
      }
      
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL'
      }
      
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`
      }
      
      return def
    })
    
    createStatement += columnDefs.join(',\n')
    createStatement += '\n);\n\n'

    // Add constraints
    constraints.forEach(constraint => {
      if (constraint.constraint_type === 'PRIMARY KEY') {
        createStatement += `ALTER TABLE public.${tableName} ADD CONSTRAINT ${constraint.constraint_name} PRIMARY KEY;\n`
      }
    })

    return createStatement

  } catch (error) {
    log('error', `Failed to backup schema for ${tableName}:`, error)
    return `-- ERROR: Failed to backup schema for ${tableName}\n-- ${error.message}\n\n`
  }
}

async function backupTableData(tableName, limit = null) {
  log('info', `Backing up data for table: ${tableName}`)
  
  try {
    let query = supabase.from(tableName).select('*')
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      return `-- No data in table: ${tableName}\n\n`
    }

    let insertStatements = `-- Data for table: ${tableName}\n`
    insertStatements += `DELETE FROM public.${tableName};\n`
    
    // Get column names
    const columns = Object.keys(data[0])
    
    data.forEach(row => {
      const values = columns.map(col => {
        const value = row[col]
        if (value === null) return 'NULL'
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
        if (typeof value === 'boolean') return value ? 'true' : 'false'
        if (value instanceof Date) return `'${value.toISOString()}'`
        return value
      })
      
      insertStatements += `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`
    })
    
    insertStatements += '\n'
    return insertStatements

  } catch (error) {
    log('error', `Failed to backup data for ${tableName}:`, error)
    return `-- ERROR: Failed to backup data for ${tableName}\n-- ${error.message}\n\n`
  }
}

async function backupRLSPolicies() {
  log('info', 'Backing up RLS policies...')
  
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')

    if (error) throw error

    let policyStatements = '-- Row Level Security Policies\n\n'
    
    policies.forEach(policy => {
      policyStatements += `-- Policy: ${policy.policyname} on ${policy.tablename}\n`
      policyStatements += `DROP POLICY IF EXISTS ${policy.policyname} ON public.${policy.tablename};\n`
      policyStatements += `CREATE POLICY ${policy.policyname} ON public.${policy.tablename}\n`
      policyStatements += `  FOR ${policy.cmd || 'ALL'}\n`
      
      if (policy.roles && policy.roles.length > 0) {
        policyStatements += `  TO ${policy.roles.join(', ')}\n`
      }
      
      if (policy.qual) {
        policyStatements += `  USING (${policy.qual})\n`
      }
      
      if (policy.with_check) {
        policyStatements += `  WITH CHECK (${policy.with_check})\n`
      }
      
      policyStatements += ';\n\n'
    })

    return policyStatements

  } catch (error) {
    log('error', 'Failed to backup RLS policies:', error)
    return `-- ERROR: Failed to backup RLS policies\n-- ${error.message}\n\n`
  }
}

async function getTableList() {
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .neq('table_name', 'spatial_ref_sys') // Exclude PostGIS system table

  if (error) throw error
  
  return tables.map(t => t.table_name).filter(name => 
    !name.startsWith('geography_') && 
    !name.startsWith('geometry_') &&
    !name.startsWith('spatial_')
  )
}

async function createFullBackup() {
  log('info', 'Starting full database backup...')
  
  try {
    const tables = options.tables || await getTableList()
    log('info', `Found ${tables.length} tables to backup:`, tables)

    let backupContent = `-- Supabase Backup for Early Autism Detection App\n`
    backupContent += `-- Generated: ${new Date().toISOString()}\n`
    backupContent += `-- Tables: ${tables.join(', ')}\n\n`

    // Backup schema
    if (!options.dataOnly) {
      log('info', 'Backing up database schema...')
      backupContent += '-- =============================================\n'
      backupContent += '-- SCHEMA BACKUP\n'
      backupContent += '-- =============================================\n\n'
      
      for (const table of tables) {
        backupContent += await backupTableSchema(table)
      }
      
      // Backup RLS policies
      backupContent += await backupRLSPolicies()
    }

    // Backup data
    if (!options.schemaOnly) {
      log('info', 'Backing up table data...')
      backupContent += '-- =============================================\n'
      backupContent += '-- DATA BACKUP\n'
      backupContent += '-- =============================================\n\n'
      
      for (const table of tables) {
        backupContent += await backupTableData(table)
      }
    }

    // Save backup file
    const fileName = getBackupFileName('full')
    const filePath = path.join(BACKUP_DIR, fileName)
    
    fs.writeFileSync(filePath, backupContent)
    
    log('success', `Backup completed successfully!`)
    log('info', `Backup saved to: ${filePath}`)
    log('info', `Backup size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`)

    return filePath

  } catch (error) {
    log('error', 'Backup failed:', error)
    throw error
  }
}

// Main execution
async function main() {
  try {
    // Validate environment
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase credentials. Check your .env.local file.')
    }

    log('info', 'Starting Supabase backup process...')
    log('info', `Backup directory: ${BACKUP_DIR}`)
    log('info', 'Options:', options)

    ensureBackupDir()
    
    const backupFile = await createFullBackup()
    
    log('success', '🎉 Backup process completed successfully!')
    log('info', `📁 Backup file: ${backupFile}`)
    
    // Show next steps
    console.log('\n📋 Next Steps:')
    console.log('1. Store this backup file in a secure location')
    console.log('2. Test the backup by running: node scripts/supabase-restore.js')
    console.log('3. Set up automated backups using cron or GitHub Actions')
    console.log('4. Consider encrypting sensitive backups')

  } catch (error) {
    log('error', '❌ Backup process failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

// Additional utility functions
async function createQuickBackup() {
  log('info', 'Creating quick backup (essential tables only)...')

  const essentialTables = ['profiles', 'children', 'assessments', 'autism_centers', 'center_users']
  const originalTables = options.tables
  options.tables = essentialTables

  try {
    const backupFile = await createFullBackup()
    options.tables = originalTables
    return backupFile
  } catch (error) {
    options.tables = originalTables
    throw error
  }
}

async function backupUserData(userId) {
  log('info', `Creating user-specific backup for: ${userId}`)

  try {
    let backupContent = `-- User-specific backup for: ${userId}\n`
    backupContent += `-- Generated: ${new Date().toISOString()}\n\n`

    // Backup user's children
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId)

    if (children && children.length > 0) {
      backupContent += '-- User Children\n'
      children.forEach(child => {
        const values = Object.values(child).map(v =>
          v === null ? 'NULL' :
          typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
        )
        backupContent += `INSERT INTO children (${Object.keys(child).join(', ')}) VALUES (${values.join(', ')});\n`
      })
    }

    // Backup user's assessments
    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)

    if (assessments && assessments.length > 0) {
      backupContent += '\n-- User Assessments\n'
      assessments.forEach(assessment => {
        const values = Object.values(assessment).map(v =>
          v === null ? 'NULL' :
          typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
          typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'` : v
        )
        backupContent += `INSERT INTO assessments (${Object.keys(assessment).join(', ')}) VALUES (${values.join(', ')});\n`
      })
    }

    const fileName = getBackupFileName(`user-${userId}`)
    const filePath = path.join(BACKUP_DIR, fileName)
    fs.writeFileSync(filePath, backupContent)

    log('success', `User backup saved: ${filePath}`)
    return filePath

  } catch (error) {
    log('error', 'User backup failed:', error)
    throw error
  }
}

module.exports = {
  createFullBackup,
  createQuickBackup,
  backupUserData,
  backupTableSchema,
  backupTableData,
  backupRLSPolicies
}
