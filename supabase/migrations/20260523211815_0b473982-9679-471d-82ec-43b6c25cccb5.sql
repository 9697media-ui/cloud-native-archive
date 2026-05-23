-- Allow Managers to update profiles in their units
CREATE POLICY "Managers can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  check_is_manager(auth.uid()) AND (
    unit = (SELECT unit FROM public.profiles WHERE user_id = auth.uid()) OR 
    unit IN (SELECT unnest(delegated_units) FROM public.profiles WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  check_is_manager(auth.uid()) AND (
    unit = (SELECT unit FROM public.profiles WHERE user_id = auth.uid()) OR 
    unit IN (SELECT unnest(delegated_units) FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Ensure managers can also see all roles to avoid errors in the UI
-- (Already covered by user_roles_view_own_or_manager policy which calls check_is_manager)

-- Update access_requests policies to ensure managers can approve
CREATE POLICY "Managers can approve requests" 
ON public.access_requests 
FOR UPDATE 
USING (
  check_is_manager(auth.uid()) AND (
    requested_unit = (SELECT unit FROM public.profiles WHERE user_id = auth.uid()) OR 
    requested_unit IN (SELECT unnest(delegated_units) FROM public.profiles WHERE user_id = auth.uid()) OR
    check_is_admin(auth.uid())
  )
);
