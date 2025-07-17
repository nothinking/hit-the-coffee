-- Allow unauthenticated users (anon role) to insert into order_selections
-- This policy is crucial for the public order page to save selections.
CREATE POLICY "Allow anon insert to order_selections"
ON public.order_selections
FOR INSERT
TO anon
WITH CHECK (TRUE);
