-- Migrate existing orders to use menu snapshots
-- This script creates snapshots for all existing orders that don't have them yet

-- Insert snapshots for existing orders that don't have snapshots yet
INSERT INTO public.order_menu_snapshots (order_id, original_menu_item_id, name, description, price)
SELECT DISTINCT
  os.order_id,
  mi.id as original_menu_item_id,
  mi.name,
  mi.description,
  mi.price
FROM public.order_selections os
JOIN public.menu_items mi ON os.menu_item_id = mi.id
LEFT JOIN public.order_menu_snapshots oms ON os.order_id = oms.order_id AND mi.id = oms.original_menu_item_id
WHERE oms.id IS NULL;

-- Update order_selections to reference snapshots
UPDATE public.order_selections 
SET snapshot_id = oms.id
FROM public.order_menu_snapshots oms
WHERE order_selections.order_id = oms.order_id 
  AND order_selections.menu_item_id = oms.original_menu_item_id
  AND order_selections.snapshot_id IS NULL; 