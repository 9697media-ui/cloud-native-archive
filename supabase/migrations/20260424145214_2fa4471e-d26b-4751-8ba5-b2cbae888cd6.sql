-- Add unique index to access_requests to support the trigger's ON CONFLICT clause
CREATE UNIQUE INDEX IF NOT EXISTS access_requests_user_id_pending_key ON public.access_requests (user_id) WHERE status = 'pending';

-- Ensure foreign keys have ON DELETE CASCADE (already checked but good to have in migration script for completeness)
-- profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass 
        AND conname = 'profiles_user_id_fkey' 
        AND pg_get_constraintdef(oid) LIKE '%ON DELETE CASCADE%'
    ) THEN
        ALTER TABLE public.profiles 
        DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- user_roles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.user_roles'::regclass 
        AND conname = 'user_roles_user_id_fkey' 
        AND pg_get_constraintdef(oid) LIKE '%ON DELETE CASCADE%'
    ) THEN
        ALTER TABLE public.user_roles 
        DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
        ADD CONSTRAINT user_roles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- access_requests
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.access_requests'::regclass 
        AND conname = 'access_requests_user_id_fkey' 
        AND pg_get_constraintdef(oid) LIKE '%ON DELETE CASCADE%'
    ) THEN
        ALTER TABLE public.access_requests 
        DROP CONSTRAINT IF EXISTS access_requests_user_id_fkey,
        ADD CONSTRAINT access_requests_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;
