-- Permit unauthenticated (anon role) users to add menu items.
-- In a production app you'd tie this to auth.uid().

CREATE POLICY "Allow anon insert access to menu_items"
ON public.menu_items
FOR INSERT
TO anon
WITH CHECK (TRUE);
