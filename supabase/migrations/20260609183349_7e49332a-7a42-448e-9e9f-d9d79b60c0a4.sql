CREATE OR REPLACE FUNCTION public.handle_oauth_tokens() 
RETURNS TRIGGER AS $$
BEGIN
  -- If the login is via Google and has a refresh token in raw_app_meta_data
  IF NEW.raw_app_meta_data->>'provider' = 'google' AND NEW.raw_app_meta_data->>'refresh_token' IS NOT NULL THEN
    UPDATE public.profiles 
    SET google_refresh_token = NEW.raw_app_meta_data->>'refresh_token'
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users for updates (when tokens are issued)
DROP TRIGGER IF EXISTS on_auth_user_tokens ON auth.users;
CREATE TRIGGER on_auth_user_tokens
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_oauth_tokens();
