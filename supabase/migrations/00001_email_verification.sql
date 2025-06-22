-- Create or replace the function to handle email verification
CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's profile when their email is verified
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles
    SET 
      email_verified = TRUE,
      updated_at = NOW()
    WHERE id = NEW.id;
    
    -- Insert a notification for the user
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type
    ) VALUES (
      NEW.id,
      'Email Verified',
      'Your email has been successfully verified. You can now use all features of the application.',
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION handle_email_verification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_email_verification() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_email_verification() TO service_role;

-- Add a comment to the function
COMMENT ON FUNCTION handle_email_verification IS 'Handles user email verification by updating profile and sending notification';
