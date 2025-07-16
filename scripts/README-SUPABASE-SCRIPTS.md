# 🛡️ Supabase Backup & Recovery Scripts

Complete backup and recovery solution for your Early Autism Detection App Supabase database.

## 📁 Files Overview

| File | Purpose | Usage |
|------|---------|-------|
| `supabase-backup.js` | Create comprehensive backups | `node scripts/supabase-backup.js` |
| `supabase-restore.js` | Restore from backup files | `node scripts/supabase-restore.js backup.sql` |
| `supabase-monitor.js` | Monitor database health | `node scripts/supabase-monitor.js` |
| `supabase-emergency-recovery.sql` | Emergency table recreation | Copy/paste into Supabase SQL Editor |

## 🚀 Quick Start

### 1. Create Your First Backup
```bash
# Full backup (recommended)
node scripts/supabase-backup.js

# Quick backup (essential tables only)
node scripts/supabase-backup.js --tables=profiles,children,assessments

# Schema only (no data)
node scripts/supabase-backup.js --schema-only
```

### 2. Monitor Database Health
```bash
# Full health check
node scripts/supabase-monitor.js

# Just health status
node scripts/supabase-monitor.js --check-health

# Usage statistics
node scripts/supabase-monitor.js --usage-report
```

### 3. Emergency Recovery
If something goes wrong:
```bash
# Restore from latest backup
node scripts/supabase-restore.js --latest

# Restore specific backup
node scripts/supabase-restore.js backup-file.sql

# Dry run (test without changes)
node scripts/supabase-restore.js --dry-run backup-file.sql
```

## 📋 Detailed Usage

### Backup Script (`supabase-backup.js`)

**Basic Usage:**
```bash
node scripts/supabase-backup.js
```

**Advanced Options:**
```bash
# Backup specific tables
node scripts/supabase-backup.js --tables=users,children,assessments

# Schema only (structure, no data)
node scripts/supabase-backup.js --schema-only

# Data only (no structure)
node scripts/supabase-backup.js --data-only

# Skip compression
node scripts/supabase-backup.js --no-compress
```

**What it backs up:**
- ✅ Table schemas (CREATE TABLE statements)
- ✅ All table data (INSERT statements)
- ✅ RLS policies
- ✅ Indexes and constraints
- ✅ Functions and triggers

### Restore Script (`supabase-restore.js`)

**Basic Usage:**
```bash
# Restore from specific file
node scripts/supabase-restore.js backups/autism-detector-full-2024-01-15.sql

# Restore latest backup
node scripts/supabase-restore.js --latest
```

**Safety Options:**
```bash
# Test restore without making changes
node scripts/supabase-restore.js --dry-run backup.sql

# Skip confirmation prompt
node scripts/supabase-restore.js --yes backup.sql

# Force restore (skip safety backup)
node scripts/supabase-restore.js --force backup.sql
```

**Safety Features:**
- 🛡️ Creates safety backup before restore
- ⚠️ Confirmation prompt before destructive operations
- 🔍 Dry-run mode to test restore
- 📊 Detailed progress reporting

### Monitor Script (`supabase-monitor.js`)

**Basic Usage:**
```bash
# Full monitoring report
node scripts/supabase-monitor.js

# Health check only
node scripts/supabase-monitor.js --check-health

# Usage statistics
node scripts/supabase-monitor.js --usage-report
```

**Continuous Monitoring:**
```bash
# Monitor every 5 minutes
node scripts/supabase-monitor.js --continuous

# Custom interval (10 minutes)
node scripts/supabase-monitor.js --continuous --interval=600000
```

**What it monitors:**
- 🔗 Database connectivity
- 📊 Table existence and row counts
- 🔒 RLS policy coverage
- ⚡ Query performance
- 🧹 Data integrity issues

## 🆘 Emergency Procedures

### Scenario 1: Complete Database Loss
1. **Use Emergency Recovery SQL:**
   ```sql
   -- Copy contents of supabase-emergency-recovery.sql
   -- Paste into Supabase SQL Editor
   -- Run section by section
   ```

2. **Restore from backup:**
   ```bash
   node scripts/supabase-restore.js --latest
   ```

### Scenario 2: Corrupted Data
1. **Create immediate backup:**
   ```bash
   node scripts/supabase-backup.js
   ```

2. **Restore from known good backup:**
   ```bash
   node scripts/supabase-restore.js backup-file.sql
   ```

### Scenario 3: Missing Tables
1. **Check what's missing:**
   ```bash
   node scripts/supabase-monitor.js --check-health
   ```

2. **Run emergency recovery:**
   ```sql
   -- Use relevant sections from supabase-emergency-recovery.sql
   ```

### Scenario 4: Performance Issues
1. **Check performance:**
   ```bash
   node scripts/supabase-monitor.js
   ```

2. **Look for slow queries and high usage**

3. **Consider data cleanup or optimization**

## 📅 Recommended Schedule

### Daily
```bash
# Quick health check
node scripts/supabase-monitor.js --check-health
```

### Weekly
```bash
# Full backup
node scripts/supabase-backup.js

# Full monitoring report
node scripts/supabase-monitor.js
```

### Monthly
```bash
# Test restore process
node scripts/supabase-restore.js --dry-run --latest

# Clean up old backups (keep last 10)
ls -t backups/*.sql | tail -n +11 | xargs rm
```

## 🔧 Configuration

### Environment Variables
Make sure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### File Locations
- **Backups:** `./backups/`
- **Monitoring Reports:** `./monitoring/`
- **Scripts:** `./scripts/`

## ⚠️ Important Notes

### Security
- 🔐 **Never commit backup files** to version control
- 🔑 **Protect service role keys** - they have full database access
- 🗂️ **Store backups securely** - they contain sensitive user data

### Performance
- ⏱️ **Large databases** may take time to backup/restore
- 💾 **Monitor disk space** - backups can be large
- 🌐 **Network timeouts** may occur with very large datasets

### Testing
- 🧪 **Always test restores** on a development database first
- 🔍 **Use dry-run mode** to verify backup integrity
- 📊 **Monitor after restore** to ensure everything works

## 🆘 Support

If you encounter issues:

1. **Check the logs** - scripts provide detailed output
2. **Run health check** - `node scripts/supabase-monitor.js --check-health`
3. **Verify environment** - ensure Supabase credentials are correct
4. **Test connectivity** - try accessing Supabase dashboard
5. **Use emergency recovery** - if all else fails, use the SQL script

## 📞 Emergency Contacts

- **Supabase Status:** https://status.supabase.com/
- **Supabase Docs:** https://supabase.com/docs
- **Support:** https://supabase.com/support

---

## 🎯 Quick Reference

```bash
# Create backup
node scripts/supabase-backup.js

# Check health
node scripts/supabase-monitor.js --check-health

# Restore latest
node scripts/supabase-restore.js --latest

# Emergency recovery
# Copy supabase-emergency-recovery.sql to Supabase SQL Editor
```

**Remember:** Regular backups are your best protection against data loss! 🛡️
