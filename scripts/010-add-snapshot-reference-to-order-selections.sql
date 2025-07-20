-- Add snapshot reference to order_selections table
-- This allows order_selections to reference either original menu_items or snapshots

-- Add snapshot_id column to order_selections table
ALTER TABLE public.order_selections 
ADD COLUMN snapshot_id UUID REFERENCES public.order_menu_snapshots(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_order_selections_snapshot_id ON public.order_selections(snapshot_id);

-- Update RLS policies to allow access to the new column
-- The existing policies should already cover this, but let's make sure
CREATE POLICY "Allow public read access to order_selections with snapshots" ON public.order_selections 
    FOR SELECT USING (TRUE);
CREATE POLICY "Allow public insert access to order_selections with snapshots" ON public.order_selections 
    FOR INSERT WITH CHECK (TRUE); 