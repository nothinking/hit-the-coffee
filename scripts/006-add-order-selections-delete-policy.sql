-- Allow unauthenticated users (anon role) to delete from order_selections
-- In a production app, this would be restricted to the order creator or shop owner.
CREATE POLICY "Allow anon delete to order_selections"
ON public.order_selections
FOR DELETE
TO anon
USING (TRUE);
