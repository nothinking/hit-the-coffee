-- Allow original_menu_item_id to be nullable in order_menu_snapshots table
-- This enables creating snapshots without a permanent menu item (for quick orders without shops)

ALTER TABLE order_menu_snapshots 
ALTER COLUMN original_menu_item_id DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN order_menu_snapshots.original_menu_item_id IS 'Can be null for snapshots created from quick orders without permanent menu items'; 