-- Allow unauthenticated users (anon role) to create new order sessions
-- In production you’d tie this to auth.uid() or the shop owner’s user_id.
CREATE POLICY "Allow anon insert to orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (TRUE);
