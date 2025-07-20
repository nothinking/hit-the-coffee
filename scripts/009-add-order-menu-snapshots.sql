-- Add order menu snapshots table to preserve menu state at order creation time
-- This ensures that menu changes don't affect existing order sessions

-- Create the order_menu_snapshots table
CREATE TABLE public.order_menu_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    original_menu_item_id UUID NOT NULL, -- Reference to original menu item (may be deleted later)
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the new table
ALTER TABLE public.order_menu_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_menu_snapshots
CREATE POLICY "Allow public read access to order_menu_snapshots" ON public.order_menu_snapshots FOR SELECT USING (TRUE);
CREATE POLICY "Allow public insert access to order_menu_snapshots" ON public.order_menu_snapshots FOR INSERT WITH CHECK (TRUE);

-- Create index for better performance
CREATE INDEX idx_order_menu_snapshots_order_id ON public.order_menu_snapshots(order_id);
CREATE INDEX idx_order_menu_snapshots_original_menu_item_id ON public.order_menu_snapshots(original_menu_item_id); 