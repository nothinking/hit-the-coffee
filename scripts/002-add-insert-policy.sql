-- Add an INSERT policy for the coffee_shops table
CREATE POLICY "Allow anon insert access to coffee_shops"
ON public.coffee_shops
FOR INSERT
TO anon
WITH CHECK (TRUE); -- TRUE means any anon user can insert, refine this later with auth
