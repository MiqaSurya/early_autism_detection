-- =============================================================================
-- QUICK FIX: DISABLE PROBLEMATIC TRIGGER
-- =============================================================================
-- This disables the trigger that's causing RLS violations during center registration

-- Step 1: Disable the trigger that's causing the RLS violation
DROP TRIGGER IF EXISTS trigger_sync_center_user_to_autism_centers ON center_users;

-- Step 2: Update RLS policies to be more permissive
DROP POLICY IF EXISTS "Authenticated users can insert autism centers" ON autism_centers;
DROP POLICY IF EXISTS "Anyone can view autism centers" ON autism_centers;

-- Create new permissive policies
CREATE POLICY "Public read access" ON autism_centers
    FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON autism_centers
    FOR ALL USING (auth.role() = 'service_role');

-- Step 3: Verify the fix
SELECT 'Trigger disabled. Center registration should now work via API route.' as status;
