-- Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pre-registered'));

-- Migrate existing is_active data
UPDATE public.profiles SET status = 'active' WHERE is_active = true;
UPDATE public.profiles SET status = 'inactive' WHERE is_active = false;

-- Create function to handle status update on first login
CREATE OR REPLACE FUNCTION public.handle_user_first_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if last_sign_in_at is being set for the first time
  IF (OLD.last_sign_in_at IS NULL AND NEW.last_sign_in_at IS NOT NULL) THEN
    UPDATE public.profiles
    SET status = 'active'
    WHERE user_id = NEW.id AND status = 'pre-registered';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
-- Note: Requires permissions to create triggers on auth schema if not already allowed
-- Usually done via a separate migration or manually if needed, but in Lovable/Supabase env it should work if directed to auth schema.
-- Actually, it's better to use a profile update or check if possible, but auth.users is the source of truth for login.
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_first_login();
