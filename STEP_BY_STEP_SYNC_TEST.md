# Step-by-Step Sync Testing Guide

## 🎯 **Goal**: Find out why force sync doesn't work after center changes details

## 📋 **Step 1: Check Current State**

1. **Run the debug script in Supabase SQL Editor:**
   ```sql
   -- Copy and paste the entire DEBUG_CENTER_SYNC.sql content
   ```

2. **Look for these key things:**
   - How many centers are unsynced?
   - Are there any missing required fields?
   - Are coordinates valid (not 0,0)?
   - When was the last update?

## 📋 **Step 2: Test Center Update Process**

1. **Go to Center Portal Dashboard**
2. **Click "Edit Details"**
3. **Make a small change** (e.g., add "TEST" to the end of center name)
4. **Click "Update Center Details"**
5. **Check browser console** for any errors
6. **Check browser Network tab** to see if API calls were made

## 📋 **Step 3: Test Force Sync**

1. **Go back to Center Portal Dashboard**
2. **Click "Force Sync" button**
3. **Open browser console (F12)**
4. **Watch for detailed logs** that should appear like:
   ```
   🔄 Force Sync API - User verified: [Center Name]
   📊 Force Sync API - User data: {...}
   🔍 Force Sync API - Checking for existing autism_centers record...
   ✅ Force Sync API - Found existing autism_centers record: [id]
   📊 Force Sync API - Center data to sync: {...}
   🔄 Force Sync - Updating existing autism_centers record
   📊 Force Sync - Data differences:
     name: "Old Name" → "New Name TEST"
   ✅ Force Sync - Successfully updated autism_centers record
   ```

## 📋 **Step 4: Check Server Logs**

1. **Look at your terminal/console** where the app is running
2. **You should see the same detailed logs** from the API
3. **If you see errors**, note the exact error message

## 📋 **Step 5: Verify User Locator**

1. **Go to User Dashboard → Locator**
2. **Click "Load Centers" button**
3. **Search for your center** in the list
4. **Check if the changes appear** (e.g., "TEST" in the name)

## 🔍 **Common Issues and What to Look For:**

### **Issue 1: API Not Called**
- **Symptoms**: No logs in console, no network requests
- **Check**: Browser network tab, JavaScript errors
- **Solution**: Fix frontend JavaScript issues

### **Issue 2: Authentication Failed**
- **Symptoms**: "No session found" or "Invalid session" errors
- **Check**: Cookies in browser, session token
- **Solution**: Re-login to center portal

### **Issue 3: Missing Data**
- **Symptoms**: "Missing required center information" error
- **Check**: Debug script shows missing fields
- **Solution**: Fill in all required fields in center profile

### **Issue 4: Database Permissions**
- **Symptoms**: "Failed to update autism_centers record" error
- **Check**: Supabase RLS policies, table permissions
- **Solution**: Fix database permissions

### **Issue 5: Data Type Issues**
- **Symptoms**: Database constraint errors
- **Check**: Invalid coordinates, wrong data types
- **Solution**: Fix data validation

## 🚨 **What to Report Back:**

Please run through these steps and tell me:

1. **What does the debug script show?** (especially sync status)
2. **What logs appear in browser console** when you click force sync?
3. **What logs appear in server terminal** when you click force sync?
4. **Any error messages** you see?
5. **Does the change appear in user locator** after force sync?

## 🔧 **Quick Fixes to Try:**

### **Fix 1: Clear Browser Cache**
```javascript
// In browser console, run:
localStorage.clear()
sessionStorage.clear()
// Then refresh page and try again
```

### **Fix 2: Check Session Token**
```javascript
// In browser console, run:
document.cookie
// Should show center_session_token
```

### **Fix 3: Manual Database Check**
```sql
-- In Supabase SQL Editor:
SELECT 
    cu.center_name as center_user_name,
    ac.name as autism_center_name,
    cu.updated_at as cu_updated,
    ac.updated_at as ac_updated
FROM center_users cu
LEFT JOIN autism_centers ac ON cu.id = ac.center_user_id
WHERE cu.email = 'YOUR_CENTER_EMAIL_HERE'
ORDER BY cu.updated_at DESC;
```

This will help us identify exactly where the sync is failing! 🚀
