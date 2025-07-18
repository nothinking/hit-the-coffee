-- Add temporary shop support
-- This allows creating order links without registering a permanent shop

-- Add is_temporary column to coffee_shops table
ALTER TABLE public.coffee_shops 
ADD COLUMN is_temporary BOOLEAN DEFAULT FALSE;

-- Add title column to orders table if not exists
ALTER TABLE public.orders 
ADD COLUMN title TEXT;

-- Add expires_at column to orders table if not exists
ALTER TABLE public.orders 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for temporary shops
CREATE INDEX idx_coffee_shops_temporary ON public.coffee_shops(is_temporary);

-- Update RLS policies to allow access to temporary shops
-- Anyone can read temporary shops
CREATE POLICY "Allow read access to temporary shops" ON public.coffee_shops
    FOR SELECT USING (is_temporary = true);

-- Anyone can insert temporary shops
CREATE POLICY "Allow insert temporary shops" ON public.coffee_shops
    FOR INSERT WITH CHECK (is_temporary = true);

-- Anyone can update temporary shops
CREATE POLICY "Allow update temporary shops" ON public.coffee_shops
    FOR UPDATE USING (is_temporary = true);

-- Anyone can delete temporary shops
CREATE POLICY "Allow delete temporary shops" ON public.coffee_shops
    FOR DELETE USING (is_temporary = true); 