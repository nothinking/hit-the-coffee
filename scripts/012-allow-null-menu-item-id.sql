-- Allow menu_item_id to be NULL in order_selections table
-- This is needed because we're now using snapshot_id instead of menu_item_id

-- First, drop the foreign key constraint
ALTER TABLE public.order_selections 
DROP CONSTRAINT IF EXISTS order_selections_menu_item_id_fkey;

-- Then, allow menu_item_id to be NULL
ALTER TABLE public.order_selections 
ALTER COLUMN menu_item_id DROP NOT NULL;

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.order_selections 
ADD CONSTRAINT order_selections_menu_item_id_fkey 
FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL; 