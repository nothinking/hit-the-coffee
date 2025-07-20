-- Allow coffee_shop_id to be nullable in orders table
-- This enables creating orders without a shop (for quick orders with only snapshots)

ALTER TABLE orders 
ALTER COLUMN coffee_shop_id DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN orders.coffee_shop_id IS 'Can be null for quick orders that only have snapshots without a permanent shop'; 