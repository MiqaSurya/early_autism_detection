// Script to update the user profile trigger
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nugybnlgrrwzbpjpfmty.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3libmxncnJ3emJwanBmbXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTExOTUxNiwiZXhwIjoyMDYwNjk1NTE2fQ.Ud6tx1GR3KLG_yR-7jhXFC2R3kQkVUbY0jkY-9lav18';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateTrigger() {
  try {
    console.log('🔄 Updating user profile trigger...');
    
    const sql = `
      -- Update the handle_new_user function to use display_name from user metadata
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, display_name, email_verified)
        VALUES (
          NEW.id, 
          COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            split_part(NEW.email, '@', 1)
          ),
          CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Recreate the trigger
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error updating trigger:', error);
      return;
    }
    
    console.log('✅ User profile trigger updated successfully!');
    console.log('📝 The trigger now uses display_name from user metadata when available');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the update
updateTrigger();
