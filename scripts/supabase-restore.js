#!/usr/bin/env node

/**
 * Supabase Restore Script for Early Autism Detection App
 * 
 * This script restores your Supabase database from backup files
 * created by the supabase-backup.js script.
 * 
 * Usage:
 *   node scripts/supabase-restore.js backup-file.sql
 *   node scripts/supabase-restore.js --latest
 *   node scripts/supabase-restore.js --dry-run backup-file.sql
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
  backupFile: args.find(arg => !arg.startsWith('--')),
  latest: args.includes('--latest'),
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
  skipConfirmation: args.includes('--yes')
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

function findLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    throw new Error(`Backup directory not found: ${BACKUP_DIR}`)
  }

  const backupFiles = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('autism-detector-') && file.endsWith('.sql'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime)

  if (backupFiles.length === 0) {
    throw new Error('No backup files found')
  }

  return backupFiles[0]
}

function parseBackupFile(filePath) {
  log('info', `Parsing backup file: ${filePath}`)
  
  const content = fs.readFileSync(filePath, 'utf8')
  const statements = content
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .filter(stmt => stmt.trim())
    .map(stmt => stmt.trim() + ';')

  log('info', `Found ${statements.length} SQL statements`)
  return statements
}

async function executeStatement(statement) {
  try {
    // Use raw SQL execution for complex statements
    const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
    
    if (error) {
      // Try alternative method for simpler statements
      if (statement.toLowerCase().includes('insert into')) {
        // Handle INSERT statements differently
        return await executeInsertStatement(statement)
      }
      throw error
    }
    
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function executeInsertStatement(statement) {
  // Parse INSERT statement to extract table and data
  const match = statement.match(/INSERT INTO (\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i)
  
  if (!match) {
    throw new Error('Could not parse INSERT statement')
  }

  const [, tableName, columns, values] = match
  const columnList = columns.split(',').map(c => c.trim())
  const valueList = values.split(',').map(v => v.trim())

  // Convert values back to proper types
  const data = {}
  columnList.forEach((col, index) => {
    let value = valueList[index]
    
    if (value === 'NULL') {
      data[col] = null
    } else if (value === 'true') {
      data[col] = true
    } else if (value === 'false') {
      data[col] = false
    } else if (value.startsWith("'") && value.endsWith("'")) {
      data[col] = value.slice(1, -1).replace(/''/g, "'")
    } else if (!isNaN(value)) {
      data[col] = parseFloat(value)
    } else {
      data[col] = value
    }
  })

  const { error } = await supabase.from(tableName).insert(data)
  
  if (error) throw error
  return { success: true }
}

async function createBackupBeforeRestore() {
  log('info', 'Creating safety backup before restore...')
  
  try {
    const { createFullBackup } = require('./supabase-backup.js')
    const backupFile = await createFullBackup()
    log('success', `Safety backup created: ${backupFile}`)
    return backupFile
  } catch (error) {
    log('warning', 'Could not create safety backup:', error.message)
    return null
  }
}

async function confirmRestore(backupFile) {
  if (options.skipConfirmation) return true

  console.log('\n⚠️  WARNING: This will OVERWRITE your current database!')
  console.log(`📁 Backup file: ${backupFile}`)
  console.log(`🗄️  Database: ${SUPABASE_URL}`)
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    readline.question('\nDo you want to continue? (yes/no): ', (answer) => {
      readline.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

async function restoreDatabase(backupFile) {
  log('info', 'Starting database restore...')
  
  try {
    // Parse backup file
    const statements = parseBackupFile(backupFile)
    
    if (options.dryRun) {
      log('info', 'DRY RUN - No changes will be made')
      log('info', `Would execute ${statements.length} statements`)
      statements.slice(0, 5).forEach((stmt, index) => {
        log('info', `Statement ${index + 1}: ${stmt.substring(0, 100)}...`)
      })
      return
    }

    // Create safety backup
    if (!options.force) {
      await createBackupBeforeRestore()
    }

    // Execute statements
    let successCount = 0
    let errorCount = 0
    const errors = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      log('info', `Executing statement ${i + 1}/${statements.length}`)
      
      const result = await executeStatement(statement)
      
      if (result.success) {
        successCount++
      } else {
        errorCount++
        errors.push({
          statement: statement.substring(0, 100),
          error: result.error
        })
        log('warning', `Statement failed: ${result.error}`)
      }
    }

    // Report results
    log('success', `Restore completed!`)
    log('info', `✅ Successful: ${successCount}`)
    log('info', `❌ Failed: ${errorCount}`)

    if (errors.length > 0) {
      log('warning', 'Errors encountered:')
      errors.forEach((err, index) => {
        log('warning', `${index + 1}. ${err.statement}... - ${err.error}`)
      })
    }

  } catch (error) {
    log('error', 'Restore failed:', error)
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

    log('info', 'Starting Supabase restore process...')

    // Determine backup file
    let backupFile
    if (options.latest) {
      const latest = findLatestBackup()
      backupFile = latest.path
      log('info', `Using latest backup: ${latest.name}`)
    } else if (options.backupFile) {
      backupFile = path.isAbsolute(options.backupFile) 
        ? options.backupFile 
        : path.join(BACKUP_DIR, options.backupFile)
      
      if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`)
      }
    } else {
      throw new Error('Please specify a backup file or use --latest')
    }

    log('info', `Backup file: ${backupFile}`)
    log('info', `File size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`)

    // Confirm restore
    const confirmed = await confirmRestore(backupFile)
    if (!confirmed) {
      log('info', 'Restore cancelled by user')
      return
    }

    // Perform restore
    await restoreDatabase(backupFile)
    
    log('success', '🎉 Database restore completed!')
    
    // Show next steps
    console.log('\n📋 Next Steps:')
    console.log('1. Test your application to ensure everything works')
    console.log('2. Check for any missing data or functionality')
    console.log('3. Update any changed configurations if needed')

  } catch (error) {
    log('error', '❌ Restore process failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = {
  restoreDatabase,
  parseBackupFile,
  executeStatement
}
